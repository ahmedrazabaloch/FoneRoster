/**
 * AuthContext.jsx — Extended with RBAC role resolution (Phase 2 + Phase 10)
 *
 * Role resolution order:
 *  1. Firebase Custom Claims (SUPER_ADMIN uses this)
 *  2. Firestore admins/{uid}.role fallback (ADMIN / TEAM_USER created via panel)
 *  3. PUBLIC (default when neither exists)
 */
import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserRole, ROLES } from '../utils/rbac';
import { adminService } from '../services/adminService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(ROLES.PUBLIC);
    const [adminProfile, setAdminProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                // ── Step 1: Bootstrap SUPER_ADMIN by email ──────────────
                // This account is always SUPER_ADMIN regardless of claims or Firestore.
                if (firebaseUser.email === 'ahmed@formulaone.com') {
                    setRole(ROLES.SUPER_ADMIN);
                    setAdminProfile(null);
                    setLoading(false);
                    return;
                }

                // ── Step 2: Try Firebase Custom Claims ───────────────────
                const claimRole = await getUserRole(firebaseUser);

                if (claimRole !== ROLES.PUBLIC) {
                    // Has a valid custom claim (e.g. SUPER_ADMIN)
                    setRole(claimRole);
                    setAdminProfile(null);
                } else {
                    // 2. Fallback: check Firestore admins/{uid} (ADMIN / TEAM_USER path)
                    try {
                        const profile = await adminService.getProfile(firebaseUser.uid);
                        if (profile && profile.isActive && profile.role) {
                            setRole(profile.role);
                            setAdminProfile(profile);
                        } else if (profile && !profile.isActive) {
                            // Deactivated admin — sign them out
                            await signOut(auth);
                            setRole(ROLES.PUBLIC);
                            setAdminProfile(null);
                        } else {
                            setRole(ROLES.PUBLIC);
                            setAdminProfile(null);
                        }
                    } catch {
                        setRole(ROLES.PUBLIC);
                        setAdminProfile(null);
                    }
                }
            } else {
                setRole(ROLES.PUBLIC);
                setAdminProfile(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        role,
        adminProfile,   // Firestore profile (null for SUPER_ADMIN or unauthenticated)
        loading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
