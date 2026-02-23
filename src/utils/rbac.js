/**
 * rbac.js — Role-Based Access Control
 *
 * Roles (set via Firebase Custom Claims):
 *   superadmin  → full access including config changes
 *   admin       → full CRUD on employees and teams (no config)
 *   viewer      → read-only (no write operations)
 *
 * Enforcement is server-side via Firebase Security Rules.
 * Client-side enforcement here is defense-in-depth only.
 */

export const ROLES = Object.freeze({
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    VIEWER: 'viewer',
});

/**
 * Extract role from Firebase custom claims token result.
 * @param {import('firebase/auth').IdTokenResult} tokenResult
 * @returns {string} role
 */
export function getRoleFromToken(tokenResult) {
    return tokenResult?.claims?.role || ROLES.VIEWER;
}

/**
 * Returns true if the given role can perform the given action.
 *
 * Permission matrix:
 *   viewer       → none (read-only, enforced server-side)
 *   admin        → CRUD employees, CRUD teams
 *   superadmin   → all of the above + config changes
 */
export function hasPermission(role, action) {
    const perms = {
        [ROLES.VIEWER]: [],
        [ROLES.ADMIN]: ['employees:write', 'teams:write'],
        [ROLES.SUPERADMIN]: ['employees:write', 'teams:write', 'config:write'],
    };
    return (perms[role] || []).includes(action);
}

/**
 * Guard function for use in service layer or context actions.
 * Throws if the role lacks permission for the action.
 * @param {string} role
 * @param {string} action e.g. 'employees:write'
 */
export function requirePermission(role, action) {
    if (!hasPermission(role, action)) {
        throw new Error(`Unauthorized: role "${role}" cannot perform "${action}"`);
    }
}

/**
 * React hook-compatible function to read role from AuthContext user.
 * Call this inside components or context.
 */
export async function getUserRole(user) {
    if (!user) return ROLES.VIEWER;
    try {
        const tokenResult = await user.getIdTokenResult();
        return getRoleFromToken(tokenResult);
    } catch {
        return ROLES.VIEWER;
    }
}
