/**
 * AuditLogViewer.jsx — Admin Audit & Export History Viewer
 *
 * Displays latest 100 audit logs ordered by timestamp DESC.
 * Filters: action type, date range, user email search.
 * Accessible to ADMIN and SUPER_ADMIN only (rendered in RosterManager).
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, Search, Filter, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AUDIT_ACTIONS } from '../../services/auditService';

const ITEMS_PER_PAGE = 15;

const ACTION_LABELS = {
    ADD_MEMBER: { label: 'Add Member', color: 'bg-green-100 text-green-800' },
    EDIT_MEMBER: { label: 'Edit Member', color: 'bg-blue-100 text-blue-800' },
    DELETE_MEMBER: { label: 'Delete Member', color: 'bg-red-100 text-red-800' },
    RESTORE_MEMBER: { label: 'Restore Member', color: 'bg-teal-100 text-teal-800' },
    TOGGLE_LEAVE: { label: 'Toggle Leave', color: 'bg-yellow-100 text-yellow-800' },
    ADD_TEAM: { label: 'Add Team', color: 'bg-green-100 text-green-800' },
    EDIT_TEAM: { label: 'Edit Team', color: 'bg-blue-100 text-blue-800' },
    DELETE_TEAM: { label: 'Delete Team', color: 'bg-red-100 text-red-800' },
    CHANGE_TEAM: { label: 'Change Team', color: 'bg-purple-100 text-purple-800' },
    EXPORT_CSV: { label: 'Export CSV', color: 'bg-orange-100 text-orange-800' },
};

function formatTimestamp(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('en-PK', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

function extractTeams(log) {
    if (!log.changes) return '';
    if (log.changes.selectedTeams) {
        return log.changes.selectedTeams.map(t => t.name || t.id).join(', ');
    }
    if (log.changes.teamName) return log.changes.teamName;
    return '';
}

function extractRecordCount(log) {
    if (!log.changes) return '';
    if (log.changes.teamCount) return log.changes.teamCount;
    if (log.changes.memberCount) return log.changes.memberCount;
    return '';
}

export const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [actionFilter, setActionFilter] = useState('');
    const [emailSearch, setEmailSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Subscribe to logs
    useEffect(() => {
        setLoading(true);
        const constraints = [
            collection(db, 'adminActivityLogs'),
        ];
        const q = query(
            collection(db, 'adminActivityLogs'),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setLogs(data);
            setLoading(false);
        }, (err) => {
            console.error('[AuditLogViewer] subscription error:', err);
            setLoading(false);
        });

        return unsub;
    }, []);

    // Client-side filtering
    const filteredLogs = useMemo(() => {
        let result = logs;

        if (actionFilter) {
            result = result.filter(l => l.action === actionFilter);
        }

        if (emailSearch.trim()) {
            const term = emailSearch.toLowerCase();
            result = result.filter(l => (l.adminEmail || '').toLowerCase().includes(term));
        }

        if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            result = result.filter(l => {
                const d = l.timestamp?.toDate ? l.timestamp.toDate() : null;
                return d && d >= from;
            });
        }

        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            result = result.filter(l => {
                const d = l.timestamp?.toDate ? l.timestamp.toDate() : null;
                return d && d <= to;
            });
        }

        return result;
    }, [logs, actionFilter, emailSearch, dateFrom, dateTo]);

    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
    const currentLogs = filteredLogs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [actionFilter, emailSearch, dateFrom, dateTo]);

    const clearFilters = useCallback(() => {
        setActionFilter('');
        setEmailSearch('');
        setDateFrom('');
        setDateTo('');
    }, []);

    const hasFilters = actionFilter || emailSearch || dateFrom || dateTo;

    return (
        <div className="max-w-6xl">
            <div className="bg-white border-4 border-black shadow-brutal-lg">
                {/* Header */}
                <div className="bg-gray-900 text-white px-6 py-4 border-b-4 border-black flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield size={20} />
                        <h3 className="font-black text-lg uppercase tracking-wide">Audit Logs</h3>
                    </div>
                    <span className="text-xs font-mono bg-gray-700 px-3 py-1">
                        {filteredLogs.length} record{filteredLogs.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 bg-gray-50 border-b-2 border-black">
                    <div className="flex flex-wrap gap-3 items-end">
                        {/* Action filter */}
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Action</label>
                            <select
                                value={actionFilter}
                                onChange={e => setActionFilter(e.target.value)}
                                className="w-full border-2 border-black p-2 text-xs font-bold bg-white focus:outline-none"
                            >
                                <option value="">All Actions</option>
                                {Object.entries(AUDIT_ACTIONS).map(([key, val]) => (
                                    <option key={key} value={val}>
                                        {ACTION_LABELS[key]?.label || key}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Email search */}
                        <div className="flex-1 min-w-[180px]">
                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">User Email</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search email..."
                                    value={emailSearch}
                                    onChange={e => setEmailSearch(e.target.value)}
                                    className="w-full border-2 border-black p-2 pr-8 text-xs font-bold bg-white focus:outline-none"
                                />
                                <Search size={12} className="absolute right-2 top-3 text-gray-400" />
                            </div>
                        </div>

                        {/* Date from */}
                        <div className="min-w-[130px]">
                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">From</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="w-full border-2 border-black p-2 text-xs font-bold bg-white focus:outline-none"
                            />
                        </div>

                        {/* Date to */}
                        <div className="min-w-[130px]">
                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">To</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="w-full border-2 border-black p-2 text-xs font-bold bg-white focus:outline-none"
                            />
                        </div>

                        {/* Clear */}
                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-3 py-2 border-2 border-black bg-red-500 text-white text-[10px] font-black uppercase hover:bg-red-600 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader className="animate-spin text-gray-400" size={28} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b-2 border-black text-[10px] font-black uppercase tracking-wider">
                                    <th className="p-3 border-r border-gray-200">Timestamp</th>
                                    <th className="p-3 border-r border-gray-200">Action</th>
                                    <th className="p-3 border-r border-gray-200">User</th>
                                    <th className="p-3 border-r border-gray-200">Target</th>
                                    <th className="p-3 border-r border-gray-200">Teams</th>
                                    <th className="p-3">Details</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs font-bold">
                                {currentLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-400 italic">
                                            {hasFilters ? 'No logs match filters.' : 'No audit logs yet.'}
                                        </td>
                                    </tr>
                                ) : (
                                    currentLogs.map(log => {
                                        const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-700' };
                                        const teams = extractTeams(log);
                                        const count = extractRecordCount(log);
                                        return (
                                            <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="p-3 border-r border-gray-100 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                                                    {formatTimestamp(log.timestamp)}
                                                </td>
                                                <td className="p-3 border-r border-gray-100">
                                                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase ${meta.color}`}>
                                                        {meta.label}
                                                    </span>
                                                </td>
                                                <td className="p-3 border-r border-gray-100 font-mono text-[11px] max-w-[180px] truncate">
                                                    {log.adminEmail || '—'}
                                                </td>
                                                <td className="p-3 border-r border-gray-100 text-gray-500">
                                                    {log.employeeId || log.memberId || '—'}
                                                </td>
                                                <td className="p-3 border-r border-gray-100 text-gray-500 max-w-[150px] truncate">
                                                    {teams || '—'}
                                                </td>
                                                <td className="p-3 text-gray-500">
                                                    {count ? `${count} record(s)` : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 border-t-2 border-black p-4 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`p-2 border-2 border-black ${currentPage === 1
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-white hover:bg-gray-100 shadow-brutal-sm'}`}
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={`p-2 border-2 border-black ${currentPage === totalPages
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-white hover:bg-gray-100 shadow-brutal-sm'}`}
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
