/**
 * EmployeeGrid.jsx — Responsive Employee Directory Grid
 *
 * Features:
 * - Responsive grid layout (1-3 columns based on screen size)
 * - Search with debounce
 * - Filter by designation, status
 * - Pagination
 * - Virtualized loading for large lists
 * - Skeleton loading states
 * - ID Card preview modal integration
 *
 * Props:
 *   employees: Array of employee objects
 *   teams: Array of team objects for team name lookup
 *   onEdit: Function to edit employee
 *   onDelete: Function to soft-delete
 *   onRestore: Function to restore deleted
 *   onUpdate: Function to update employee
 *   onToggleLeave: Function to toggle leave status
 *   loading: Boolean loading state
 */
import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import {
    Search,
    Filter,
    Grid,
    List,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
    X,
    Users,
} from 'lucide-react';
import { EmployeeCard } from './EmployeeCard';
import { EmployeeCardSkeleton } from './EmployeeCardSkeleton';
import { IdCardPreviewModal } from '../idcard/IdCardPreviewModal';
import { useWindowWidth } from '../../hooks/useWindowWidth';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission, ACTIONS } from '../../utils/rbac';
import { DESIGNATION_OPTIONS } from '../../config/designations';

// ─── Constants ─────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'available', label: 'Available' },
    { value: 'on_leave', label: 'On Leave' },
    { value: 'inactive', label: 'Inactive' },
];

// ─── Filter Bar Component ──────────────────────────────────────────

