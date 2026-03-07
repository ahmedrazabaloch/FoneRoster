/**
 * routes.jsx — Centralized Route Configuration
 *
 * Route structure:
 *   /               → DashboardPage (PUBLIC - always accessible)
 *   /search         → SearchPage (PUBLIC)
 *   /login          → LoginPage (PUBLIC)
 *   /verify/:id     → VerifyPage (PUBLIC)
 *   /team           → TeamPage (TEAM_USER+)
 *   /admin          → AdminPage (ADMIN, SUPER_ADMIN) - Unified admin dashboard
 *   /admin/logs     → LogsPage (ADMIN, SUPER_ADMIN)
 *
 * The /admin route serves as the unified dashboard for both admin and superadmin.
 * Superadmin-specific features are shown via role-based sidebar navigation.
 */
import React, { lazy } from 'react';
import { ProtectedRoute } from '../auth/ProtectedRoute';

// Lazy load pages for code splitting
// New architecture paths
export const DashboardPage = lazy(() =>
    import('../dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
);

export const AdminPage = lazy(() =>
    import('../admin/pages/AdminPage').then(m => ({ default: m.AdminPage }))
);

export const LoginPage = lazy(() =>
    import('../auth/LoginPage').then(m => ({ default: m.LoginPage }))
);

// Legacy paths (not yet migrated)
export const SearchPage = lazy(() =>
    import('../pages/SearchPage').then(m => ({ default: m.SearchPage }))
);

export const LogsPage = lazy(() =>
    import('../pages/LogsPage').then(m => ({ default: m.LogsPage }))
);

export const TeamPage = lazy(() =>
    import('../pages/TeamPage').then(m => ({ default: m.TeamPage }))
);

export const VerifyPage = lazy(() =>
    import('../pages/VerifyPage').then(m => ({ default: m.VerifyPage }))
);

/**
 * Route configuration object
 * Used by AppLayout to render routes
 */
export const routeConfig = [
    {
        path: '/',
        element: <DashboardPage />,
        public: true,
    },
    {
        path: '/search',
        element: <SearchPage />,
        public: true,
    },
    {
        path: '/login',
        element: <LoginPage />,
        public: true,
    },
    {
        path: '/verify/:id',
        element: <VerifyPage />,
        public: true,
    },
    {
        path: '/team',
        element: (
            <ProtectedRoute requiredRole="team_user">
                <TeamPage />
            </ProtectedRoute>
        ),
        public: false,
    },
    {
        path: '/admin',
        element: (
            <ProtectedRoute requiredRole="admin">
                <AdminPage />
            </ProtectedRoute>
        ),
        public: false,
    },
    {
        path: '/admin/logs',
        element: (
            <ProtectedRoute requiredRole="admin">
                <LogsPage />
            </ProtectedRoute>
        ),
        public: false,
    },
];
