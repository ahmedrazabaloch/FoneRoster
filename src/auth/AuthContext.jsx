/**
 * AuthContext.jsx — Unified Authentication Architecture
 *
 * Role resolution is EXCLUSIVELY from Firebase Custom Claims:
 *   1. User authenticates via Firebase Auth
 *   2. ID token is retrieved with custom claims
 *   3. Role is extracted from token.role claim
 *   4. Permissions are derived from role via RBAC utilities
 *
 * NO hardcoded email checks.
 * NO Firestore fallback for role resolution.
 *
 * Module-level permissions (for admin panel features) are read from
 * the Firestore admins/{uid} profile, but this does NOT affect the
 * core role which always comes from custom claims.
 *
 * Exposed values:
 *   - user: Firebase user object
 *   - role: Role string from custom claims (ROLES.*)
 *   - permissions: Array of permission actions for current role
 *   - modulePermissions: Module-level permissions from Firestore (admin panel)
 *   - isLoading: Auth state loading flag
 *   - login / logout: Auth methods
 */
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserRole, getPermissionsForRole, ROLES } from '../utils/rbac';
import { adminService } from '../services/adminService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(ROLES.PUBLIC);
    const [modulePermissions, setModulePermissions] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Derive permissions from role using RBAC utility
    const permissions = useMemo(() => getPermissionsForRole(role), [role]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (!firebaseUser) {
                setRole(ROLES.PUBLIC);
                setModulePermissions(null);
                setIsLoading(false);
                return;
            }

            // ── Role Resolution: Firebase Custom Claims ONLY ──────────────
            try {
                // Force refresh to get latest claims (handles recent role changes)
                const resolvedRole = await getUserRole(firebaseUser, true);
                setRole(resolvedRole);

                // ── Module Permissions: Read from Firestore for admin panel features ──
                // This is separate from role-based auth - only affects which admin
                // modules are visible (fieldTeams, exports, etc.)
                if (resolvedRole === ROLES.ADMIN || resolvedRole === ROLES.TEAM_USER) {
                    try {
                        const profile = await adminService.getProfile(firebaseUser.uid);
                        if (profile && profile.isActive) {
                            setModulePermissions(profile.permissions || null);
                        } else if (profile && !profile.isActive) {
                            // Account deactivated — force sign-out
                            await signOut(auth);
                            setRole(ROLES.PUBLIC);
                            setModulePermissions(null);
                            setIsLoading(false);
                            return;
                        } else {
                            setModulePermissions(null);
                        }
                    } catch {
                        // Firestore read failed — module permissions unavailable
                        setModulePermissions(null);
                    }
                } else {
                    // SUPER_ADMIN gets all permissions; PUBLIC gets none
                    setModulePermissions(null);
                }
            } catch {
                // Token retrieval failed — treat as PUBLIC
                setRole(ROLES.PUBLIC);
                setModulePermissions(null);
            }

            setIsLoading(false);
        });

        return unsubscribe;
    }, []);

    /**
     * Refresh the user's role from Firebase custom claims.
     * Call this after role changes (e.g., admin grants new role via Cloud Function).
     */
    const refreshRole = useCallback(async () => {
        if (!user) return;
        try {
            const resolvedRole = await getUserRole(user, true);
            setRole(resolvedRole);
        } catch {
            // Keep current role on error
        }
    }, [user]);

    const login = useCallback(async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const value = useMemo(() => ({
        user,
        role,
        permissions,           // Action permissions derived from role
        modulePermissions,     // Admin panel module permissions from Firestore
        isLoading,
        // Legacy alias for backward compatibility
        loading: isLoading,
        // Deprecated: kept for backward compat with useAdminPermissions
        adminProfile: modulePermissions ? { permissions: modulePermissions } : null,
        // Methods
        login,
        logout,
        refreshRole,
    }), [user, role, permissions, modulePermissions, isLoading, login, logout, refreshRole]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
