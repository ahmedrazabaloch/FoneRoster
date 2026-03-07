/**
 * validators.js — Auth-related Validation Schemas
 *
 * Contains Zod schemas for authentication forms.
 */
import { z } from 'zod';

// Login form validation schema
// Accepts either a full email address OR an 11-digit phone number (03xxxxxxxxx)
export const loginSchema = z.object({
    identifier: z
        .string()
        .min(1, 'Email or phone number is required')
        .refine(
            (v) => {
                const trimmed = v.trim();
                const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
                const isPhone = /^03\d{9}$/.test(trimmed.replace(/[\s\-]/g, ''));
                return isEmail || isPhone;
            },
            { message: 'Enter a valid email or an 11-digit phone number starting with 03' }
        ),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
