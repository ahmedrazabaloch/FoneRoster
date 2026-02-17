import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind classes
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Format phone number for display
 */
export function formatPhone(phone) {
    if (!phone) return 'N/A';
    return phone;
}

/**
 * Format WhatsApp URL with proper country code
 */
export function formatWhatsAppUrl(phone) {
    if (!phone) return '#';
    // Remove hyphens and convert to international format
    // Assumes Pakistani numbers (92)
    const cleaned = phone.replace(/-/g, '').replace(/\s/g, '');
    // If starts with 0, replace with 92
    const international = cleaned.startsWith('0') ? `92${cleaned.slice(1)}` : cleaned;
    return `https://wa.me/${international}`;
}

/**
 * Format CNIC for display
 */
export function formatCNIC(cnic) {
    if (!cnic) return 'N/A';
    return cnic;
}

/**
 * Get shift name based on hour and config
 */
export function getShiftName(hour, config = 'standard') {
    if (config === 'standard') {
        if (hour >= 8 && hour < 16) return 'Morning Shift (08:00 - 16:00)';
        if (hour >= 16 && hour < 24) return 'Evening Shift (16:00 - 00:00)';
        return 'Night Shift (00:00 - 08:00)';
    } else {
        if (hour >= 8 && hour < 20) return 'Day Shift (08:00 - 20:00)';
        return 'Night Shift (20:00 - 08:00)';
    }
}
