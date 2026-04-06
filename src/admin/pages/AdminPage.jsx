/**
 * AdminPage.jsx — Unified Admin Dashboard
 *
 * Route: /admin
 * Access: admin or superadmin (enforced by ProtectedRoute in routes.jsx)
 *
 * Single unified dashboard for both admin and superadmin roles.
 * Sidebar navigation shows sections based on user permissions.
 *
 * Admin sections:
 *   - Dashboard Overview (live roster view + alerts)
 *   - Roster Control (Field Teams, Hotline Staff)
 *   - Employee Directory
 *   - Teams
 *   - Vehicles
 *   - Exports
 *   - Activity Logs
 *   - QR Scan Logs
 *
 * Superadmin-only sections:
 *   - Admin Management (user accounts)
 */
import React, { useState, useContext, useMemo } from 'react';
import { Menu, X } from 'lucide-react';
import { AdminSidebar } from '../components/AdminSidebar';
import { FieldTeamAssignments } from '../components/FieldTeamAssignments';
import { CreateTeamSection } from '../components/CreateTeamSection';
import { HotlineConfig } from '../components/HotlineConfig';
import { AddMemberForm } from '../components/AddMemberForm';
import { EmployeeDirectoryView } from '../components/EmployeeDirectoryView';
import { ExportsPanel } from '../components/ExportsPanel';
import { AuditLogs } from '../components/AuditLogs';
import { ScanLogViewer } from '../../features/scanLogs/ScanLogViewer';
import { AlertsPanel } from '../../dashboard/components/AlertsPanel';
import { VehicleManagementPage } from '../components/VehicleManagementPage';
import { RosterContext } from '../../context/RosterContext';
import { useClock } from '../../hooks/useClock';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/rbac';

// Lazy load superadmin components
const UserManagementPanel = React.lazy(() =>
    import('../../features/superadmin/UserManagementPanel').then(m => ({ default: m.UserManagementPanel }))
);

