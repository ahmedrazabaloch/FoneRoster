/**
 * BrutalInput.jsx — Standard brutalist text input.
 * Enforces min-height 44px, 2px black border, red state on error.
 */
import React from 'react';
import { cn } from '../../lib/utils';

export const BrutalInput = React.forwardRef(({
    label,
    error,
    hint,
    className,
    mono,
    style,
    ...props
}, ref) => (
    <div className="w-full">
        {label && (
            <label className="block text-xs font-bold uppercase mb-1 text-gray-700">
                {label}
            </label>
        )}
        <input
            ref={ref}
            className={cn(
                'w-full font-bold focus:outline-none transition-all bg-gray-50 focus:bg-white',
                mono && 'font-mono',
                error && 'border-red-600 bg-red-50',
                className
            )}
            style={{
                minHeight: 44,
                border: error ? '2px solid #dc2626' : '2px solid #000',
                borderRadius: 2,
                padding: '0 10px',
                fontSize: 13,
                boxSizing: 'border-box',
                ...style,
            }}
            {...props}
        />
        {hint && !error && (
            <p className="text-xs text-gray-400 mt-1">{hint}</p>
        )}
        {error && (
            <p className="text-xs text-red-600 font-bold mt-1">{error}</p>
        )}
    </div>
));

BrutalInput.displayName = 'BrutalInput';
