import { z } from 'zod';

// Reusable regex validators
const pakistaniMobile = z
    .string()
    .trim()
    .regex(/^03\d{9}$/, 'Mobile number must be 11 digits and start with 03');

const cnicFormat = z
    .string()
    .trim()
    .regex(/^\d{5}-\d{7}-\d{1}$/, 'CNIC must be in format 12345-1234567-1');

// Employee form validation schema
export const employeeSchema = z.object({
    employeeId: z.string().min(1, 'Employee ID required'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    fatherName: z.string().min(2, 'Father name must be at least 2 characters'),
    designation: z.enum(['driver', 'supervisor', 'helper', 'field_supervisor', 'executive_officer']),
    roleType: z.enum(['field_team', 'field_supervisor', 'executive']),
    phone: pakistaniMobile,
    whatsapp: pakistaniMobile,
    cnic: cnicFormat,
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
