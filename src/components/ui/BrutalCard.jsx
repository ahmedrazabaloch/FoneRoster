/**
 * BrutalCard.jsx — Standard brutalist card container.
 * Use this everywhere a white-background container with hard black border is needed.
 */
import React from 'react';
import { cn } from '../../lib/utils';

export const BrutalCard = ({ children, className, style, ...props }) => (
    <div
        className={cn('bg-white', className)}
        style={{
            border: '2px solid #000',
            boxShadow: '3px 3px 0 #000',
            borderRadius: 4,
            padding: 16,
            ...style,
        }}
        {...props}
    >
        {children}
    </div>
);
