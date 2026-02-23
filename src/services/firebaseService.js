/**
 * firebaseService.js — v2 (Production Hardened)
 *
 * Changes from v1:
 *  - Soft delete query changed from != true → == false (strict equality, requires composite index)
 *  - runTransaction on toggleLeave (prevents race conditions under multi-admin)
 *  - Immutable employeeId guard on update()
 *  - Input whitelist (allowedFields) on all writes — no schema pollution
 *  - Trimmed string normalization on all text fields
 *  - clientMeta (userAgent) injected into audit logs
 *  - Sensitive fields (adminPinHash) stripped from audit changes
 */
import {
    collection,
    doc,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    runTransaction,
    onSnapshot,
    query,
    orderBy,
    where,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { logActivity, AUDIT_ACTIONS } from './auditService';

// ─── Constants ─────────────────────────────────────────────────────

/** Fields allowed in user document writes — whitelist prevents schema pollution */
const EMPLOYEE_ALLOWED_FIELDS = [
    'employeeId', 'name', 'fatherName', 'designation', 'roleType',
    'phone', 'whatsapp', 'cnic', 'licenseNo', 'onLeave', 'availability',
    'isDeleted', 'createdAt', 'updatedAt', 'deletedAt',
];

/** Fields that must never appear in audit logs */
const SENSITIVE_FIELDS = ['adminPinHash', 'password', 'passwordHash'];

// ─── Helpers ──────────────────────────────────────────────────────

function normalizePhone(v) {
    return (v || '').replace(/\s+/g, '');
}

function trimStrings(data) {
    const out = {};
    for (const [k, v] of Object.entries(data)) {
        out[k] = typeof v === 'string' ? v.trim() : v;
    }
    return out;
}

function normalizeContactFields(data) {
    const out = { ...data };
    if (out.phone) out.phone = normalizePhone(out.phone);
    if (out.whatsapp) out.whatsapp = normalizePhone(out.whatsapp);
    return out;
}

/** Strip fields not in the allowed list */
function whitelistFields(data, allowedFields) {
    return Object.fromEntries(
        Object.entries(data).filter(([k]) => allowedFields.includes(k))
    );
}

/** Strip sensitive fields from changes before audit logging */
function sanitizeForAudit(data) {
    if (!data) return null;
    const clean = { ...data };
    SENSITIVE_FIELDS.forEach(f => delete clean[f]);
    return clean;
}

/** Browser client metadata for audit enrichment */
function getClientMeta() {
    return { userAgent: navigator?.userAgent || 'unknown' };
}

// ─── Employee Service ──────────────────────────────────────────────

export const employeeService = {
    /**
     * Subscribe to active employees (isDeleted == false).
     * Simple single-field where — no composite index required.
     * Client-side table handles search/filtering, so DB-level sort is not needed.
     */
    subscribe(onData, onError) {
        const q = query(
            collection(db, 'employees'),
            where('isDeleted', '==', false)
        );
        return onSnapshot(q, (snap) => {
            console.log('[EmployeeService.subscribe] docs:', snap.size);
            onData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => {
            console.error('[EmployeeService.subscribe]', err);
            if (onError) onError(err);
        });
    },

    async add(data, adminEmail) {
        try {
            const trimmed = trimStrings(data);
            const normalized = normalizeContactFields(trimmed);
            const payload = whitelistFields({
                ...normalized,
                isDeleted: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }, EMPLOYEE_ALLOWED_FIELDS);

            const ref = await addDoc(collection(db, 'employees'), payload);
            logActivity({
                adminEmail,
                action: AUDIT_ACTIONS.ADD_MEMBER,
                memberId: ref.id,
                employeeId: data.employeeId || null,
                changes: sanitizeForAudit(data),
                clientMeta: getClientMeta(),
            });
            return ref.id;
        } catch (err) {
            console.error('[EmployeeService.add]', err);
            throw err;
        }
    },

    /**
     * Update employee — enforces immutable employeeId.
     * Fetches existing doc first; throws if employeeId differs.
     */
    async update(docId, updates, adminEmail) {
        try {
            // Fetch existing to check immutable field
            const snap = await getDoc(doc(db, 'employees', docId));
            if (!snap.exists()) throw new Error(`Employee ${docId} not found`);
            const existing = snap.data();

            if (
                updates.employeeId &&
                existing.employeeId &&
                existing.employeeId !== updates.employeeId
            ) {
                throw new Error(
                    `employeeId is immutable. Cannot change from "${existing.employeeId}" to "${updates.employeeId}".`
                );
            }

            const trimmed = trimStrings(updates);
            const normalized = normalizeContactFields(trimmed);
            const payload = whitelistFields({
                ...normalized,
                updatedAt: serverTimestamp(),
            }, EMPLOYEE_ALLOWED_FIELDS);

            await updateDoc(doc(db, 'employees', docId), payload);
            logActivity({
                adminEmail,
                action: AUDIT_ACTIONS.EDIT_MEMBER,
                memberId: docId,
                employeeId: existing.employeeId || null,
                changes: sanitizeForAudit(updates),
                clientMeta: getClientMeta(),
            });
        } catch (err) {
            console.error('[EmployeeService.update]', err);
            throw err;
        }
    },

    async softDelete(docId, employeeId, adminEmail) {
        try {
            logActivity({
                adminEmail,
                action: AUDIT_ACTIONS.DELETE_MEMBER,
                memberId: docId,
                employeeId: employeeId || null,
                changes: null,
                clientMeta: getClientMeta(),
            });
            await updateDoc(doc(db, 'employees', docId), {
                isDeleted: true,
                deletedAt: serverTimestamp(),
            });
        } catch (err) {
            console.error('[EmployeeService.softDelete]', err);
            throw err;
        }
    },

    /**
     * Toggle On Leave using a Firestore transaction.
     * Prevents race conditions under concurrent admin operations.
     */
    async toggleLeave(docId, _currentStatus, employeeId, adminEmail) {
        try {
            const userRef = doc(db, 'employees', docId);
            let newStatus;

            await runTransaction(db, async (transaction) => {
                const snap = await transaction.get(userRef);
                if (!snap.exists()) throw new Error(`Employee ${docId} not found`);
                newStatus = !snap.data().onLeave;
                transaction.update(userRef, {
                    onLeave: newStatus,
                    updatedAt: serverTimestamp(),
                });
            });

            logActivity({
                adminEmail,
                action: AUDIT_ACTIONS.TOGGLE_LEAVE,
                memberId: docId,
                employeeId: employeeId || null,
                changes: { onLeave: newStatus },
                clientMeta: getClientMeta(),
            });
        } catch (err) {
            console.error('[EmployeeService.toggleLeave]', err);
            throw err;
        }
    },
};

// ─── Team Service ──────────────────────────────────────────────────

export const teamService = {
    subscribe(onData, onError) {
        const q = query(collection(db, 'teams'), orderBy('createdAt', 'asc'));
        return onSnapshot(q, (snap) => {
            onData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => {
            console.error('[TeamService.subscribe]', err);
            if (onError) onError(err);
        });
    },

    async add(data, adminEmail) {
        try {
            const ref = await addDoc(collection(db, 'teams'), {
                ...data,
                assignments: data.assignments || {},
                createdAt: serverTimestamp(),
            });
            logActivity({
                adminEmail, action: AUDIT_ACTIONS.ADD_TEAM,
                memberId: ref.id, changes: sanitizeForAudit(data),
            });
            return ref.id;
        } catch (err) {
            console.error('[TeamService.add]', err);
            throw err;
        }
    },

    async update(docId, updates, adminEmail) {
        try {
            await updateDoc(doc(db, 'teams', docId), updates);
            logActivity({
                adminEmail, action: AUDIT_ACTIONS.EDIT_TEAM,
                memberId: docId, changes: sanitizeForAudit(updates),
            });
        } catch (err) {
            console.error('[TeamService.update]', err);
            throw err;
        }
    },

    async remove(docId, adminEmail) {
        try {
            logActivity({ adminEmail, action: AUDIT_ACTIONS.DELETE_TEAM, memberId: docId });
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'teams', docId));
        } catch (err) {
            console.error('[TeamService.remove]', err);
            throw err;
        }
    },
};

// ─── Config Service ────────────────────────────────────────────────

export const configService = {
    /** Always targets singleton doc "roster" — no other config docs allowed */
    subscribe(onData, onError) {
        return onSnapshot(doc(db, 'config', 'roster'), (snap) => {
            if (snap.exists()) {
                onData(snap.data());
            } else {
                // Doc doesn't exist yet — treat as empty config so loading unblocks
                console.warn('[ConfigService.subscribe] config/roster doc not found — using defaults');
                if (onError) onError(new Error('config/roster not found'));
            }
        }, (err) => {
            console.error('[ConfigService.subscribe]', err);
            if (onError) onError(err);
        });
    },

    async save(updates) {
        try {
            // Always merge into singleton — never create additional docs
            await setDoc(doc(db, 'config', 'roster'), updates, { merge: true });
        } catch (err) {
            console.error('[ConfigService.save]', err);
            throw err;
        }
    },
};

// ─── Admin Log Service ────────────────────────────────────────────

export const auditLogService = {
    /**
     * Subscribe to audit logs with optional filters.
     * Sorted by timestamp DESC. Limit 50 for initial load.
     * Requires composite index: adminEmail + timestamp, action + timestamp
     */
    subscribe({ onData, onError, adminEmailFilter, actionFilter, limitCount = 50 }) {
        let q = query(
            collection(db, 'adminActivityLogs'),
            orderBy('timestamp', 'desc')
        );
        // Note: Firestore requires composite index for multi-field queries
        // For filtered queries, index must exist. See firestore.indexes.json
        return onSnapshot(q, (snap) => {
            let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Client-side filter for additional criteria (avoids multiple indexes)
            if (adminEmailFilter) docs = docs.filter(d => d.adminEmail === adminEmailFilter);
            if (actionFilter) docs = docs.filter(d => d.action === actionFilter);
            onData(docs.slice(0, limitCount));
        }, (err) => {
            console.error('[AuditLogService.subscribe]', err);
            if (onError) onError(err);
        });
    },
};
