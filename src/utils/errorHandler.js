/**
 * errorHandler.js — Centralized Error Handling Utility
 *
 * Provides standardized error handling across the application:
 * - Normalizes Firebase errors into user-friendly messages
 * - Logs developer details to console with context
 * - Returns safe messages for UI display
 *
 * Usage:
 *   import { handleError, normalizeFirebaseError, ErrorTypes } from '../utils/errorHandler';
 *
 *   try {
 *     await employeeService.create(data);
 *   } catch (error) {
 *     const { message, type } = handleError(error, 'EmployeeService.create');
 *     toast.error(message);
 *   }
 */

// ─── Error Type Classification ─────────────────────────────────────

export const ErrorTypes = Object.freeze({
    AUTH: 'auth',
    PERMISSION: 'permission',
    NOT_FOUND: 'not_found',
    VALIDATION: 'validation',
    NETWORK: 'network',
    QUOTA: 'quota',
    UNKNOWN: 'unknown',
});

// ─── Firebase Error Code Mapping ───────────────────────────────────

const FIREBASE_ERROR_MESSAGES = {
    // Auth errors
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/requires-recent-login': 'Please log in again to complete this action.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',

    // Firestore errors
    'permission-denied': 'You don\'t have permission to perform this action.',
    'not-found': 'The requested resource was not found.',
    'already-exists': 'A record with this identifier already exists.',
    'failed-precondition': 'Operation failed. Please refresh and try again.',
    'aborted': 'Operation was cancelled. Please try again.',
    'out-of-range': 'Invalid value provided.',
    'unimplemented': 'This feature is not available.',
    'internal': 'Server error. Please try again later.',
    'unavailable': 'Service temporarily unavailable. Please try again.',
    'data-loss': 'Data error. Please contact support.',
    'unauthenticated': 'Please log in to continue.',
    'resource-exhausted': 'Too many requests. Please wait and try again.',
    'cancelled': 'Operation was cancelled.',
    'deadline-exceeded': 'Request timed out. Please try again.',

    // Storage errors
    'storage/unauthorized': 'You don\'t have permission to upload files.',
    'storage/canceled': 'Upload was cancelled.',
    'storage/unknown': 'File upload failed. Please try again.',
    'storage/object-not-found': 'File not found.',
    'storage/quota-exceeded': 'Storage quota exceeded.',
    'storage/invalid-url': 'Invalid file URL.',
    'storage/retry-limit-exceeded': 'Upload failed after multiple attempts.',
};

// ─── Error Type Detection ──────────────────────────────────────────

function classifyError(error) {
    const code = error?.code || '';
    const message = error?.message?.toLowerCase() || '';

    if (code.startsWith('auth/') || message.includes('auth')) {
        return ErrorTypes.AUTH;
    }
    if (code === 'permission-denied' || message.includes('permission')) {
        return ErrorTypes.PERMISSION;
    }
    if (code === 'not-found' || message.includes('not found')) {
        return ErrorTypes.NOT_FOUND;
    }
    if (message.includes('network') || code === 'unavailable') {
        return ErrorTypes.NETWORK;
    }
    if (code === 'resource-exhausted' || code.includes('quota')) {
        return ErrorTypes.QUOTA;
    }
    if (message.includes('invalid') || message.includes('validation')) {
        return ErrorTypes.VALIDATION;
    }
    return ErrorTypes.UNKNOWN;
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Normalize a Firebase error into a user-friendly message.
 * @param {Error} error - The caught error object
 * @returns {string} User-friendly error message
 */
export function normalizeFirebaseError(error) {
    if (!error) return 'An unexpected error occurred.';

    // Check for Firebase error code
    const code = error?.code;
    if (code && FIREBASE_ERROR_MESSAGES[code]) {
        return FIREBASE_ERROR_MESSAGES[code];
    }

    // Check for Firestore error (no auth/ prefix)
    const firestoreCode = code?.replace('firestore/', '');
    if (firestoreCode && FIREBASE_ERROR_MESSAGES[firestoreCode]) {
        return FIREBASE_ERROR_MESSAGES[firestoreCode];
    }

    // Check for custom application errors
    if (error.message && !error.message.includes('Firebase')) {
        // Return custom error messages as-is (e.g., validation errors)
        return error.message;
    }

    // Fallback for unknown errors
    return 'An unexpected error occurred. Please try again.';
}

/**
 * Handle an error with logging and normalization.
 * @param {Error} error - The caught error object
 * @param {string} context - Identifier for where the error occurred (e.g., 'EmployeeService.add')
 * @returns {{ message: string, type: string, original: Error }}
 */
export function handleError(error, context = 'Unknown') {
    const type = classifyError(error);
    const message = normalizeFirebaseError(error);

    // Log developer details (only in development or for debugging)
    if (import.meta.env.DEV || type === ErrorTypes.UNKNOWN) {
        console.error(`[${context}]`, {
            type,
            code: error?.code,
            message: error?.message,
            stack: error?.stack,
        });
    }

    return {
        message,
        type,
        original: error,
    };
}

/**
 * Create a standardized error for throwing.
 * @param {string} message - Error message
 * @param {string} code - Error code (optional)
 * @returns {Error}
 */
export function createError(message, code = 'app/error') {
    const error = new Error(message);
    error.code = code;
    return error;
}

/**
 * Check if an error is of a specific type.
 * @param {Error} error - The error object
 * @param {string} type - ErrorTypes value
 * @returns {boolean}
 */
export function isErrorType(error, type) {
    return classifyError(error) === type;
}

/**
 * Safely extract error message for display.
 * Never exposes internal error details.
 * @param {Error|string} error - Error object or string
 * @returns {string}
 */
export function getSafeErrorMessage(error) {
    if (typeof error === 'string') {
        return error;
    }
    return normalizeFirebaseError(error);
}
