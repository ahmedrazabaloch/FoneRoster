/**
 * adminService.js — Phase 10 Admin User Management
 *
 * Handles creation and management of ADMIN / TEAM_USER accounts.
 * Roles for these accounts are stored in Firestore (admins collection),
 * NOT in Firebase Custom Claims (which is reserved for SUPER_ADMIN).
 *
 * Login email convention: {phone}@admin.local
 * Phone is stored as a display field in the Firestore profile.
 */
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    deleteUser,
    getAuth,
    initializeAuth,
} from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy,
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { auth, db } from '../config/firebase';
import { logActivity, AUDIT_ACTIONS } from './auditService';

/**
 * Get or create a secondary Firebase app for admin creation.
 * Using a secondary app prevents createUserWithEmailAndPassword from
 * signing out the currently logged-in SUPER_ADMIN.
 */
function getSecondaryAuth() {
    const secondaryAppName = 'admin-creator';
    const existingApp = getApps().find(a => a.name === secondaryAppName);
    if (existingApp) return getAuth(existingApp);
    // Re-use same config as primary app
    const primaryApp = getApps().find(a => a.name === '[DEFAULT]');
    const secondaryApp = initializeApp(primaryApp.options, secondaryAppName);
    return getAuth(secondaryApp);
}

/** Module permission keys */
export const MODULE_PERMISSIONS = Object.freeze([
    { key: 'rosterControl', label: 'Roster Control' },
    { key: 'fieldTeams', label: 'Field Teams' },
    { key: 'hotlineStaff', label: 'Hotline Staff' },
    { key: 'teamDirectory', label: 'Team Directory' },
    { key: 'exports', label: 'Exports' },
    { key: 'auditLogs', label: 'Audit Logs' },
]);

/** Default permissions object — all false */
export const DEFAULT_PERMISSIONS = Object.freeze(
    Object.fromEntries(MODULE_PERMISSIONS.map(m => [m.key, false]))
);

/** Derives the Firebase Auth email from a phone number */
export function phoneToEmail(phone) {
    const cleaned = (phone || '').replace(/\s+/g, '');
    return `${cleaned}@admin.local`;
}

export const adminService = {
    /**
     * Create a new admin account.
     * 1. Creates Firebase Auth user with derived email
     * 2. Writes profile to admins/{uid}
     * 3. Writes audit log
     */
    async createAdmin({ name, phone, password, role, permissions }, creatorEmail) {
        const email = phoneToEmail(phone);

        // Use a secondary auth instance so creating a new user does NOT sign
        // out the currently logged-in SUPER_ADMIN.
        const secondaryAuth = getSecondaryAuth();
        const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const newUser = credential.user;
        const uid = newUser.uid;

        const profileData = {
            uid,
            name: name.trim(),
            phone: phone.trim(),
            role,
            permissions: { ...DEFAULT_PERMISSIONS, ...permissions },
            isActive: true,
            createdBy: creatorEmail,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        try {
            await setDoc(doc(db, 'admins', uid), profileData);
        } catch (firestoreErr) {
            // Rollback: delete auth user if Firestore write fails
            try { await deleteUser(newUser); } catch (_) { /* best effort */ }
            throw firestoreErr;
        }

        logActivity({
            adminEmail: creatorEmail,
            action: AUDIT_ACTIONS.ADMIN_CREATED,
            memberId: uid,
            changes: { name, phone, role, permissions },
        });

        return uid;
    },

    /**
     * Update an admin's name, phone, or role.
     * Does NOT update permissions (use updatePermissions for that).
     */
    async updateAdmin(uid, updates, editorEmail) {
        const payload = {};
        if (updates.name !== undefined) payload.name = updates.name.trim();
        if (updates.phone !== undefined) payload.phone = updates.phone.trim();
        if (updates.role !== undefined) payload.role = updates.role;
        payload.updatedAt = serverTimestamp();

        await updateDoc(doc(db, 'admins', uid), payload);

        logActivity({
            adminEmail: editorEmail,
            action: AUDIT_ACTIONS.ADMIN_UPDATED,
            memberId: uid,
            changes: updates,
        });
    },

    /**
     * Update module-level permissions for an admin.
     */
    async updatePermissions(uid, permissions, editorEmail) {
        await updateDoc(doc(db, 'admins', uid), {
            permissions,
            updatedAt: serverTimestamp(),
        });

        logActivity({
            adminEmail: editorEmail,
            action: AUDIT_ACTIONS.PERMISSIONS_CHANGED,
            memberId: uid,
            changes: { permissions },
        });
    },

    /**
     * Activate or deactivate an admin account.
     * Sets isActive flag in Firestore. Firebase Auth account remains intact.
     */
    async setActiveStatus(uid, isActive, editorEmail) {
        await updateDoc(doc(db, 'admins', uid), {
            isActive,
            updatedAt: serverTimestamp(),
        });

        logActivity({
            adminEmail: editorEmail,
            action: AUDIT_ACTIONS.ADMIN_DEACTIVATED,
            memberId: uid,
            changes: { isActive },
        });
    },

    /**
     * Reset an admin's password. Sends a Firebase password reset email
     * to the derived admin.local address.
     */
    async sendPasswordReset(phone) {
        const email = phoneToEmail(phone);
        await sendPasswordResetEmail(auth, email);
    },

    /**
     * Read a single admin's Firestore profile (for AuthContext role fallback).
     */
    async getProfile(uid) {
        const snap = await getDoc(doc(db, 'admins', uid));
        if (!snap.exists()) return null;
        return { uid, ...snap.data() };
    },

    /**
     * Real-time listener for all admin profiles.
     * Used by the User Management panel.
     */
    subscribeAll(onData, onError) {
        const q = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => {
            onData(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
        }, err => {
            console.error('[AdminService.subscribeAll]', err);
            if (onError) onError(err);
        });
    },
};
