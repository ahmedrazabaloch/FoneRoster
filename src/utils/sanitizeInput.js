/**
 * sanitizeInput.js — Input Validation and Sanitization Layer
 *
 * Provides comprehensive input validation and sanitization before Firestore writes.
 * All service layer methods should pass user input through these functions.
 *
 * Features:
 * - String sanitization (trim, max length, XSS prevention)
 * - Phone number validation (Pakistan format)
 * - CNIC validation (Pakistan 13-digit format)
 * - URL validation
 * - Email validation
 * - ID sanitization
 *
 * Usage:
 *   import { sanitizeString, validatePhone, validateCNIC } from '../utils/sanitizeInput';
 *
 *   const cleanName = sanitizeString(name, { maxLength: 100 });
 *   const phone = validatePhone(rawPhone);
 */

// ─── String Sanitization ───────────────────────────────────────────

/**
 * Sanitize a string value.
 * @param {string} value - Input string
 * @param {object} options - Configuration options
 * @param {number} options.maxLength - Maximum allowed length (default: 500)
 * @param {boolean} options.trim - Trim whitespace (default: true)
 * @param {boolean} options.toLowerCase - Convert to lowercase (default: false)
 * @param {boolean} options.removeHtml - Strip HTML tags (default: true)
 * @returns {string} Sanitized string
 */
export function sanitizeString(value, options = {}) {
    const {
        maxLength = 500,
        trim = true,
        toLowerCase = false,
        removeHtml = true,
    } = options;

    if (value === null || value === undefined) return '';
    
    let result = String(value);
    
    if (trim) {
        result = result.trim();
    }
    
    if (removeHtml) {
        // Strip HTML tags to prevent XSS
        result = result.replace(/<[^>]*>/g, '');
    }
    
    if (toLowerCase) {
        result = result.toLowerCase();
    }
    
    if (maxLength && result.length > maxLength) {
        result = result.substring(0, maxLength);
    }
    
    return result;
}

/**
 * Sanitize all string properties in an object.
 * @param {object} data - Input object
 * @param {object} fieldOptions - Per-field options { fieldName: { maxLength, ... } }
 * @returns {object} Object with sanitized strings
 */
export function sanitizeObject(data, fieldOptions = {}) {
    if (!data || typeof data !== 'object') return {};
    
    const result = {};
    
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            const options = fieldOptions[key] || {};
            result[key] = sanitizeString(value, options);
        } else if (value !== null && value !== undefined) {
            result[key] = value;
        }
    }
    
    return result;
}

// ─── Phone Number Validation ───────────────────────────────────────

/**
 * Pakistan phone number regex patterns.
 * Mobile: 03XX-XXXXXXX (11 digits)
 * Landline: 0XX-XXXXXXX (10-11 digits)
 */
const PAKISTAN_MOBILE_REGEX = /^03\d{9}$/;
const PAKISTAN_PHONE_REGEX = /^0\d{9,10}$/;

/**
 * Normalize a phone number by removing non-digit characters.
 * @param {string} phone - Raw phone input
 * @returns {string} Digits only
 */
export function normalizePhone(phone) {
    if (!phone) return '';
    return String(phone).replace(/[^\d]/g, '');
}

/**
 * Validate a Pakistan phone number.
 * @param {string} phone - Phone number to validate
 * @returns {{ valid: boolean, normalized: string, error?: string }}
 */
export function validatePhone(phone) {
    const normalized = normalizePhone(phone);
    
    if (!normalized) {
        return { valid: false, normalized: '', error: 'Phone number is required' };
    }
    
    if (normalized.length < 10 || normalized.length > 11) {
        return { valid: false, normalized, error: 'Phone number must be 10-11 digits' };
    }
    
    if (!normalized.startsWith('0')) {
        return { valid: false, normalized, error: 'Phone number must start with 0' };
    }
    
    // Mobile number check
    if (normalized.startsWith('03')) {
        if (!PAKISTAN_MOBILE_REGEX.test(normalized)) {
            return { valid: false, normalized, error: 'Invalid mobile number format (03XX-XXXXXXX)' };
        }
    }
    
    return { valid: true, normalized, error: undefined };
}

