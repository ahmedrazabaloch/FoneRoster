/**
 * AdminSidebar.jsx — Unified Admin Sidebar Navigation
 *
 * Role-based navigation for the unified admin dashboard.
 * Shows different sections based on user permissions.
 *
 * Admin sections (both admin & superadmin):
 *   - Dashboard Overview
 *   - Roster Control (Field Teams, Hotline Staff)
 *   - Employee Directory
 *   - Teams
 *   - Vehicles
 *   - Exports
 *   - Activity Logs
 *
 * Superadmin-only sections:
 *   - Admin Management
 *   - Authority Configuration
 *   - System Settings
 */
import React from 'react';
import {
    LayoutDashboard,
    Users,
    Truck,
    Download,
    Shield,
    Settings,
    UserCog,
    FileSignature,
    Briefcase,
    Phone,
    FileText,
    ChevronDown,
    ChevronRight,
    Bell,
    UserPlus,
    List,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission, ACTIONS, ROLES } from '../../utils/rbac';

/**
 * Navigation item configuration
 * Each item specifies:
 *   - id: unique identifier
 *   - label: display text
 *   - icon: Lucide icon component
 *   - permission: required ACTIONS permission (optional, defaults to visible)
 *   - moduleKey: key in modulePermissions for admin-level access control
 *   - superadminOnly: only show for superadmin role
 *   - children: nested navigation items
 */
const NAV_CONFIG = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        superadminOnly: true,
    },
    {
        id: 'roster',
        label: 'Roster Control',
        icon: Briefcase,
        permission: ACTIONS.ROSTER_CONTROL,
        moduleKey: 'rosterControl',
        children: [
            { id: 'field-teams', label: 'Field Teams', icon: Users, moduleKey: 'fieldTeams' },
            { id: 'hotline', label: 'Hotline Staff', icon: Phone, moduleKey: 'hotlineStaff' },
        ],
    },
    {
        id: 'directory',
        label: 'Employee Directory',
        icon: Users,
        permission: ACTIONS.EMPLOYEES_READ,
        moduleKey: 'teamDirectory',
        children: [
            { id: 'directory-view', label: 'View Directory', icon: List, moduleKey: 'teamDirectory' },
            { id: 'add-member', label: 'Add Member', icon: UserPlus, moduleKey: 'teamDirectory' },
        ],
    },
    {
        id: 'teams',
        label: 'Teams',
        icon: Users,
        permission: ACTIONS.TEAMS_READ,
        moduleKey: 'rosterControl',
    },
    {
        id: 'vehicles',
        label: 'Vehicles',
        icon: Truck,
        permission: ACTIONS.VEHICLES_READ,
        moduleKey: 'rosterControl',
    },
    {
        id: 'exports',
        label: 'Exports',
        icon: Download,
        permission: ACTIONS.EXPORTS,
        moduleKey: 'exports',
    },
    {
        id: 'audit',
        label: 'Activity Logs',
        icon: FileText,
        permission: ACTIONS.LOGS_READ,
        moduleKey: 'auditLogs',
    },
    {
        id: 'alerts',
        label: 'Alerts',
        icon: Bell,
        moduleKey: 'auditLogs',
    },
    // Superadmin-only sections
    {
        id: 'divider-superadmin',
        type: 'divider',
        label: 'System Administration',
        superadminOnly: true,
    },
    {
        id: 'admin-management',
        label: 'Admin Management',
        icon: UserCog,
        superadminOnly: true,
        permission: ACTIONS.ADMIN_MANAGE,
    },
    {
        id: 'authority-config',
        label: 'Authority Signature',
        icon: FileSignature,
        superadminOnly: true,
        permission: ACTIONS.AUTHORITY_CONFIG,
    },
    {
        id: 'system-settings',
        label: 'System Settings',
        icon: Settings,
        superadminOnly: true,
        permission: ACTIONS.SYSTEM_CONFIG,
    },
];

/**
 * Single navigation item component
 */
