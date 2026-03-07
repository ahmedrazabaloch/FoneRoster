/**
 * LogViewer.jsx — Admin Activity Log Viewer
 *
 * Route: /admin/logs
 * Features:
 *  - Paginated audit log (50 per page via snapshot)
 *  - Filter by action type, adminEmail, date range
 *  - Read-only brutalist table UI
 *  - Sorted by timestamp DESC
 *  - No inline editing
 */
import React, { useEffect, useState, useCallback, useContext, useRef } from 'react';
import { Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { auditLogService } from '../../services/firebaseService';
import { AUDIT_ACTIONS } from '../../services/auditService';
import { AuthContext } from '../../auth/AuthContext';

const PAGE_SIZE = 50;

const ACTION_OPTIONS = ['', ...Object.values(AUDIT_ACTIONS)];

function formatTs(ts) {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('en-PK', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

const ACTION_COLOR = {
    ADD_MEMBER: '#22c55e',
    EDIT_MEMBER: '#3b82f6',
    DELETE_MEMBER: '#ef4444',
    TOGGLE_LEAVE: '#f59e0b',
    ADD_TEAM: '#8b5cf6',
    EDIT_TEAM: '#6366f1',
    DELETE_TEAM: '#dc2626',
    CHANGE_TEAM: '#14b8a6',
};

export const LogViewer = () => {
    const { user } = useContext(AuthContext);

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setAction] = useState('');
    const [emailFilter, setEmail] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const unsubRef = useRef(null);

    // Subscribe with current filters
    const resubscribe = useCallback(() => {
        if (unsubRef.current) unsubRef.current();
        setLoading(true);
        unsubRef.current = auditLogService.subscribe({
            onData: (data) => {
                setLogs(data);
                setLoading(false);
                setPage(1);
            },
            onError: () => setLoading(false),
            adminEmailFilter: emailFilter.trim() || null,
            actionFilter: actionFilter || null,
            limitCount: PAGE_SIZE * 3,     // fetch extra for client-side date filtering
        });
    }, [actionFilter, emailFilter]);

    useEffect(() => {
        resubscribe();
        return () => { if (unsubRef.current) unsubRef.current(); };
    }, [resubscribe]);

    // Date range client-side filter
    const filtered = logs.filter(log => {
        if (!log.timestamp) return true;
        const ts = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        if (dateFrom && ts < new Date(dateFrom)) return false;
        if (dateTo && ts > new Date(dateTo + 'T23:59:59')) return false;
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div style={{ padding: '24px 20px', maxWidth: 1200, margin: '0 auto' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontWeight: 900, fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                        📋 Activity Log
                    </h2>
                    <p style={{ fontSize: 12, color: '#6b7280' }}>
                        {filtered.length} record{filtered.length !== 1 ? 's' : ''} — read-only
                    </p>
                </div>
                <button
                    onClick={resubscribe}
                    disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', fontWeight: 700, fontSize: 12,
                        border: '2px solid #000', borderRadius: 2,
                        boxShadow: '2px 2px 0 #000', background: '#fff',
                        cursor: 'pointer', textTransform: 'uppercase',
                    }}
                >
                    <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    Refresh
                </button>
            </div>

            {/* ── Filters ── */}
            <div style={{
                display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16,
                padding: 14, background: '#fff',
                border: '2px solid #000', boxShadow: '3px 3px 0 #000',
            }}>
                <Filter size={14} style={{ alignSelf: 'center', color: '#6b7280' }} />

                <select
                    value={actionFilter}
                    onChange={e => { setAction(e.target.value); setPage(1); }}
                    style={filterInputStyle}
                >
                    <option value="">All Actions</option>
                    {Object.values(AUDIT_ACTIONS).map(a => (
                        <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                    ))}
                </select>

                <input
                    type="text"
                    placeholder="Filter by admin email…"
                    value={emailFilter}
                    onChange={e => { setEmail(e.target.value); setPage(1); }}
                    style={{ ...filterInputStyle, minWidth: 200 }}
                />

                <input
                    type="date"
                    value={dateFrom}
                    onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                    style={filterInputStyle}
                />
                <span style={{ alignSelf: 'center', fontSize: 12, color: '#6b7280' }}>to</span>
                <input
                    type="date"
                    value={dateTo}
                    onChange={e => { setDateTo(e.target.value); setPage(1); }}
                    style={filterInputStyle}
                />

                <button
                    onClick={() => { setAction(''); setEmail(''); setDateFrom(''); setDateTo(''); setPage(1); }}
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
                                {['Timestamp', 'Admin', 'Action', 'Employee ID', 'Changes'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading…</td></tr>
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>No records match filters.</td></tr>
                            ) : paginated.map((log, i) => (
                                <tr key={log.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={tdStyle}>{formatTs(log.timestamp)}</td>
                                    <td style={{ ...tdStyle, fontWeight: 700 }}>{log.adminEmail || '—'}</td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            display: 'inline-block',
                                            background: ACTION_COLOR[log.action] || '#6b7280',
                                            color: '#fff', fontWeight: 700, fontSize: 10,
                                            borderRadius: 2, padding: '2px 6px',
                                            textTransform: 'uppercase', letterSpacing: '0.04em',
                                        }}>
                                            {log.action?.replace(/_/g, ' ') || '—'}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{log.employeeId || '—'}</td>
                                    <td style={{ ...tdStyle, maxWidth: 300 }}>
                                        {log.changes
                                            ? <code style={{ fontSize: 10, color: '#374151', wordBreak: 'break-word' }}>
                                                {JSON.stringify(log.changes, null, 0).slice(0, 200)}
                                            </code>
                                            : <span style={{ color: '#9ca3af' }}>—</span>
                                        }
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
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={paginationBtnStyle}
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        style={paginationBtnStyle}
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ── Styles ── */
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