const FilterBar = memo(({
    searchTerm,
    onSearchChange,
    designationFilter,
    onDesignationChange,
    statusFilter,
    onStatusChange,
    viewMode,
    onViewModeChange,
    totalCount,
    filteredCount,
    isMobile,
}) => {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="bg-gray-900 text-white border-b-2 border-black">
            {/* Main Bar */}
            <div className="p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-3">
                {/* Title & Count */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="bg-red-600 p-2 border-2 border-white/20">
                        <Users size={18} />
                    </div>
                    <div>
                        <h3 className="font-black text-base uppercase tracking-wide">
                            Employee Directory
                        </h3>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {filteredCount} of {totalCount} employees
                        </span>
                    </div>
                </div>

                {/* Search */}
                <div className="flex-1 relative">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        placeholder="Search name, ID, role..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full h-10 md:h-11 bg-gray-800 border border-gray-700 rounded pl-10 pr-4 text-sm font-medium text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Filter Toggle (Mobile) */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`md:hidden p-2.5 border border-gray-700 rounded transition-colors ${
                            showFilters ? 'bg-red-600 border-red-600' : 'hover:bg-gray-800'
                        }`}
                    >
                        <SlidersHorizontal size={18} />
                    </button>

                    {/* Desktop Filters */}
                    {!isMobile && (
                        <>
                            <select
                                value={designationFilter}
                                onChange={(e) => onDesignationChange(e.target.value)}
                                className="h-10 bg-gray-800 border border-gray-700 rounded px-3 text-sm font-medium text-white focus:outline-none focus:border-red-500"
                            >
                                <option value="all">All Roles</option>
                                {DESIGNATION_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => onStatusChange(e.target.value)}
                                className="h-10 bg-gray-800 border border-gray-700 rounded px-3 text-sm font-medium text-white focus:outline-none focus:border-red-500"
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                    {/* View Mode Toggle */}
                    <div className="hidden md:flex border border-gray-700 rounded overflow-hidden">
                        <button
                            onClick={() => onViewModeChange('grid')}
                            className={`p-2.5 transition-colors ${
                                viewMode === 'grid' ? 'bg-red-600' : 'hover:bg-gray-800'
                            }`}
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            onClick={() => onViewModeChange('list')}
                            className={`p-2.5 transition-colors ${
                                viewMode === 'list' ? 'bg-red-600' : 'hover:bg-gray-800'
                            }`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Filter Panel */}
            {isMobile && showFilters && (
                <div className="px-3 pb-3 flex gap-2">
                    <select
                        value={designationFilter}
                        onChange={(e) => onDesignationChange(e.target.value)}
                        className="flex-1 h-10 bg-gray-800 border border-gray-700 rounded px-3 text-sm font-medium text-white focus:outline-none"
                    >
                        <option value="all">All Roles</option>
                        {DESIGNATION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="flex-1 h-10 bg-gray-800 border border-gray-700 rounded px-3 text-sm font-medium text-white focus:outline-none"
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
});

FilterBar.displayName = 'FilterBar';

// ─── Pagination Component ──────────────────────────────────────────

const Pagination = memo(({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t-2 border-black">
            <span className="text-xs font-bold text-gray-500 uppercase">
                Showing {startItem}–{endItem} of {totalItems}
            </span>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(-1)}
                    disabled={currentPage === 1}
                    className="p-2 border-2 border-black bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>

                <span className="px-3 py-1 text-sm font-bold">
                    {currentPage} / {totalPages}
                </span>

                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border-2 border-black bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
});

Pagination.displayName = 'Pagination';

// ─── Empty State Component ─────────────────────────────────────────

const EmptyState = memo(({ searchTerm, hasFilters }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Users size={32} className="text-gray-400" />
        </div>
        <h3 className="font-black text-lg uppercase text-gray-700 mb-1">
            {searchTerm || hasFilters ? 'No Matches Found' : 'No Employees'}
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
            {searchTerm || hasFilters
                ? "Try adjusting your search or filters to find what you're looking for."
                : 'Add your first employee using the form on the left.'}
        </p>
    </div>
));

EmptyState.displayName = 'EmptyState';

// ─── Loading Skeleton Grid ─────────────────────────────────────────

const SkeletonGrid = memo(({ count = 6 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {Array.from({ length: count }).map((_, i) => (
            <EmployeeCardSkeleton key={i} />
        ))}
    </div>
));

SkeletonGrid.displayName = 'SkeletonGrid';

// ─── Main Employee Grid Component ──────────────────────────────────

export const EmployeeGrid = memo(({
    employees,
    teams = [],
    onEdit,
    onDelete,
    onRestore,
    // onUpdate is not used but kept for API compatibility
    onToggleLeave,
    loading,
}) => {
    const windowWidth = useWindowWidth();
    const isMobile = windowWidth <= 768;
    const { role } = useAuth();
    const canGenerateIdCard = hasPermission(role, ACTIONS.EMPLOYEES_WRITE);

    // ─── Local State ───────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [designationFilter, setDesignationFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [idCardEmployee, setIdCardEmployee] = useState(null);
    
    const debounceRef = useRef(null);

    // ─── Debounced Search ──────────────────────────────────────
    const handleSearchChange = useCallback((value) => {
        setSearchTerm(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(value);
            setCurrentPage(1);
        }, SEARCH_DEBOUNCE_MS);
    }, []);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    // Handle filter changes with page reset
    const handleDesignationChange = useCallback((value) => {
        setDesignationFilter(value);
        setCurrentPage(1);
    }, []);

    const handleStatusChange = useCallback((value) => {
        setStatusFilter(value);
        setCurrentPage(1);
    }, []);

    // ─── Filtered & Paginated Employees ────────────────────────
    const filteredEmployees = useMemo(() => {
        const term = debouncedSearch.toLowerCase();

        return employees.filter((emp) => {
            // Search filter
            if (term) {
                const searchMatch =
                    emp.name.toLowerCase().includes(term) ||
                    (emp.employeeId || '').toLowerCase().includes(term) ||
                    (emp.designation || '').toLowerCase().includes(term) ||
                    (emp.phone || '').includes(term);
                if (!searchMatch) return false;
            }

            // Designation filter
            if (designationFilter !== 'all' && emp.designation !== designationFilter) {
                return false;
            }

            // Status filter
            if (statusFilter !== 'all') {
                if (statusFilter === 'inactive' && !emp.isDeleted) return false;
                if (statusFilter === 'on_leave' && (!emp.onLeave || emp.isDeleted)) return false;
                if (statusFilter === 'available' && (emp.onLeave || emp.isDeleted)) return false;
            }

            return true;
        });
    }, [employees, debouncedSearch, designationFilter, statusFilter]);

    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
    const paginatedEmployees = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEmployees, currentPage]);

    // ─── Handlers ──────────────────────────────────────────────
    const handlePageChange = useCallback((delta) => {
        setCurrentPage((p) => Math.max(1, Math.min(p + delta, totalPages)));
    }, [totalPages]);

    const handleIdCard = useCallback((emp) => {
        if (canGenerateIdCard) {
            setIdCardEmployee(emp);
        }
    }, [canGenerateIdCard]);

    const handleCloseIdCard = useCallback(() => {
        setIdCardEmployee(null);
    }, []);

    // ─── Grid Classes ──────────────────────────────────────────
    const gridClasses = viewMode === 'grid'
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
        : 'flex flex-col gap-3';

    const hasActiveFilters = debouncedSearch || designationFilter !== 'all' || statusFilter !== 'all';

    return (
        <div className="bg-white border-2 border-black shadow-brutal-lg overflow-hidden">
            {/* Filter Bar */}
            <FilterBar
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                designationFilter={designationFilter}
                onDesignationChange={handleDesignationChange}
                statusFilter={statusFilter}
                onStatusChange={handleStatusChange}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                totalCount={employees.length}
                filteredCount={filteredEmployees.length}
                isMobile={isMobile}
            />

            {/* Content */}
            {loading ? (
                <SkeletonGrid />
            ) : paginatedEmployees.length === 0 ? (
                <EmptyState searchTerm={debouncedSearch} hasFilters={hasActiveFilters} />
            ) : (
                <div className={`p-4 ${gridClasses}`}>
                    {paginatedEmployees.map((emp) => (
                        <EmployeeCard
                            key={emp.id}
                            employee={emp}
                            teams={teams}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onRestore={onRestore}
                            onToggleLeave={onToggleLeave}
                            onIdCard={canGenerateIdCard ? handleIdCard : null}
                            compact={viewMode === 'list'}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && filteredEmployees.length > ITEMS_PER_PAGE && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={filteredEmployees.length}
                />
            )}

            {/* ID Card Modal */}
            {idCardEmployee && (
                <IdCardPreviewModal
                    employee={idCardEmployee}
                    onClose={handleCloseIdCard}
                />
            )}
        </div>
    );
});

EmployeeGrid.displayName = 'EmployeeGrid';

export default EmployeeGrid;
