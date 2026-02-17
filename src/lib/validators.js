import { z } from 'zod';

// Employee form validation schema
export const employeeSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    fatherName: z.string().min(2, 'Father name must be at least 2 characters'),
    role: z.enum(['Driver', 'Supervisor', 'Helper', 'Hotline']),
    phone: z.string().regex(/^03\d{2}-\d{7}$/, 'Phone must be in format 03XX-XXXXXXX'),
    whatsapp: z.string().regex(/^03\d{2}-\d{7}$/, 'WhatsApp must be in format 03XX-XXXXXXX'),
    cnic: z.string().regex(/^\d{5}-\d{7}-\d$/, 'CNIC must be in format XXXXX-XXXXXXX-X'),
    license: z.string().optional(),
    photo: z.any().optional(),
    onLeave: z.boolean().default(false),
    sameAsPhone: z.boolean().optional(),
});

// Login form validation schema
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Team validation schema
export const teamSchema = z.object({
    name: z.string().min(2, 'Team name required'),
    shift: z.enum(['Day', 'Night']),
    vehicle: z.string().optional(),
    route: z.string().optional(),
    isBackup: z.boolean().default(false),
});
