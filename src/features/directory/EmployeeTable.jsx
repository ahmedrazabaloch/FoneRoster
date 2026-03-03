import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
    Search, Edit, Trash2, User, Phone, MessageCircle,
    ChevronLeft, ChevronRight, SlidersHorizontal, CreditCard, RotateCcw
} from 'lucide-react';
import { Badge } from '../../components/ui';
import { EmployeeCardMobile } from './EmployeeCardMobile';
import { EmployeeCardSkeleton } from './EmployeeCardSkeleton';
import { IdCardPreviewModal } from '../idcard/IdCardPreviewModal';
import { useWindowWidth } from '../../hooks/useWindowWidth';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission } from '../../utils/rbac';

const ITEMS_PER_PAGE = 5;

/* Card fade-in keyframe — injected once */
const FADE_IN_STYLE = `
@keyframes fadeInCard {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}`;

export const EmployeeTable = ({ employees, onEdit, onDelete, onRestore, onUpdate, onToggleLeave, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const debounceRef = useRef(null);
    const windowWidth = useWindowWidth();
    const isMobile = windowWidth <= 768;
    const { role } = useAuth();
    const canGenerateIdCard = hasPermission(role, 'employees:write');
    const [idCardEmployee, setIdCardEmployee] = useState(null);

    /* ── Debounce search (300ms) ── */
    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(value);
            setCurrentPage(1);
        }, 300);
    }, []);

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    const filteredEmployees = useMemo(() => {
        console.log('[EmployeeTable] employees prop length:', employees.length, '| search term:', `"${debouncedSearch}"`);
        const term = debouncedSearch.toLowerCase();
        const filtered = employees.filter(
            emp =>
                emp.name.toLowerCase().includes(term) ||
                (emp.employeeId || '').toLowerCase().includes(term) ||
                (emp.designation || '').toLowerCase().includes(term)
        );
        console.log('[EmployeeTable] filteredEmployees.length:', filtered.length);
        return filtered;
    }, [employees, debouncedSearch]);

    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
    const currentEmployees = filteredEmployees.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = useCallback((dir) => {
        setCurrentPage(p => Math.min(Math.max(1, p + dir), totalPages));
    }, [totalPages]);

    return (
        <div className="bg-white border-2 border-black shadow-brutal-lg overflow-hidden flex flex-col">
            <style>{FADE_IN_STYLE}</style>

            {/* ── HEADER ──────────────────────────────────── */}
            <div className="bg-gray-900 text-white border-b-2 border-black"
                style={{ padding: isMobile ? '12px 14px' : '16px' }}>

                {isMobile ? (
                    /* Mobile: stacked layout */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <h3 style={{ fontWeight: 900, fontSize: 16, textTransform: 'uppercase', margin: 0 }}>
                            Employee Database
                        </h3>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Search Name, ID, Role…"
                                value={searchTerm}
                                onChange={e => handleSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: 44,
                                    background: '#1f2937',
                                    border: '1px solid #4b5563',
                                    borderRadius: 4,
                                    color: '#fff',
                                    fontSize: 13,
                                    paddingLeft: 14,
                                    paddingRight: 40,
                                    boxSizing: 'border-box',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                }}
                            />
                            <SlidersHorizontal
                                size={15}
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#9ca3af',
                                    pointerEvents: 'none',
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    /* Desktop: original inline layout */
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-xl uppercase">Employee Database</h3>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search Name, ID, Role..."
                                    className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-48"
                                    value={searchTerm}
                                    onChange={e => handleSearch(e.target.value)}
                                />
                                <Search size={14} className="absolute right-2 top-1.5 text-gray-400" />
                            </div>
                            <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded">
                                Total: {filteredEmployees.length}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── MOBILE: cards ──────────────────────────── */}
            {isMobile ? (
                <div style={{ padding: 14, background: '#f3f4f6', flex: 1 }}>
                    {loading ? (
                        /* Skeleton shimmer */
                        [1, 2, 3].map(i => <EmployeeCardSkeleton key={i} />)
                    ) : currentEmployees.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', padding: 32 }}>
                            No employees found matching criteria.
                        </p>
                    ) : (
                        currentEmployees.map((emp, idx) => (
                            <div
                                key={emp.id}
                                style={{
                                    animation: `fadeInCard 220ms ease forwards`,
                                    animationDelay: `${idx * 50}ms`,
                                    opacity: 0,
                                }}
                            >
                                <EmployeeCardMobile
                                    emp={emp}
                                    onEdit={emp.isDeleted ? null : onEdit}
                                    onDelete={emp.isDeleted ? null : onDelete}
                                    onRestore={emp.isDeleted && onRestore ? () => onRestore(emp.id, emp.employeeId) : null}
                                    onUpdate={onUpdate}
                                    onToggleLeave={emp.isDeleted ? null : onToggleLeave}
                                    onIdCard={canGenerateIdCard && !emp.isDeleted ? () => setIdCardEmployee(emp) : null}
                                />
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* ── DESKTOP: original table ─────────────── */
                <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-black text-xs font-black uppercase tracking-wider">
                                <th className="p-4 border-r-2 border-black w-12">ID</th>
                                <th className="p-4 border-r-2 border-black w-16 text-center">Pic</th>
                                <th className="p-4 border-r-2 border-black">Name / Role</th>
                                <th className="p-4 border-r-2 border-black">Contact</th>
                                <th className="p-4 border-r-2 border-black">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-black text-sm font-bold">
                            {currentEmployees.map(emp => {
                                const isInactive = emp.isDeleted === true;
                                return (
                                    <tr key={emp.id} className={`transition-colors ${isInactive ? 'bg-red-50 opacity-60' : 'hover:bg-blue-50'}`}>

                                        <td className="p-4 border-r-2 border-black font-mono">{emp.employeeId || '—'}</td>
                                        <td className="p-4 border-r-2 border-black text-center">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-black overflow-hidden flex items-center justify-center mx-auto">
                                                {emp.photo
                                                    ? <img src={emp.photo} alt="Emp" className="w-full h-full object-cover" />
                                                    : <User size={20} className="text-gray-400" />
                                                }
                                            </div>
                                        </td>
                                        <td className="p-4 border-r-2 border-black">
                                            <div className="font-black uppercase">{emp.name}</div>
                                            <div className="text-[10px] text-gray-500 uppercase mb-1">
                                                S/O {emp.fatherName || '-'}
                                            </div>
                                            <Badge variant="default">{(emp.designation || 'unknown').replace(/_/g, ' ')}</Badge>
                                            {emp.licenseNo && emp.licenseNo !== 'N/A' && (
                                                <div className="text-[10px] font-mono mt-1 text-gray-600">
                                                    Lic: {emp.licenseNo}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 border-r-2 border-black font-mono text-xs">
                                            {emp.phone === emp.whatsapp ? (
                                                <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded border border-gray-300">
                                                    <div className="flex space-x-1">
                                                        <Phone size={12} className="text-blue-600" />
                                                        <MessageCircle size={12} className="text-green-600" />
                                                    </div>
                                                    <span>{emp.phone}</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <div className="flex items-center">
                                                        <Phone size={12} className="mr-1 text-blue-600" />
                                                        {emp.phone}
                                                    </div>
                                                    <div className="flex items-center text-green-600">
                                                        <MessageCircle size={12} className="mr-1" />
                                                        {emp.whatsapp}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="text-[10px] text-gray-400 mt-1">CNIC: {emp.cnic}</div>
                                        </td>
                                        <td className="p-4 border-r-2 border-black">
                                            {isInactive ? (
                                                <Badge variant="danger">Deleted</Badge>
                                            ) : emp.onLeave ? (
                                                <Badge variant="danger">On Leave</Badge>
                                            ) : (
                                                <Badge variant="success">Active</Badge>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex space-x-2">
                                                {isInactive && onRestore ? (
                                                    <button
                                                        onClick={() => onRestore(emp.id, emp.employeeId)}
                                                        className="p-2 bg-green-500 text-white border-2 border-black shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                                                        title="Restore Employee"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                ) : !isInactive ? (
                                                    <>
                                                        <button
                                                            onClick={() => onEdit(emp)}
                                                            className="p-2 bg-yellow-300 border-2 border-black shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => onDelete(emp.id)}
                                                            className="p-2 bg-red-500 text-white border-2 border-black shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        {canGenerateIdCard && (
                                                            <button
                                                                onClick={() => setIdCardEmployee(emp)}
                                                                className="p-2 bg-blue-500 text-white border-2 border-black shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                                                                title="Generate ID Card"
                                                            >
                                                                <CreditCard size={16} />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {currentEmployees.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500 italic">
                                        No employees found matching criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── PAGINATION (shared) ─────────────────────── */}
            {totalPages > 1 && (
                <div className="bg-gray-50 border-t-2 border-black p-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handlePageChange(-1)}
                            disabled={currentPage === 1}
                            className={`p-2 border-2 border-black ${currentPage === 1
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white hover:bg-gray-100 shadow-brutal-sm'}`}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === totalPages}
                            className={`p-2 border-2 border-black ${currentPage === totalPages
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white hover:bg-gray-100 shadow-brutal-sm'}`}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── ID CARD PREVIEW MODAL ─── */}
            {idCardEmployee && (
                <IdCardPreviewModal
                    employee={idCardEmployee}
                    onClose={() => setIdCardEmployee(null)}
                />
            )}
        </div>
    );
};
