/**
 * formatters.js
 * Pure formatting utilities — no side effects, no imports.
 */

/**
 * Auto-formats digit string into CNIC format: 12345-1234567-1
 * Strips non-digits, inserts dashes at correct positions.
 * @param {string} raw  Raw input string
 * @returns {string}    Formatted CNIC string
 */
export function formatCnic(raw) {
    const d = (raw || '').replace(/\D/g, '').slice(0, 13);
    if (d.length <= 5) return d;
    if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

/**
 * Strips all whitespace from a phone/WhatsApp number.
 * @param {string} v
 * @returns {string}
 */
export function normalizePhone(v) {
    return (v || '').replace(/\s+/g, '');
}

/**
 * Formats a Firebase serverTimestamp or JS Date to a readable string.
 * @param {Object|Date|null} ts
 * @returns {string}
 */
export function formatTimestamp(ts) {
    if (!ts) return '—';
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString('en-PK', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}
