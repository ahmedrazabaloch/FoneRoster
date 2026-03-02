/**
 * rbac.js — Role-Based Access Control (Phase 2)
 *
 * 4-Role System (set via Firebase Custom Claims):
 *   SUPER_ADMIN  → full access: config, user mgmt, CRUD, roster
 *   ADMIN        → full CRUD on employees, teams, vehicles. No config.
 *   TEAM_USER    → read-only roster view, no write operations
 *   PUBLIC       → implicit (no login), dashboard only
 *
 * Enforcement layers:
 *   1. Firestore Security Rules (server-side, source of truth)
 *   2. RosterContext action guards (client-side, defense-in-depth)
 *   3. ProtectedRoute (UI gating by role)
 */

export const ROLES = Object.freeze({
    SUPER_ADMIN: 'superadmin',
    ADMIN: 'admin',
    TEAM_USER: 'team_user',
    PUBLIC: 'public',
});

/**
 * Hierarchy level for comparison.
 * Higher number = more privilege.
 */
const ROLE_LEVEL = Object.freeze({
    [ROLES.PUBLIC]: 0,
    [ROLES.TEAM_USER]: 1,
    [ROLES.ADMIN]: 2,
    [ROLES.SUPER_ADMIN]: 3,
});

/**
 * Permission matrix — maps each role to its allowed actions.
 */
const PERMISSION_MAP = Object.freeze({
    [ROLES.PUBLIC]: [],
    [ROLES.TEAM_USER]: [
        'employees:read',
        'teams:read',
    ],
    [ROLES.ADMIN]: [
        'employees:read',
        'employees:write',
        'teams:read',
        'teams:write',
        'vehicles:write',
        'logs:read',
    ],
    [ROLES.SUPER_ADMIN]: [
        'employees:read',
        'employees:write',
        'teams:read',
        'teams:write',
        'vehicles:write',
        'config:write',
        'users:manage',
        'logs:read',
    ],
});

/**
 * Extract role from Firebase custom claims token result.
 * Handles backward-compat: "viewer" → TEAM_USER
 */
export function getRoleFromToken(tokenResult) {
    const raw = tokenResult?.claims?.role;
    if (!raw) return ROLES.PUBLIC;
    // Backward compat: old "viewer" claim maps to TEAM_USER
    if (raw === 'viewer') return ROLES.TEAM_USER;
    // Validate against known roles
    if (Object.values(ROLES).includes(raw)) return raw;
    return ROLES.PUBLIC;
}

/**
 * Returns true if the given role can perform the given action.
 */
export function hasPermission(role, action) {
    return (PERMISSION_MAP[role] || []).includes(action);
}

/**
 * Guard function — throws if the role lacks permission.
 * Call at the top of every write action in RosterContext.
 * @param {string} role - Current user role
 * @param {string} action - e.g. 'employees:write'
 * @throws {Error} with descriptive message
 */
export function requirePermission(role, action) {
    if (!hasPermission(role, action)) {
        const msg = `Access denied: "${role}" role cannot perform "${action}"`;
        throw new Error(msg);
    }
}

/**
 * Returns true if userRole meets or exceeds the required role level.
 * Used by ProtectedRoute to gate entire pages.
 * @param {string} userRole - Current user role
 * @param {string} requiredRole - Minimum role needed
 */
export function meetsMinimumRole(userRole, requiredRole) {
    const userLevel = ROLE_LEVEL[userRole] ?? 0;
    const requiredLevel = ROLE_LEVEL[requiredRole] ?? 0;
    return userLevel >= requiredLevel;
}

/**
 * React-compatible async function to read role from Firebase user.
 */
export async function getUserRole(user) {
    if (!user) return ROLES.PUBLIC;
    try {
        const tokenResult = await user.getIdTokenResult();
        return getRoleFromToken(tokenResult);
    } catch {
        return ROLES.PUBLIC;
    }
}
