import React from 'react';
import { cn } from '../../lib/utils';

const variants = {
    default: 'bg-white',
    gray: 'bg-gray-50',
    dark: 'bg-gray-900 text-white',
};

export const Card = ({ children, header, footer, variant = 'default', className, ...props }) => {
    return (
        <div
            className={cn(
                'border-4 border-black shadow-brutal-lg',
                variants[variant],
                className
            )}
            {...props}
        >
            {header && (
                <div className="p-4 border-b-4 border-black">
                    {header}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
            {footer && (
                <div className="p-4 border-t-4 border-black">
                    {footer}
                </div>
            )}
        </div>
    );
};

Card.displayName = 'Card';
