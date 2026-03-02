/**
 * AuthContext.jsx — Extended with RBAC role resolution (Phase 2)
 *
 * Role is loaded from Firebase custom claims on login/auth state change.
 * Available via: const { role } = useContext(AuthContext);
 *
 * Roles: SUPER_ADMIN | ADMIN | TEAM_USER | PUBLIC
 */
import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserRole, ROLES } from '../utils/rbac';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(ROLES.PUBLIC);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const resolvedRole = await getUserRole(firebaseUser);
                setRole(resolvedRole);
            } else {
                setRole(ROLES.PUBLIC);
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
        role,       // one of ROLES.PUBLIC | ROLES.TEAM_USER | ROLES.ADMIN | ROLES.SUPER_ADMIN
        loading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