/**
 * Format a phone number for display.
 * @param {string} phone - Normalized phone number
 * @returns {string} Formatted phone (e.g., 0312-3456789)
 */
export function formatPhone(phone) {
    const normalized = normalizePhone(phone);
    if (normalized.length === 11 && normalized.startsWith('03')) {
        return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
    }
    if (normalized.length === 10) {
        return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    }
    return phone;
}

// ─── CNIC Validation ───────────────────────────────────────────────

/**
 * Pakistan CNIC regex: 5 digits - 7 digits - 1 digit (XXXXX-XXXXXXX-X)
 */
const CNIC_REGEX = /^\d{13}$/;
const CNIC_FORMATTED_REGEX = /^\d{5}-\d{7}-\d$/;

/**
 * Normalize a CNIC by removing dashes.
 * @param {string} cnic - Raw CNIC input
 * @returns {string} Digits only (13 digits)
 */
export function normalizeCNIC(cnic) {
    if (!cnic) return '';
    return String(cnic).replace(/[^\d]/g, '');
}

/**
 * Validate a Pakistan CNIC.
 * @param {string} cnic - CNIC to validate
 * @returns {{ valid: boolean, normalized: string, error?: string }}
 */
export function validateCNIC(cnic) {
    const normalized = normalizeCNIC(cnic);
    
    if (!normalized) {
        return { valid: false, normalized: '', error: 'CNIC is required' };
    }
    
    if (normalized.length !== 13) {
        return { valid: false, normalized, error: 'CNIC must be exactly 13 digits' };
    }
    
    if (!CNIC_REGEX.test(normalized)) {
        return { valid: false, normalized, error: 'Invalid CNIC format' };
    }
    
    return { valid: true, normalized, error: undefined };
}

/**
 * Format a CNIC for display.
 * @param {string} cnic - Normalized CNIC (13 digits)
 * @returns {string} Formatted CNIC (XXXXX-XXXXXXX-X)
 */
export function formatCNIC(cnic) {
    const normalized = normalizeCNIC(cnic);
    if (normalized.length !== 13) return normalized;
    return `${normalized.slice(0, 5)}-${normalized.slice(5, 12)}-${normalized.slice(12)}`;
}

// ─── Email Validation ──────────────────────────────────────────────

/**
 * Basic email regex (not RFC 5322 compliant, but catches most issues)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate an email address.
 * @param {string} email - Email to validate
 * @returns {{ valid: boolean, normalized: string, error?: string }}
 */
export function validateEmail(email) {
    if (!email) {
        return { valid: false, normalized: '', error: 'Email is required' };
    }
    
    const normalized = sanitizeString(email, { toLowerCase: true, maxLength: 254 });
    
    if (!EMAIL_REGEX.test(normalized)) {
        return { valid: false, normalized, error: 'Invalid email format' };
    }
    
    return { valid: true, normalized, error: undefined };
}

// ─── URL Validation ────────────────────────────────────────────────

/**
 * Validate a URL.
 * @param {string} url - URL to validate
 * @param {object} options - Configuration
 * @param {boolean} options.allowHttp - Allow http:// (default: true)
 * @param {string[]} options.allowedHosts - Whitelist of allowed hostnames
 * @returns {{ valid: boolean, normalized: string, error?: string }}
 */
export function validateUrl(url, options = {}) {
    const { allowHttp = true, allowedHosts = [] } = options;
    
    if (!url) {
        return { valid: false, normalized: '', error: 'URL is required' };
    }
    
    const trimmed = sanitizeString(url, { maxLength: 2048 });
    
    try {
        const parsed = new URL(trimmed);
        
        // Protocol check
        if (!allowHttp && parsed.protocol === 'http:') {
            return { valid: false, normalized: trimmed, error: 'HTTPS required' };
        }
        
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return { valid: false, normalized: trimmed, error: 'Invalid URL protocol' };
        }
        
        // Host whitelist check (if specified)
        if (allowedHosts.length > 0 && !allowedHosts.includes(parsed.hostname)) {
            return { valid: false, normalized: trimmed, error: 'URL host not allowed' };
        }
        
        return { valid: true, normalized: parsed.href, error: undefined };
    } catch {
        return { valid: false, normalized: trimmed, error: 'Invalid URL format' };
    }
}

