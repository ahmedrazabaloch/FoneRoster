/**
 * useAdminPermissions.js — Module-Level Permissions Hook
 *
 * Returns module-level permission flags for the currently logged-in user.
 * These permissions control which admin panel modules are visible
 * (e.g., fieldTeams, exports, auditLogs).
 *
 * Permission resolution:
 *   - SUPER_ADMIN: all permissions are true (full access)
 *   - ADMIN / TEAM_USER: reads from modulePermissions in AuthContext
 *     (which comes from Firestore admins/{uid}.permissions)
 *   - PUBLIC: all permissions false
 *
 * NOTE: This is separate from role-based authorization.
 * Role determines what actions a user CAN do (enforced by Firestore rules).
 * Module permissions determine which UI panels are VISIBLE.
 */
import { useContext } from 'react';
import { AuthContext } from '../../auth/AuthContext';
import { ROLES, isSuperAdminRole } from '../../utils/rbac';
import { DEFAULT_PERMISSIONS } from '../../services/adminService';

export function useAdminPermissions() {
    const { role, modulePermissions, adminProfile } = useContext(AuthContext);

    // SUPER_ADMIN has unrestricted access to everything
    if (isSuperAdminRole(role)) {
        return Object.fromEntries(
            Object.keys(DEFAULT_PERMISSIONS).map(k => [k, true])
        );
    }

    // Use modulePermissions from AuthContext (unified architecture)
    // Fall back to adminProfile.permissions for backward compatibility
    const perms = modulePermissions || adminProfile?.permissions;
    if (perms) {
        return { ...DEFAULT_PERMISSIONS, ...perms };
    }

    // Fallback: no module access
    return { ...DEFAULT_PERMISSIONS };
}