const NavItem = ({ item, isActive, onClick, isExpanded, onToggleExpand }) => {
    const Icon = item.icon;
    const hasChildren = item.children?.length > 0;

    return (
        <div>
            <button
                onClick={() => {
                    if (hasChildren) {
                        onToggleExpand(item.id);
                    } else {
                        onClick(item.id);
                    }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left font-bold text-sm uppercase tracking-wide transition-all border-l-4 ${
                    isActive
                        ? 'bg-red-50 border-red-600 text-red-600'
                        : 'border-transparent hover:bg-gray-50 hover:border-gray-300 text-gray-700'
                }`}
            >
                {Icon && <Icon size={18} />}
                <span className="flex-1">{item.label}</span>
                {hasChildren && (
                    <span className="text-gray-400">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                )}
            </button>

            {/* Nested items */}
            {hasChildren && isExpanded && (
                <div className="pl-4 md:pl-6 border-l-2 border-gray-200 ml-4 md:ml-6">
                    {item.children.map((child) => (
                        <button
                            key={child.id}
                            onClick={() => onClick(child.id)}
                            className={`w-full flex items-center gap-2 px-3 py-3 md:py-2 text-left font-semibold text-xs uppercase tracking-wide transition-all min-h-[44px] md:min-h-0 ${
                                isActive === child.id
                                    ? 'text-red-600 bg-red-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            {child.icon && <child.icon size={14} />}
                            <span>{child.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * Section divider with optional label
 */
const Divider = ({ label }) => (
    <div className="py-3 px-4">
        <div className="border-t-2 border-gray-200" />
        {label && (
            <span className="block mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                {label}
            </span>
        )}
    </div>
);

/**
 * Main sidebar component
 */
export const AdminSidebar = ({ activeSection, onSectionChange, className = '' }) => {
    const { role, modulePermissions } = useAuth();
    const [expandedItems, setExpandedItems] = React.useState(['roster', 'directory']);

    const isSuperAdmin = role === ROLES.SUPER_ADMIN;
    const isAdmin = role === ROLES.ADMIN;

    const toggleExpand = (itemId) => {
        setExpandedItems((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
    };

    /**
     * Check if an item should be visible based on modulePermissions
     * For admins, modulePermissions controls access to specific modules
     * For superadmins, all modules are accessible
     */
    const hasModuleAccess = (moduleKey) => {
        if (!moduleKey) return true; // No module restriction
        if (isSuperAdmin) return true; // Superadmin has access to everything
        if (!isAdmin) return false; // Non-admin/superadmin roles don't use module permissions
        if (!modulePermissions) return false; // Admin without modulePermissions = no access
        return modulePermissions[moduleKey] === true;
    };

    // Filter nav items based on role, permissions, and modulePermissions
    const visibleItems = NAV_CONFIG.filter((item) => {
        // Superadmin-only items
        if (item.superadminOnly && !isSuperAdmin) {
            return false;
        }
        // Permission-based visibility (RBAC)
        if (item.permission && !hasPermission(role, item.permission)) {
            return false;
        }
        // Module-based visibility (Firestore modulePermissions)
        if (item.moduleKey && !hasModuleAccess(item.moduleKey)) {
            return false;
        }
        return true;
    }).map((item) => {
        // Filter children based on modulePermissions
        if (item.children) {
            const filteredChildren = item.children.filter((child) => {
                if (child.moduleKey && !hasModuleAccess(child.moduleKey)) {
                    return false;
                }
                return true;
            });
            // If no children are visible, hide the parent too
            if (filteredChildren.length === 0) {
                return null;
            }
            return { ...item, children: filteredChildren };
        }
        return item;
    }).filter(Boolean);

    return (
        <nav className={`bg-white border-r-2 border-black ${className}`}>
            {/* Header */}
            <div className="p-4 border-b-2 border-black bg-gray-900 text-white">
                <div className="flex items-center gap-2">
                    <Shield size={20} />
                    <div>
                        <h2 className="font-black text-sm uppercase tracking-wide">Admin Panel</h2>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {isSuperAdmin ? 'Super Admin' : 'Administrator'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation items */}
            <div className="py-2">
                {visibleItems.map((item) => {
                    if (item.type === 'divider') {
                        return <Divider key={item.id} label={item.label} />;
                    }

                    const isExpanded = expandedItems.includes(item.id);
                    const isActive =
                        activeSection === item.id ||
                        item.children?.some((child) => child.id === activeSection);

                    return (
                        <NavItem
                            key={item.id}
                            item={item}
                            isActive={isActive ? activeSection : null}
                            onClick={onSectionChange}
                            isExpanded={isExpanded}
                            onToggleExpand={toggleExpand}
                        />
                    );
                })}
            </div>
        </nav>
    );
};

export default AdminSidebar;
