import React from 'react';
import { cn } from '../../lib/utils';

const variants = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const Badge = ({ children, variant = 'default', className, ...props }) => {
    return (
        <span
            className={cn(
                'inline-block px-2 py-1 text-xs font-black uppercase tracking-wider border border-black',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};

Badge.displayName = 'Badge';
