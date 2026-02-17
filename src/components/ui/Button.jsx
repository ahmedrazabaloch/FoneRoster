import React from 'react';
import { cn } from '../../lib/utils';

const variants = {
    primary: 'bg-red-600 text-white hover:bg-red-700',
    secondary: 'bg-black text-white hover:bg-gray-900',
    ghost: 'bg-white text-gray-900 hover:bg-gray-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-green-500 text-white hover:bg-green-600',
};

const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
};

export const Button = React.forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    className,
    disabled,
    ...props
}, ref) => {
    return (
        <button
            ref={ref}
            disabled={disabled}
            className={cn(
                'font-black uppercase tracking-wide border-2 border-black shadow-brutal',
                'transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-brutal-active',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = 'Button';
