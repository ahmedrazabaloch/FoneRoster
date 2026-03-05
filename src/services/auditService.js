/**
 * auditService.js
 * Fire-and-forget audit logging — never blocks or throws.
 * Only file besides config/firebase.js allowed to import Firestore directly.
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/** Valid action types for type-safety and consistency */
export const AUDIT_ACTIONS = Object.freeze({
    ADD_MEMBER: 'ADD_MEMBER',
    EDIT_MEMBER: 'EDIT_MEMBER',
    DELETE_MEMBER: 'DELETE_MEMBER',
    RESTORE_MEMBER: 'RESTORE_MEMBER',
    TOGGLE_LEAVE: 'TOGGLE_LEAVE',
    ADD_TEAM: 'ADD_TEAM',
    EDIT_TEAM: 'EDIT_TEAM',
    DELETE_TEAM: 'DELETE_TEAM',
    CHANGE_TEAM: 'CHANGE_TEAM',
    EXPORT_CSV: 'EXPORT_CSV',
    // Phase 10 — Admin Lifecycle
    ADMIN_CREATED: 'ADMIN_CREATED',
    ADMIN_UPDATED: 'ADMIN_UPDATED',
    ADMIN_DEACTIVATED: 'ADMIN_DEACTIVATED',
    PERMISSIONS_CHANGED: 'PERMISSIONS_CHANGED',
});

/**
 * @param {Object} params
 * @param {string} params.adminEmail
 * @param {string} params.action       One of AUDIT_ACTIONS
 * @param {string} [params.memberId]   Firestore docId (internal reference only)
 * @param {string} [params.employeeId] Human-readable ID
 * @param {Object} [params.changes]    Delta object of what changed
 */
export async function logActivity({ adminEmail, action, memberId, employeeId, changes }) {
    try {
        await addDoc(collection(db, 'adminActivityLogs'), {
            adminEmail: adminEmail || 'unknown',
            action,
            memberId: memberId || null,
            employeeId: employeeId || null,
            changes: changes || null,
            timestamp: serverTimestamp(),
        });
    } catch (err) {
        console.warn('[AuditService] Log write failed:', err);
    }
}
