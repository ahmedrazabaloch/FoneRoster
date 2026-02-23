/**
 * BrutalButton.jsx — Standard brutalist action button.
 * Handles disabled + loading state. Enforces min-height 48px.
 *
 * Variants: 'primary' (yellow), 'danger' (red), 'success' (green), 'ghost' (white)
 */
import React from 'react';
import { cn } from '../../lib/utils';

const VARIANT_STYLES = {
    primary: { background: '#FACC15', color: '#111827' },
    danger: { background: '#EF4444', color: '#ffffff' },
    success: { background: '#22c55e', color: '#111827' },
    ghost: { background: '#ffffff', color: '#111827' },
};

export const BrutalButton = ({
    children,
    variant = 'primary',
    className,
    disabled,
    saving,
    style,
    ...props
}) => {
    const isDisabled = disabled || saving;
    const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

    return (
        <button
            disabled={isDisabled}
            className={cn('flex items-center justify-center gap-2 font-black uppercase tracking-wide', className)}
            style={{
                minHeight: 48,
                border: '2px solid #000',
                borderRadius: 2,
                boxShadow: isDisabled ? 'none' : '3px 3px 0 #000',
                fontSize: 13,
                letterSpacing: '0.04em',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.65 : 1,
                transition: 'box-shadow 150ms, opacity 150ms',
                whiteSpace: 'nowrap',
                padding: '0 16px',
                ...variantStyle,
                ...style,
            }}
            {...props}
        >
            {children}
        </button>
    );
};
