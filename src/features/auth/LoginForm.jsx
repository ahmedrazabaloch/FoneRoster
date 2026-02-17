import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema } from '../../lib/validators';
import { Card, Button, Input } from '../../components/ui';

export const LoginForm = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

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

                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••"
                        error={errors.password?.message}
                        {...register('password')}
                    />

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
