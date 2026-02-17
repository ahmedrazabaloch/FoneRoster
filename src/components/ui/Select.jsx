import React from 'react';
import { cn } from '../../lib/utils';

export const Select = React.forwardRef(({
    label,
    error,
    children,
    className,
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-bold uppercase mb-1 text-gray-700">
                    {label}
                </label>
            )}
            <select
                ref={ref}
                className={cn(
                    'w-full border-2 border-black p-2 font-bold bg-white',
                    'focus:outline-none focus:shadow-brutal-sm',
                    'transition-all',
                    error && 'border-red-600 bg-red-50',
                    className
                )}
                {...props}
            >
                {children}
            </select>
            {error && (
                <p className="text-xs text-red-600 font-bold mt-1">{error}</p>
            )}
        </div>
    );
});

Select.displayName = 'Select';
