import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({
    label,
    error,
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
            <input
                ref={ref}
                className={cn(
                    'w-full border-2 border-black p-2 font-bold',
                    'focus:outline-none focus:shadow-brutal-sm bg-gray-50 focus:bg-white',
                    'transition-all',
                    error && 'border-red-600 bg-red-50',
                    className
                )}
                {...props}
            />
            {error && (
                <p className="text-xs text-red-600 font-bold mt-1">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
