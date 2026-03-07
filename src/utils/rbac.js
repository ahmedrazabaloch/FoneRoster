/**
 * rbac.js — Role-Based Access Control (Unified Auth Architecture)
 *
 * 4-Role System (set EXCLUSIVELY via Firebase Custom Claims):
 *   SUPER_ADMIN  → full access: config, user mgmt, CRUD, roster
 *   ADMIN        → full CRUD on employees, teams, vehicles. No user mgmt.
 *   TEAM_USER    → read-only roster view, no write operations
 *   PUBLIC       → implicit (no login), dashboard only
 *
 * IMPORTANT: Roles are resolved ONLY from Firebase custom claims (request.auth.token.role).
 * No hardcoded email checks. No Firestore role fallback for auth decisions.
 *
 * Enforcement layers:
 *   1. Firestore Security Rules (server-side, source of truth)
 *   2. RosterContext action guards (client-side, defense-in-depth)
 *   3. ProtectedRoute (UI gating by role)
 */

// ─── Role Constants ────────────────────────────────────────────────

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
export const ROLE_LEVEL = Object.freeze({
    [ROLES.PUBLIC]: 0,
    [ROLES.TEAM_USER]: 1,
    [ROLES.ADMIN]: 2,
    [ROLES.SUPER_ADMIN]: 3,
});

// ─── Action Permissions ────────────────────────────────────────────

/**
 * All available permission actions in the system.
 * Used for fine-grained feature access control.
 */
export const ACTIONS = Object.freeze({
    // Data access
    EMPLOYEES_READ: 'employees:read',
    EMPLOYEES_WRITE: 'employees:write',
    TEAMS_READ: 'teams:read',
    TEAMS_WRITE: 'teams:write',
    VEHICLES_READ: 'vehicles:read',
    VEHICLES_WRITE: 'vehicles:write',
    
    // Admin features
    CONFIG_READ: 'config:read',
    CONFIG_WRITE: 'config:write',
    LOGS_READ: 'logs:read',
    EXPORTS: 'exports',
    ROSTER_CONTROL: 'roster:control',
    
    // Superadmin-only features
    ADMIN_MANAGE: 'admin:manage',         // User management
    SYSTEM_CONFIG: 'system:config',       // System configuration
    AUTHORITY_CONFIG: 'authority:config', // Authority signature
    GLOBAL_SETTINGS: 'global:settings',   // Global settings
});

/**
 * Permission matrix — maps each role to its allowed actions.
 * Superadmin inherits all admin permissions plus superadmin-only features.
 */
export const PERMISSION_MAP = Object.freeze({
    [ROLES.PUBLIC]: [],
    [ROLES.TEAM_USER]: [
        ACTIONS.EMPLOYEES_READ,
        ACTIONS.TEAMS_READ,
        ACTIONS.VEHICLES_READ,
        ACTIONS.CONFIG_READ,
    ],
    [ROLES.ADMIN]: [
        ACTIONS.EMPLOYEES_READ,
        ACTIONS.EMPLOYEES_WRITE,
        ACTIONS.TEAMS_READ,
        ACTIONS.TEAMS_WRITE,
        ACTIONS.VEHICLES_READ,
        ACTIONS.VEHICLES_WRITE,
        ACTIONS.CONFIG_READ,
        ACTIONS.LOGS_READ,
        ACTIONS.EXPORTS,
        ACTIONS.ROSTER_CONTROL,
    ],
    [ROLES.SUPER_ADMIN]: [
        // Inherits all admin permissions
        ACTIONS.EMPLOYEES_READ,
        ACTIONS.EMPLOYEES_WRITE,
        ACTIONS.TEAMS_READ,
        ACTIONS.TEAMS_WRITE,
        ACTIONS.VEHICLES_READ,
        ACTIONS.VEHICLES_WRITE,
        ACTIONS.CONFIG_READ,
        ACTIONS.CONFIG_WRITE,
        ACTIONS.LOGS_READ,
        ACTIONS.EXPORTS,
        ACTIONS.ROSTER_CONTROL,
        // Superadmin-only permissions
        ACTIONS.ADMIN_MANAGE,
        ACTIONS.SYSTEM_CONFIG,
        ACTIONS.AUTHORITY_CONFIG,
        ACTIONS.GLOBAL_SETTINGS,
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
 * Get all permissions for a given role.
 * @param {string} role - User role
 * @returns {string[]} Array of permission actions
 */
export function getPermissionsForRole(role) {
    return PERMISSION_MAP[role] || [];
}

/**
 * Check if role is at least admin level.
 * @param {string} role - User role
 * @returns {boolean}
 */
export function isAdminRole(role) {
    return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

/**
 * Check if role is superadmin.
 * @param {string} role - User role
 * @returns {boolean}
 */
export function isSuperAdminRole(role) {
    return role === ROLES.SUPER_ADMIN;
}

/**
 * Get the default redirect route for a given role.
 * @param {string} role - User role
 * @returns {string} Route path
 */
export function getDefaultRouteForRole(role) {
    switch (role) {
        case ROLES.SUPER_ADMIN:
        case ROLES.ADMIN:
            return '/admin';
        case ROLES.TEAM_USER:
            return '/team';
        default:
            return '/';
    }
}

/**
 * React-compatible async function to read role from Firebase user.
 * Role is obtained EXCLUSIVELY from Firebase custom claims.
 * @param {FirebaseUser} user - Firebase user object
 * @param {boolean} forceRefresh - Force token refresh to get latest claims
 * @returns {Promise<string>} Role string
 */
export async function getUserRole(user, forceRefresh = false) {
    if (!user) return ROLES.PUBLIC;
    try {
        const tokenResult = await user.getIdTokenResult(forceRefresh);
        return getRoleFromToken(tokenResult);
    } catch {
        return ROLES.PUBLIC;
    }
}
