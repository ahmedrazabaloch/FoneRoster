import { z } from 'zod';

// Employee form validation schema
export const employeeSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    fatherName: z.string().min(2, 'Father name must be at least 2 characters'),
    designation: z.enum(['driver', 'supervisor', 'helper', 'field_supervisor', 'executive_officer']),
    roleType: z.enum(['field_team', 'field_supervisor', 'executive']),
    phone: z.string().min(5, 'Phone number required'),
    whatsapp: z.string().min(5, 'WhatsApp number required'),
    cnic: z.string().min(5, 'CNIC required'),
    licenseNo: z.string().nullable().optional(),
    onLeave: z.boolean().default(false),
    sameAsPhone: z.boolean().optional(),
    availability: z.object({
        day: z.boolean().default(true),
        night: z.boolean().default(false),
    }).optional(),
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