export const AdminPage = () => {
    const { role } = useAuth();
    const { teams, vehiclesMap, publicEmployees, loading } = useContext(RosterContext);
    const { currentHour } = useClock();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isSuperAdmin = role === ROLES.SUPER_ADMIN;

    // Determine shift for alerts
    const isNightTime = currentHour >= 20 || currentHour < 8;

    // Build activeTeams for AlertsPanel
    const activeTeams = useMemo(() => {
        const employees = publicEmployees;
        const shiftTeams = teams.filter(t =>
            isNightTime ? t.shift === 'Night' : t.shift === 'Day'
        );

        return shiftTeams.map(team => {
            const assign = team.assignments || {};
            let vehicleNumber = 'No Vehicle';
            if (team.vehicleId && vehiclesMap[team.vehicleId]) {
                vehicleNumber = vehiclesMap[team.vehicleId].number;
            }

            const driver = employees.find(e => e.id === assign.Driver);
            const supervisor = employees.find(e => e.id === assign.Supervisor);

            return {
                id: team.id,
                name: team.name,
                vehicleNumber,
                route: team.route || '',
                driver: driver ? { name: driver.name } : null,
                supervisor: supervisor ? { name: supervisor.name } : null,
            };
        });
    }, [teams, publicEmployees, vehiclesMap, isNightTime]);

    // Handle section change and close mobile sidebar
    const handleSectionChange = (sectionId) => {
        setActiveSection(sectionId);
        setSidebarOpen(false);
    };

    // Render content based on active section
    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return (
                    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
                        <SectionHeader title="Dashboard" subtitle="Admin control panel overview" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="border-2 border-black p-6 bg-white shadow-brutal">
                                <h3 className="font-black text-sm uppercase text-gray-900 mb-2">Quick Stats</h3>
                                <p className="text-gray-600 text-sm">Select a section from the sidebar to manage your roster.</p>
                            </div>
                        </div>
                    </div>
                );

            case 'alerts':
                return (
                    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
                        <SectionHeader title="Operational Alerts" subtitle="Monitor system alerts and warnings" />
                        <AlertsPanel activeTeams={activeTeams} loading={loading} />
                    </div>
                );

            case 'field-teams':
                return (
                    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
                        <SectionHeader title="Field Teams" subtitle="Configure field team assignments" />
                        <FieldTeamAssignments />
                    </div>
                );

            case 'hotline':
                return (
                    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
                        <SectionHeader title="Hotline Staff" subtitle="Manage hotline personnel" />
                        <HotlineConfig />
                    </div>
                );

            case 'directory':
            case 'directory-view':
                return (
                    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
                        <SectionHeader title="Employee Directory" subtitle="View and manage employee records" />
                        <EmployeeDirectoryView />
                    </div>
                );

            case 'add-member':
                return (
                    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
                        <SectionHeader title="Add New Member" subtitle="Create a new employee record" />
                        <AddMemberForm />
                    </div>
                );

            case 'teams':
                return (
                    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
                        <SectionHeader title="Teams" subtitle="Create new teams" />
                        <CreateTeamSection />
                    </div>
                );

            case 'vehicles':
                return (
                    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
                        <SectionHeader title="Vehicles" subtitle="Manage vehicle fleet" />
                        <VehicleManagementPage />
                    </div>
                );

            case 'exports':
                return (
                    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
                        <SectionHeader title="Exports" subtitle="Export data and reports" />
                        <ExportsPanel />
                    </div>
                );

            case 'audit':
                return (
                    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
                        <SectionHeader title="Activity Logs" subtitle="Review system activity" />
                        <AuditLogs />
                    </div>
                );

            case 'scanLogs':
                return (
                    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
                        <SectionHeader title="QR Scan Logs" subtitle="Review scan verification activity" />
                        <ScanLogViewer />
                    </div>
                );

            // Superadmin-only sections
            case 'admin-management':
                if (!isSuperAdmin) return <AccessDenied />;
                return (
                    <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-8">
                        <SectionHeader title="Admin Management" subtitle="Manage administrator accounts" />
                        <React.Suspense fallback={<LoadingPanel />}>
                            <UserManagementPanel />
                        </React.Suspense>
                    </div>
                );

            default:
                return (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-gray-400 font-bold uppercase">Select a section from the sidebar</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-stretch md:flex">
            <aside className="hidden md:flex md:w-72 md:flex-shrink-0 md:border-r-2 md:border-black md:bg-white md:sticky md:top-0 md:h-screen">
                <AdminSidebar
                    activeSection={activeSection}
                    onSectionChange={handleSectionChange}
                    className="h-full"
                />
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur md:hidden">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                            Admin Panel
                        </p>
                        <h1 className="text-sm font-black uppercase tracking-wide text-gray-900">
                            Navigation
                        </h1>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
                        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </header>

                <main className="flex-1 min-w-0 overflow-auto">
                    {renderContent()}
                </main>
            </div>

            <div
                className={`fixed inset-0 z-40 transition-opacity duration-300 md:hidden ${
                    sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
            >
                <div
                    className={`absolute inset-0 bg-slate-950/60 transition-opacity duration-300 ${
                        sidebarOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                />

                <div
                    className={`absolute left-0 top-16 bottom-0 z-50 w-80 max-w-[86vw] bg-white shadow-2xl transition-transform duration-300 ease-out ${
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <div className="h-full overflow-y-auto">
                        <AdminSidebar
                            activeSection={activeSection}
                            onSectionChange={handleSectionChange}
                            className="h-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Section header component
 */
const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-4 md:mb-8 border-b-4 border-black pb-3 md:pb-4">
        <h1 className="text-2xl md:text-4xl font-black uppercase">{title}</h1>
        {subtitle && (
            <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">
                {subtitle}
            </p>
        )}
    </div>
);

/**
 * Loading placeholder
 */
const LoadingPanel = () => (
    <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-red-600 rounded-full" />
    </div>
);

/**
 * Access denied message
 */
const AccessDenied = () => (
    <div className="flex items-center justify-center h-64">
        <div className="text-center">
            <Settings size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold uppercase">
                Access Denied
            </p>
            <p className="text-xs text-gray-400 mt-1">
                This section requires Super Admin privileges
            </p>
        </div>
    </div>
);