// ─── ID Sanitization ───────────────────────────────────────────────

/**
 * Sanitize an ID field (alphanumeric + hyphens + underscores only).
 * @param {string} id - ID to sanitize
 * @param {number} maxLength - Maximum length (default: 50)
 * @returns {string} Sanitized ID
 */
export function sanitizeId(id, maxLength = 50) {
    if (!id) return '';
    return String(id)
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .substring(0, maxLength);
}

/**
 * Validate a Firestore document ID.
 * @param {string} id - ID to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDocumentId(id) {
    if (!id || typeof id !== 'string') {
        return { valid: false, error: 'Document ID is required' };
    }
    
    if (id.length > 1500) {
        return { valid: false, error: 'Document ID too long' };
    }
    
    // Firestore doesn't allow these characters
    if (/[/\\[\]*`]/.test(id)) {
        return { valid: false, error: 'Document ID contains invalid characters' };
    }
    
    // Can't be '.' or '..'
    if (id === '.' || id === '..') {
        return { valid: false, error: 'Document ID cannot be . or ..' };
    }
    
    return { valid: true, error: undefined };
}

// ─── Employee Data Sanitization ────────────────────────────────────

/**
 * Field-specific sanitization options for employee data.
 */
const EMPLOYEE_FIELD_OPTIONS = {
    name: { maxLength: 100 },
    fatherName: { maxLength: 100 },
    designation: { maxLength: 50 },
    roleType: { maxLength: 30 },
    employeeId: { maxLength: 20 },
    phone: { maxLength: 15 },
    whatsapp: { maxLength: 15 },
    cnic: { maxLength: 15 },
    licenseNo: { maxLength: 30 },
    bloodGroup: { maxLength: 5 },
    photoUrl: { maxLength: 500 },
};

/**
 * Sanitize employee data for Firestore write.
 * @param {object} data - Raw employee data
 * @returns {object} Sanitized employee data
 */
export function sanitizeEmployeeData(data) {
    if (!data) return {};
    
    const sanitized = sanitizeObject(data, EMPLOYEE_FIELD_OPTIONS);
    
    // Normalize phone fields
    if (sanitized.phone) {
        sanitized.phone = normalizePhone(sanitized.phone);
    }
    if (sanitized.whatsapp) {
        sanitized.whatsapp = normalizePhone(sanitized.whatsapp);
    }
    
    // Normalize CNIC
    if (sanitized.cnic) {
        sanitized.cnic = normalizeCNIC(sanitized.cnic);
    }
    
    return sanitized;
}

/**
 * Validate employee data before Firestore write.
 * @param {object} data - Employee data to validate
 * @param {object} options - Validation options
 * @param {boolean} options.requireCNIC - Require CNIC (default: false)
 * @param {boolean} options.requirePhone - Require phone (default: false)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateEmployeeData(data, options = {}) {
    const { requireCNIC = false, requirePhone = false } = options;
    const errors = [];
    
    // Required fields
    if (!data.name || !sanitizeString(data.name)) {
        errors.push('Name is required');
    }
    
    // Phone validation
    if (data.phone) {
        const phoneResult = validatePhone(data.phone);
        if (!phoneResult.valid) {
            errors.push(phoneResult.error);
        }
    } else if (requirePhone) {
        errors.push('Phone number is required');
    }
    
    // CNIC validation
    if (data.cnic) {
        const cnicResult = validateCNIC(data.cnic);
        if (!cnicResult.valid) {
            errors.push(cnicResult.error);
        }
    } else if (requireCNIC) {
        errors.push('CNIC is required');
    }
    
    // WhatsApp validation (if provided)
    if (data.whatsapp) {
        const whatsappResult = validatePhone(data.whatsapp);
        if (!whatsappResult.valid) {
            errors.push(`WhatsApp: ${whatsappResult.error}`);
        }
    }
    
    // Photo URL validation (if provided)
    if (data.photoUrl) {
        const urlResult = validateUrl(data.photoUrl, {
            allowedHosts: ['res.cloudinary.com', 'firebasestorage.googleapis.com'],
        });
        if (!urlResult.valid) {
            errors.push(`Photo URL: ${urlResult.error}`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}
