/**
 * ProtectedRoute.jsx — Role-Enforced Route Guard (Unified Auth)
 *
 * Usage:
 *   <ProtectedRoute requiredRole="admin">
 *     <AdminPage />
 *   </ProtectedRoute>
 *
 * Behavior:
 *   1. Loading → spinner
 *   2. Not authenticated → redirect to /login
 *   3. Role insufficient → "Access Denied" page (no redirect)
 *   4. Role sufficient → render children
 *
 * Role is checked using meetsMinimumRole() which compares role hierarchy levels.
 * Roles come exclusively from Firebase custom claims via AuthContext.
 */
import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { meetsMinimumRole, ROLES, getDefaultRouteForRole } from '../utils/rbac';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ShieldOff } from 'lucide-react';

export const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, role, isLoading } = useAuth();

    // Auth still initialising — always show spinner, never flash Access Denied
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner message="Checking authentication..." />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Role check — if requiredRole is specified and user doesn't meet it
    if (requiredRole && !meetsMinimumRole(role, requiredRole)) {
        return <AccessDenied userRole={role} requiredRole={requiredRole} />;
    }

    return children;
};

/**
 * Inline Access Denied component — brutalist style.
 * Shown when user is authenticated but role is insufficient.
 */
const AccessDenied = ({ userRole, requiredRole }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white border-4 border-black shadow-brutal-lg p-8 text-center">
                <div className="bg-red-600 p-3 border-2 border-black shadow-brutal-sm inline-block mb-6">
                    <ShieldOff className="text-white" size={32} />
                </div>

                <h2 className="text-3xl font-black uppercase mb-2 tracking-wide">
                    Access Denied
                </h2>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">
                    Insufficient Permissions
                </p>

                <div className="bg-gray-100 border-2 border-black p-4 mb-6 text-left">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Your Role</div>
                    <div className="font-black text-sm uppercase">{userRole}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase mt-3 mb-1">Required</div>
                    <div className="font-black text-sm uppercase text-red-600">{requiredRole}</div>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="w-full py-3 font-black text-sm uppercase tracking-wide border-2 border-black shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all bg-gray-900 text-white"
                >
                    Return to Dashboard
                </button>
            </div>
        </div>
    );
};
