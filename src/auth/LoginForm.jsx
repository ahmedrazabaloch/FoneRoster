/**
 * LoginForm.jsx — Unified Login Component
 *
 * Single login page for all user roles: SUPER_ADMIN, ADMIN, TEAM_USER.
 *
 * Identifier field accepts:
 *  - Email address  → passed directly to Firebase Auth
 *  - Phone number   → converted to {phone}@admin.local before Firebase Auth
 *
 * Post-login redirect is role-aware using getDefaultRouteForRole():
 *  - SUPER_ADMIN → /admin
 *  - ADMIN       → /admin
 *  - TEAM_USER   → /team
 *  - PUBLIC      → / (dashboard)
 *
 * Role is resolved exclusively from Firebase custom claims.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { loginSchema } from './validators';
import { Card, Button } from '../components/ui';
import { getDefaultRouteForRole } from '../utils/rbac';
import { phoneToEmail } from '../services/adminService';

/** Determine if the identifier looks like a phone number (starts with 03, 11 digits) */
function looksLikePhone(identifier) {
    return /^03[\d\s\-]{9,11}$/.test(identifier.trim());
}

/** Convert identifier to Firebase Auth email */
function toFirebaseEmail(identifier) {
    const trimmed = identifier.trim();
    if (looksLikePhone(trimmed)) {
        const digits = trimmed.replace(/[\s\-]/g, '');
        return phoneToEmail(digits);
    }
    return trimmed.toLowerCase();
}

export const LoginForm = () => {
    const navigate = useNavigate();
    const { login, role, user, isLoading: authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: zodResolver(loginSchema) });

    // If already authenticated, redirect based on role
    useEffect(() => {
        if (!authLoading && user) {
            const targetRoute = getDefaultRouteForRole(role);
            navigate(targetRoute, { replace: true });
        }
    }, [authLoading, user, role, navigate]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        const firebaseEmail = toFirebaseEmail(data.identifier);
        const result = await login(firebaseEmail, data.password);
        setIsLoading(false);

        if (result.success) {
            toast.success('Login successful!');
            // Role resolution happens via AuthContext — redirect handled by useEffect
        } else {
            // Provide a friendly error for wrong credentials, without exposing internals
            const msg = result.error?.includes('invalid-credential') || result.error?.includes('wrong-password')
                ? 'Invalid credentials. Check your phone/email and password.'
                : result.error || 'Login failed';
            toast.error(msg);
        }
    };

    const LABEL = 'block text-xs font-bold uppercase mb-1 text-gray-700';
    const INPUT_BASE = 'w-full border-2 border-black p-2 font-bold focus:outline-none focus:shadow-brutal-sm bg-gray-50 focus:bg-white transition-all';

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
            <Card className="max-w-md w-full">
                <div className="mb-6 flex justify-center">
                    <div className="bg-red-600 p-3 border-2 border-black rounded-none shadow-brutal-sm">
                        <Shield className="text-white" size={32} />
                    </div>
                </div>
                <h2 className="text-3xl font-black uppercase mb-2 tracking-wide text-center">Admin Access</h2>
                <p className="text-xs font-bold text-gray-500 uppercase mb-8 tracking-widest text-center">
                    Restricted Area
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Identifier — email or phone */}
                    <div>
                        <label className={LABEL}>Email or Phone Number</label>
                        <input
                            type="text"
                            placeholder="admin@example.com or 03131234567"
                            {...register('identifier')}
                            style={{ minHeight: 44 }}
                            className={INPUT_BASE + (errors.identifier ? ' border-red-600 bg-red-50' : '')}
                            autoComplete="username"
                            inputMode="email"
                        />
                        {errors.identifier && (
                            <p className="text-xs text-red-600 font-bold mt-1">{errors.identifier.message}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label className={LABEL}>Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••"
                                {...register('password')}
                                style={{ minHeight: 44, paddingRight: 42 }}
                                className={INPUT_BASE + ' pr-10' + (errors.password ? ' border-red-600 bg-red-50' : '')}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 focus:outline-none"
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-xs text-red-600 font-bold mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full mt-4"
                        disabled={isLoading || authLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Enter Command Center'}
                    </Button>

                    <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest pt-2">
                        Super Admin uses email · Admins use phone number
                    </p>
                </form>
            </Card>
        </div>
    );
};
