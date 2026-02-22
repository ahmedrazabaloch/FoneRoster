import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema } from '../../lib/validators';
import { Card, Button, Input } from '../../components/ui';

export const LoginForm = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        const result = await login(data.email, data.password);
        setIsLoading(false);

        if (result.success) {
            toast.success('Login successful!');
            navigate('/admin');
        } else {
            toast.error(result.error || 'Login failed');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
            <Card className="max-w-md w-full">
                <div className="mb-6 flex justify-center">
                    <div className="bg-red-600 p-3 border-2 border-black rounded-none shadow-brutal-sm">
                        <Shield className="text-white" size={32} />
                    </div>
                </div>
                <h2 className="text-3xl font-black uppercase mb-2 tracking-wide text-center">
                    Admin Access
                </h2>
                <p className="text-xs font-bold text-gray-500 uppercase mb-8 tracking-widest text-center">
                    Restricted Area
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="admin@example.com"
                        error={errors.email?.message}
                        {...register('email')}
                    />

                    {/* Password field — custom to support eye toggle */}
                    <div className="w-full">
                        <label className="block text-xs font-bold uppercase mb-1 text-gray-700">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••"
                                {...register('password')}
                                style={{ minHeight: 44, paddingRight: 42 }}
                                className={`w-full border-2 border-black p-2 pr-10 font-bold focus:outline-none focus:shadow-brutal-sm bg-gray-50 focus:bg-white transition-all${errors.password ? ' border-red-600 bg-red-50' : ''}`}
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
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Enter Command Center'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};
