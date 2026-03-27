import { z } from 'zod';

// Vehicle registration regex (Pakistan format: ABC-1234, KHI-987, etc.)
const VEHICLE_REGEX = /^[A-Z]{2,4}-?[0-9]{1,4}$/;

/** Validate a vehicle registration string. Returns true if valid or empty. */
export const validateVehicle = (raw) => {
    if (!raw) return true; // optional field
    const v = raw.trim().toUpperCase();
    return v.length <= 9 && VEHICLE_REGEX.test(v);
};

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
    bloodGroup: z.enum(['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional().default(''),
    onLeave: z.boolean().default(false),
    sameAsPhone: z.boolean().optional(),
    availability: z.object({
        day: z.boolean().default(true),
        night: z.boolean().default(false),
    }).optional(),
});

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

// Vehicle validation schema
export const vehicleSchema = z.object({
    type: z.string()
        .min(2, 'Vehicle type must be at least 2 characters')
        .max(30, 'Vehicle type max 30 characters')
        .refine(
            (val) => /^[A-Za-z\s]{2,30}$/.test(val.trim()),
            { message: 'Letters and spaces only — no numbers or special characters' }
        ),
    number: z.string().max(9, 'Max 9 characters').refine(
        (val) => VEHICLE_REGEX.test(val.trim().toUpperCase()),
        { message: 'Invalid format. Use: ABC-1234 or KHI-987' }
    ),
});

// Team validation schema
export const teamSchema = z.object({
    name: z.string().min(2, 'Team name required'),
    shift: z.enum(['Day', 'Night']),
    vehicleId: z.string().optional(),
    route: z.string().optional(),
    isBackup: z.boolean().default(false),
});
