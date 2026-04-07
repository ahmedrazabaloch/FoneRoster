/**
 * EmployeeCard.jsx — Redesigned Employee Card Component
 *
 * Features:
 * - Structured layout with clear visual hierarchy
 * - Status badges (Available, On Leave, Inactive)
 * - Role-based data masking (CNIC, license numbers)
 * - Admin action menu with role-based visibility
 * - Lazy loaded images with placeholder
 * - Memoized for performance
 *
 * Props:
 *   employee: Employee data object
 *   onEdit: Function to open edit form
 *   onDelete: Function to soft-delete employee
 *   onRestore: Function to restore deleted employee
 *   onToggleLeave: Function to toggle leave status
 *   onIdCard: Function to generate ID card
 *   onTransferTeam: Function to transfer to different team
 *   teams: Array of teams for team transfer
 *   compact: Boolean for compact mode
 */
import React, { memo, useState, useCallback, useMemo } from 'react';
import {
    User,
    Phone,
    MessageCircle,
    MoreVertical,
    Edit,
    Trash2,
    CreditCard,
    UserMinus,
    RotateCcw,
    Eye,
    EyeOff,
    UserCog,
    Shield,
    ArrowRightLeft,
    Calendar,
    ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission, ACTIONS, ROLES, isSuperAdminRole } from '../../utils/rbac';
import { formatTelUrl, formatWhatsAppUrl } from '../../lib/utils';

// ─── Data Masking Utilities ────────────────────────────────────────

/**
 * Mask CNIC: Show first 5 and last 1, mask middle
 * 42101-1234567-1 → 42101-*****-1
 */
function maskCnic(cnic, showFull = false) {
    if (!cnic) return '—';
    if (showFull) return cnic;
    // Remove dashes for processing
    const clean = cnic.replace(/-/g, '');
    if (clean.length < 13) return cnic; // Don't mask incomplete
    return `${clean.slice(0, 5)}-*******-${clean.slice(-1)}`;
}

/**
 * Mask License Number: Show last 4 only
 * ABC-12-34567 → ****-****-4567
 */
function maskLicense(license, showFull = false) {
    if (!license) return '—';
    if (showFull) return license;
    const clean = license.replace(/[-\s]/g, '');
    if (clean.length <= 4) return license;
    return `****-${clean.slice(-4)}`;
}

/**
 * Mask phone number: Show area code and last 4
 * 03001234567 → 0300***4567
 */
function maskPhone(phone, showFull = false) {
    if (!phone) return '—';
    const clean = phone.replace(/\D/g, '');
    if (showFull) {
        if (clean.length === 11 && clean.startsWith('03')) {
            return `${clean.slice(0, 4)}-${clean.slice(4)}`;
        }
        if (clean.length === 10 && clean.startsWith('3')) {
            return `${clean.slice(0, 3)}-${clean.slice(3)}`;
        }
        return phone;
    }
    if (clean.length < 8) return phone;
    return `${clean.slice(0, 4)}***${clean.slice(-4)}`;
}

// ─── Status Badge Component ────────────────────────────────────────

const StatusBadge = memo(({ status, isDeleted, onClick, disabled }) => {
    const config = useMemo(() => {
        if (isDeleted) {
            return {
                label: 'Inactive',
                bg: 'bg-gray-100',
                text: 'text-gray-600',
                border: 'border-gray-300',
                dot: 'bg-gray-400',
            };
        }
        if (status === 'on_leave') {
            return {
                label: 'On Leave',
                bg: 'bg-amber-50',
                text: 'text-amber-700',
                border: 'border-amber-300',
                dot: 'bg-amber-500',
            };
        }
        return {
            label: 'Available',
            bg: 'bg-green-50',
            text: 'text-green-700',
            border: 'border-green-300',
            dot: 'bg-green-500',
        };
    }, [status, isDeleted]);

    const baseClasses = `inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${config.bg} ${config.text} ${config.border}`;

    if (onClick && !isDeleted) {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`${baseClasses} cursor-pointer hover:shadow-sm transition-shadow disabled:opacity-50`}
                title="Click to toggle leave status"
            >
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                {config.label}
            </button>
        );
    }

    return (
        <span className={baseClasses}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
        </span>
    );
});

