/**
 * scanLogService.js — QR Scan Logging + Geolocation
 *
 * Fire-and-forget scan logging for the public verification page.
 * - Logs each QR scan to Firestore `scanLogs` collection
 * - Captures geolocation (if granted)
 * - 10-second duplicate prevention (same employeeId, same session)
 * - Immutable documents (Firestore rules: no update/delete)
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// ── Constants ──────────────────────────────────────────────────────
const DUPLICATE_WINDOW_MS = 10_000; // 10 seconds

/** In-memory duplicate tracker (per browser session) */
const recentScans = new Map();

// ── Geolocation ────────────────────────────────────────────────────

/**
 * Request geolocation from the browser.
 * Never blocks — always resolves, even if denied/unavailable.
 *
 * @returns {Promise<{ lat?: number, lng?: number, accuracy?: number, source: string }>}
 */
export function getLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({ source: 'unavailable' });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    source: 'browser_gps',
                });
            },
            (err) => {
                resolve({
                    source: err.code === 1 ? 'denied' : 'unavailable',
                });
            },
            { timeout: 5000, enableHighAccuracy: false },
        );
    });
}

// ── Duplicate Check ────────────────────────────────────────────────

/**
 * Returns true if this employeeId was scanned within the last 10 seconds.
 * Side-effect: registers the current timestamp if not duplicate.
 */
function isDuplicate(employeeId) {
    const now = Date.now();
    const last = recentScans.get(employeeId);
    if (last && now - last < DUPLICATE_WINDOW_MS) return true;
    recentScans.set(employeeId, now);
    return false;
}

// ── Log Scan ───────────────────────────────────────────────────────

/**
 * Log a QR scan event to Firestore.
 * Non-blocking, fire-and-forget — never interrupts the user experience.
 *
 * @param {Object} params
 * @param {string} params.employeeId   Human-readable ID (e.g. "F1-001")
 * @param {string} params.result       "verified" | "not_found"
 * @param {string} [params.userAgent]  Browser user-agent string
 */
export async function logScan({ employeeId, result, userAgent }) {
    try {
        if (isDuplicate(employeeId)) {
            console.log('[ScanLog] Duplicate blocked:', employeeId);
            return;
        }

        // Request geolocation in parallel — non-blocking
        const location = await getLocation();

        await addDoc(collection(db, 'scanLogs'), {
            employeeId,
            result,
            scannedAt: serverTimestamp(),
            userAgent: userAgent || navigator.userAgent || 'unknown',
            location,
        });
    } catch (err) {
        // Silently fail — never interrupt the verification UI
        console.warn('[ScanLog] Write failed:', err);
    }
}

// ── CSV Export ──────────────────────────────────────────────────────

/**
 * Generate CSV content from scan log documents.
 * @param {Array} logs  Array of scan log objects (with scannedAt as Date)
 * @returns {string}    CSV content
 */
export function generateScanLogsCsv(logs) {
    const headers = [
        'Timestamp',
        'Employee ID',
        'Result',
        'Latitude',
        'Longitude',
        'Accuracy (m)',
        'Location Source',
        'User Agent',
    ];

    const esc = (v) => {
        const s = String(v ?? '—');
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const rows = logs.map((l) => [
        l.scannedAt instanceof Date ? l.scannedAt.toLocaleString() : String(l.scannedAt || '—'),
        l.employeeId || '—',
        l.result || '—',
        l.location?.lat?.toFixed(4) ?? '—',
        l.location?.lng?.toFixed(4) ?? '—',
        l.location?.accuracy?.toFixed(0) ?? '—',
        l.location?.source ?? 'unknown',
        (l.userAgent || '').substring(0, 80),
    ]);

    return [
        headers.join(','),
        ...rows.map((r) => r.map(esc).join(',')),
    ].join('\n');
}

/**
 * Trigger CSV download of scan logs.
 * @param {Array} logs
 * @param {string} [filename]
 */
export function downloadScanLogsCsv(logs, filename) {
    const csv = generateScanLogsCsv(logs);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `scan-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}
