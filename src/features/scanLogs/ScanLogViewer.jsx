/**
 * ScanLogViewer.jsx — Admin QR Scan Log Dashboard
 *
 * Section: Admin dashboard sidebar (admin+ access enforced by the admin page)
 *
 * Features:
 *  - Real-time Firestore listener on scanLogs collection
 *  - Filter by employeeId, result, date range
 *  - Paginated table (50 per page)
 *  - CSV export
 *  - Stats: total scans, verified, not found
 *
 * Follows the same brutalist inline-style pattern as LogViewer.jsx
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
    Filter,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Download,
    QrCode,
} from 'lucide-react';
import { downloadScanLogsCsv } from '../../services/scanLogService';

const PAGE_SIZE = 50;

function formatTs(ts) {
    if (!ts) return '—';
    const d = ts instanceof Date ? ts : ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('en-PK', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

const RESULT_COLOR = {
    verified: '#22c55e',
    not_found: '#ef4444',
};

const SOURCE_COLOR = {
    browser_gps: '#3b82f6',
    denied: '#f59e0b',
    unavailable: '#6b7280',
    error: '#ef4444',
};

export const ScanLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [idFilter, setIdFilter] = useState('');
    const [resultFilter, setResultFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const unsubRef = useRef(null);

    // Subscribe to scanLogs
    const resubscribe = useCallback(() => {
        if (unsubRef.current) unsubRef.current();
        setLoading(true);
        const q = query(
            collection(db, 'scanLogs'),
            orderBy('scannedAt', 'desc'),
        );
        unsubRef.current = onSnapshot(q, (snap) => {
            const data = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
                scannedAt: d.data().scannedAt?.toDate?.() || null,
            }));
            setLogs(data);
            setLoading(false);
        }, () => setLoading(false));
    }, []);

    useEffect(() => {
        resubscribe();
        return () => { if (unsubRef.current) unsubRef.current(); };
    }, [resubscribe]);

    // Client-side filtering
    const filtered = logs.filter((log) => {
        if (idFilter && !(log.employeeId || '').toLowerCase().includes(idFilter.toLowerCase())) return false;
        if (resultFilter && log.result !== resultFilter) return false;
        if (log.scannedAt) {
            if (dateFrom && log.scannedAt < new Date(dateFrom)) return false;
            if (dateTo && log.scannedAt > new Date(dateTo + 'T23:59:59')) return false;
        }
        return true;
    });

    const verifiedCount = filtered.filter((l) => l.result === 'verified').length;
    const notFoundCount = filtered.filter((l) => l.result === 'not_found').length;

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleExport = () => {
        downloadScanLogsCsv(filtered, `scan-logs-${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <div style={{ padding: '24px 20px', maxWidth: 1400, margin: '0 auto' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ fontWeight: 900, fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <QrCode size={20} /> QR Scan Logs
                    </h2>
                    <p style={{ fontSize: 12, color: '#6b7280' }}>
                        {filtered.length} scan{filtered.length !== 1 ? 's' : ''} — real-time verification activity
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleExport} disabled={filtered.length === 0} style={actionBtnStyle('#10b981')}>
                        <Download size={13} /> Export CSV
                    </button>
                    <button onClick={resubscribe} disabled={loading} style={actionBtnStyle('#fff')}>
                        <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                    </button>
                </div>
            </div>

            {/* ── Stats ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
                <StatCard label="Total Scans" value={filtered.length} color="#111827" />
                <StatCard label="Verified" value={verifiedCount} color="#22c55e" />
                <StatCard label="Not Found" value={notFoundCount} color="#ef4444" />
            </div>

            {/* ── Filters ── */}
            <div style={{
                display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16,
                padding: 14, background: '#fff',
                border: '2px solid #000', boxShadow: '3px 3px 0 #000',
            }}>
                <Filter size={14} style={{ alignSelf: 'center', color: '#6b7280' }} />

                <input
                    type="text"
                    placeholder="Employee ID…"
                    value={idFilter}
                    onChange={(e) => { setIdFilter(e.target.value); setPage(1); }}
                    style={{ ...filterInputStyle, minWidth: 140 }}
                />

                <select
                    value={resultFilter}
                    onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}
                    style={filterInputStyle}
                >
                    <option value="">All Results</option>
                    <option value="verified">Verified</option>
                    <option value="not_found">Not Found</option>
                </select>

                <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} style={filterInputStyle} />
                <span style={{ alignSelf: 'center', fontSize: 12, color: '#6b7280' }}>to</span>
                <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} style={filterInputStyle} />

                <button
                    onClick={() => { setIdFilter(''); setResultFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
                    style={{
                        padding: '6px 12px', fontSize: 11, fontWeight: 700,
                        border: '2px solid #000', borderRadius: 2, background: '#f9fafb',
                        cursor: 'pointer', textTransform: 'uppercase',
                    }}
                >
                    Clear
                </button>
            </div>

            {/* ── Table ── */}
            <div style={{ border: '2px solid #000', boxShadow: '3px 3px 0 #000', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr style={{ background: '#111827', color: '#fff' }}>
                                {['Timestamp', 'Employee ID', 'Result', 'Location', 'Accuracy', 'Source', 'Browser'].map((h) => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading…</td></tr>
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>No scan logs match filters.</td></tr>
                            ) : paginated.map((log, i) => (
                                <tr key={log.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={tdStyle}>{formatTs(log.scannedAt)}</td>
                                    <td style={{ ...tdStyle, fontWeight: 700, fontFamily: 'monospace' }}>{log.employeeId || '—'}</td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            display: 'inline-block',
                                            background: RESULT_COLOR[log.result] || '#6b7280',
                                            color: '#fff', fontWeight: 700, fontSize: 10,
                                            borderRadius: 2, padding: '2px 6px',
                                            textTransform: 'uppercase', letterSpacing: '0.04em',
                                        }}>
                                            {log.result === 'verified' ? '✓' : '✗'} {log.result?.replace(/_/g, ' ') || '—'}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>
                                        {log.location?.lat
                                            ? `${log.location.lat.toFixed(4)}, ${log.location.lng.toFixed(4)}`
                                            : '—'}
                                    </td>
                                    <td style={tdStyle}>
                                        {log.location?.accuracy ? `±${log.location.accuracy.toFixed(0)}m` : '—'}
                                    </td>
                                    <td style={tdStyle}>
                                        {log.location?.source ? (
                                            <span style={{
                                                display: 'inline-block',
                                                background: SOURCE_COLOR[log.location.source] || '#e5e7eb',
                                                color: '#fff', fontWeight: 700, fontSize: 10,
                                                borderRadius: 2, padding: '2px 6px',
                                                textTransform: 'uppercase',
                                            }}>
                                                {log.location.source.replace(/_/g, ' ')}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td style={{ ...tdStyle, maxWidth: 180 }}>
                                        <span title={log.userAgent} style={{ fontSize: 10, color: '#6b7280', wordBreak: 'break-word' }}>
                                            {(log.userAgent || '').substring(0, 50)}…
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Pagination ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                    Page {page} of {totalPages} ({filtered.length} total)
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={paginationBtnStyle}>
                        <ChevronLeft size={14} />
                    </button>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={paginationBtnStyle}>
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Stat Card ──────────────────────────────────────────────────────
const StatCard = ({ label, value, color }) => (
    <div style={{
        background: '#fff', border: '2px solid #000', boxShadow: '3px 3px 0 #000',
        padding: '14px 16px',
    }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {label}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>
            {value}
        </div>
    </div>
);

// ── Styles ─────────────────────────────────────────────────────────
const filterInputStyle = {
    height: 34, padding: '0 10px', fontSize: 12, fontWeight: 600,
    border: '2px solid #000', borderRadius: 2, outline: 'none',
    background: '#f9fafb',
};

const thStyle = {
    padding: '10px 14px', textAlign: 'left', fontWeight: 800,
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
    borderRight: '1px solid #374151', whiteSpace: 'nowrap',
};

const tdStyle = {
    padding: '9px 14px', verticalAlign: 'top',
    borderRight: '1px solid #e5e7eb',
};

const paginationBtnStyle = {
    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid #000', borderRadius: 2, background: '#fff',
    cursor: 'pointer', fontWeight: 700,
};

function actionBtnStyle(bg) {
    return {
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', fontWeight: 700, fontSize: 12,
        border: '2px solid #000', borderRadius: 2,
        boxShadow: '2px 2px 0 #000',
        background: bg, color: bg === '#fff' ? '#000' : '#fff',
        cursor: 'pointer', textTransform: 'uppercase',
    };
}