StatusBadge.displayName = 'StatusBadge';

// ─── Designation Badge ─────────────────────────────────────────────

const DesignationBadge = memo(({ designation }) => {
    const label = (designation || 'unknown').replace(/_/g, ' ');
    
    const colorMap = {
        driver: 'bg-blue-50 text-blue-700 border-blue-200',
        supervisor: 'bg-purple-50 text-purple-700 border-purple-200',
        helper: 'bg-orange-50 text-orange-700 border-orange-200',
        hotline: 'bg-teal-50 text-teal-700 border-teal-200',
        field_supervisor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };

    const classes = colorMap[designation] || 'bg-gray-50 text-gray-700 border-gray-200';

    return (
        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded border ${classes}`}>
            {label}
        </span>
    );
});

DesignationBadge.displayName = 'DesignationBadge';

// ─── Action Menu Component ─────────────────────────────────────────

const ActionMenu = memo(({
    employee,
    onEdit,
    onDelete,
    onRestore,
    onToggleLeave,
    onIdCard,
    onViewDetails,
    canWrite,
    isSuperAdmin,
    disabled,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = useCallback(() => setIsOpen(o => !o), []);
    const closeMenu = useCallback(() => setIsOpen(false), []);

    const handleAction = useCallback((action) => {
        closeMenu();
        action?.();
    }, [closeMenu]);

    const isDeleted = employee.isDeleted;

    return (
        <div className="relative">
            <button
                onClick={toggleMenu}
                disabled={disabled}
                className="p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Actions"
            >
                <MoreVertical size={18} className="text-gray-600" />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={closeMenu} />
                    
                    {/* Menu */}
                    <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white border-2 border-black shadow-brutal rounded overflow-hidden">
                        {/* View Details */}
                        {onViewDetails && (
                            <MenuButton
                                icon={Eye}
                                label="View Details"
                                onClick={() => handleAction(onViewDetails)}
                            />
                        )}

                        {/* Edit - requires write permission */}
                        {canWrite && !isDeleted && (
                            <MenuButton
                                icon={Edit}
                                label="Edit Employee"
                                onClick={() => handleAction(onEdit)}
                            />
                        )}

                        {/* Toggle Leave - requires write permission */}
                        {canWrite && !isDeleted && (
                            <MenuButton
                                icon={Calendar}
                                label={employee.onLeave ? 'Mark Available' : 'Mark On Leave'}
                                onClick={() => handleAction(onToggleLeave)}
                            />
                        )}

                        {/* ID Card - requires write permission */}
                        {canWrite && !isDeleted && onIdCard && (
                            <MenuButton
                                icon={CreditCard}
                                label="Generate ID Card"
                                onClick={() => handleAction(onIdCard)}
                            />
                        )}

                        {/* Divider */}
                        {canWrite && <div className="border-t border-gray-200 my-1" />}

                        {/* Restore - for deleted employees */}
                        {canWrite && isDeleted && onRestore && (
                            <MenuButton
                                icon={RotateCcw}
                                label="Restore Employee"
                                onClick={() => handleAction(onRestore)}
                                className="text-green-600 hover:bg-green-50"
                            />
                        )}

                        {/* Deactivate/Delete - requires write permission */}
                        {canWrite && !isDeleted && (
                            <MenuButton
                                icon={UserMinus}
                                label="Deactivate Employee"
                                onClick={() => handleAction(onDelete)}
                                className="text-red-600 hover:bg-red-50"
                            />
                        )}

                        {/* Superadmin-only actions */}
                        {isSuperAdmin && (
                            <>
                                <div className="border-t border-gray-200 my-1" />
                                <div className="px-3 py-1">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                        Superadmin
                                    </span>
                                </div>
                                <MenuButton
                                    icon={Trash2}
                                    label="Permanently Delete"
                                    onClick={() => handleAction(onDelete)}
                                    className="text-red-600 hover:bg-red-50"
                                />
                                <MenuButton
                                    icon={Shield}
                                    label="Assign Permissions"
                                    onClick={() => {}} // TODO: Implement
                                    className="text-purple-600 hover:bg-purple-50"
                                />
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
});

ActionMenu.displayName = 'ActionMenu';

const MenuButton = memo(({ icon, label, onClick, className = '' }) => {
    const Icon = icon;

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-left hover:bg-gray-50 transition-colors ${className}`}
        >
            <Icon size={14} />
            {label}
        </button>
    );
});

