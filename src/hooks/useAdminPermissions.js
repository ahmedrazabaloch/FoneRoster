/**
 * useAdminPermissions.js — Phase 10
 *
 * Returns module-level permission flags for the currently logged-in user.
 * - SUPER_ADMIN: all permissions are true (bypasses Firestore)
 * - ADMIN / TEAM_USER: reads from adminProfile in AuthContext
 * - PUBLIC: all permissions false
 */
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ROLES } from '../utils/rbac';
import { DEFAULT_PERMISSIONS } from '../services/adminService';

export function useAdminPermissions() {
    const { role, adminProfile } = useContext(AuthContext);

    // SUPER_ADMIN has unrestricted access to everything
    if (role === ROLES.SUPER_ADMIN) {
        return Object.fromEntries(
            Object.keys(DEFAULT_PERMISSIONS).map(k => [k, true])
        );
    }

    // ADMIN or TEAM_USER: use their stored Firestore permissions
    if (adminProfile?.permissions) {
        return { ...DEFAULT_PERMISSIONS, ...adminProfile.permissions };
    }

    // Fallback: no access
    return { ...DEFAULT_PERMISSIONS };
}