MenuButton.displayName = 'MenuButton';

// ─── Contact Info Row ──────────────────────────────────────────────

const ContactRow = memo(({ icon, value, label, iconColor, href }) => {
    if (!value || value === '—') return null;
    const Icon = icon;

    return (
        <div className="flex items-center gap-2 text-sm">
            {href ? (
                <a href={href} className="inline-flex">
                    <Icon size={14} className={`flex-shrink-0 ${iconColor}`} />
                </a>
            ) : (
                <Icon size={14} className={`flex-shrink-0 ${iconColor}`} />
            )}
            {href ? (
                <a href={href} className="font-mono text-gray-700 hover:text-red-600">{value}</a>
            ) : (
                <span className="font-mono text-gray-700">{value}</span>
            )}
            {label && <span className="text-[10px] text-gray-400 uppercase">{label}</span>}
        </div>
    );
});

ContactRow.displayName = 'ContactRow';

// ─── Employee Photo Component ──────────────────────────────────────

const EmployeePhoto = memo(({ src, name, size = 'md' }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    const sizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-14 h-14',
        lg: 'w-20 h-20',
    };

    const iconSizes = { sm: 20, md: 28, lg: 40 };

    if (!src || error) {
        return (
            <div className={`${sizeClasses[size]} rounded-full bg-gray-100 border-2 border-black flex items-center justify-center`}>
                <User size={iconSizes[size]} className="text-gray-400" />
            </div>
        );
    }

    return (
        <div className={`${sizeClasses[size]} rounded-full border-2 border-black overflow-hidden bg-gray-100 relative`}>
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                </div>
            )}
            <img
                src={src}
                alt={name}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
                className={`w-full h-full object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
});

EmployeePhoto.displayName = 'EmployeePhoto';

// ─── Main Employee Card Component ──────────────────────────────────

export const EmployeeCard = memo(({
    employee,
    onEdit,
    onDelete,
    onRestore,
    onToggleLeave,
    onIdCard,
    onViewDetails,
    teams = [],
    compact = false,
}) => {
    const { role } = useAuth();
    const [showSensitive, setShowSensitive] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const canWrite = hasPermission(role, ACTIONS.EMPLOYEES_WRITE);
    const isSuperAdmin = isSuperAdminRole(role);
    
    // Admins can see sensitive data when toggled
    const canViewSensitive = role === ROLES.ADMIN || isSuperAdmin;

    const emp = employee;
    const isDeleted = emp.isDeleted;

    // Derive status
    const status = useMemo(() => {
        if (isDeleted) return 'inactive';
        if (emp.onLeave) return 'on_leave';
        return 'available';
    }, [isDeleted, emp.onLeave]);

    // Team name lookup
    const teamName = useMemo(() => {
        if (!teams.length) return null;
        const team = teams.find(t => {
            const a = t.assignments || {};
            return a.Driver === emp.id || a.Supervisor === emp.id || a.Helper === emp.id;
        });
        return team?.name || null;
    }, [teams, emp.id]);

    // Handle toggle leave with loading state
    const handleToggleLeave = useCallback(async () => {
        if (!onToggleLeave) return;
        setActionLoading(true);
        try {
            await onToggleLeave(emp.id, emp.onLeave, emp.employeeId);
        } finally {
            setActionLoading(false);
        }
    }, [onToggleLeave, emp.id, emp.onLeave, emp.employeeId]);

    // Handle delete with loading state
    const handleDelete = useCallback(async () => {
        if (!onDelete) return;
        setActionLoading(true);
        try {
            await onDelete(emp.id, emp.employeeId);
        } finally {
            setActionLoading(false);
        }
    }, [onDelete, emp.id, emp.employeeId]);

    // Handle restore with loading state
    const handleRestore = useCallback(async () => {
        if (!onRestore) return;
        setActionLoading(true);
        try {
            await onRestore(emp.id, emp.employeeId);
        } finally {
            setActionLoading(false);
        }
    }, [onRestore, emp.id, emp.employeeId]);

    const handleIdCard = useCallback(() => {
        onIdCard?.(emp);
    }, [onIdCard, emp]);

    const handleEdit = useCallback(() => {
        onEdit?.(emp);
    }, [onEdit, emp]);

    const handleViewDetails = useCallback(() => {
        onViewDetails?.(emp);
    }, [onViewDetails, emp]);

    return (
        <div
            className={`bg-white border-2 border-black shadow-brutal transition-all hover:shadow-brutal-lg ${
                isDeleted ? 'opacity-60' : ''
            } ${compact ? 'p-3' : 'p-4'}`}
        >
            {/* ── TOP SECTION: Photo, Name, Status ── */}
            <div className="flex items-start gap-3">
                {/* Photo */}
                <EmployeePhoto
                    src={emp.photo || emp.photoUrl}
                    name={emp.name}
                    size={compact ? 'sm' : 'md'}
                />

                {/* Name & Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            {/* Name */}
                            <h3 className="font-black text-sm uppercase tracking-wide text-gray-900 truncate">
                                {emp.name}
                            </h3>
                            
                            {/* Employee ID */}
                            <span className="text-[10px] font-mono text-gray-500">
                                {emp.employeeId || 'No ID'}
                            </span>
                        </div>

                        {/* Action Menu */}
                        <ActionMenu
                            employee={emp}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onRestore={handleRestore}
                            onToggleLeave={handleToggleLeave}
                            onIdCard={handleIdCard}
                            onViewDetails={handleViewDetails}
                            canWrite={canWrite}
                            isSuperAdmin={isSuperAdmin}
                            disabled={actionLoading}
                        />
                    </div>

                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <DesignationBadge designation={emp.designation} />
                        <StatusBadge
                            status={status}
                            isDeleted={isDeleted}
                            onClick={canWrite && !isDeleted ? handleToggleLeave : null}
                            disabled={actionLoading}
                        />
                        {teamName && (
                            <span className="text-[10px] font-bold text-gray-500 uppercase">
                                Team: {teamName}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── CONTACT SECTION ── */}
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5">
                <ContactRow
                    icon={Phone}
                    value={canViewSensitive ? maskPhone(emp.phone, true) : maskPhone(emp.phone, showSensitive)}
                    href={canViewSensitive ? formatTelUrl(emp.phone) : undefined}
                    iconColor="text-blue-500"
                />
                {emp.whatsapp && emp.whatsapp !== emp.phone && (
                    <ContactRow
                        icon={MessageCircle}
                        value={canViewSensitive ? maskPhone(emp.whatsapp, true) : maskPhone(emp.whatsapp, showSensitive)}
                        href={canViewSensitive ? formatWhatsAppUrl(emp.whatsapp) : undefined}
                        label="WhatsApp"
                        iconColor="text-green-500"
                    />
                )}
            </div>

            {/* ── SENSITIVE DATA SECTION (Admin Only) ── */}
            {canViewSensitive && (emp.cnic || emp.licenseNo) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Sensitive Info
                        </span>
                        <button
                            onClick={() => setShowSensitive(s => !s)}
                            className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-gray-700"
                        >
                            {showSensitive ? <EyeOff size={12} /> : <Eye size={12} />}
                            {showSensitive ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <div className="space-y-1 text-sm font-mono">
                        {emp.cnic && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 w-12">CNIC</span>
                                <span className="text-gray-700">{maskCnic(emp.cnic, showSensitive)}</span>
                            </div>
                        )}
                        {emp.licenseNo && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 w-12">License</span>
                                <span className="text-gray-700">{maskLicense(emp.licenseNo, showSensitive)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── QUICK ACTIONS (Compact Mode) ── */}
            {compact && canWrite && !isDeleted && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                    <button
                        onClick={handleEdit}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-yellow-400 text-black font-bold text-xs uppercase border-2 border-black shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
                    >
                        <Edit size={12} />
                        Edit
                    </button>
                    {onIdCard && (
                        <button
                            onClick={handleIdCard}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-500 text-white font-bold text-xs uppercase border-2 border-black shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
                        >
                            <CreditCard size={12} />
                            ID Card
                        </button>
                    )}
                </div>
            )}
        </div>
    );
});

EmployeeCard.displayName = 'EmployeeCard';

export default EmployeeCard;
