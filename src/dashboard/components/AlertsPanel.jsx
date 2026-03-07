/**
 * AlertsPanel.jsx — System Alerts and Warnings Panel
 *
 * Displays:
 * - Conflict warnings
 * - Assignment errors
 * - QR scan alerts (future)
 * - System warnings
 *
 * Part of the Right Column (Alerts Panel) in the dashboard layout.
 */
import React, { useMemo } from 'react';
import { AlertTriangle, AlertCircle, Info, Bell, CheckCircle } from 'lucide-react';

/**
 * Detect conflicts and warnings from active teams
 */
function detectAlerts(activeTeams) {
    const alerts = [];

    // Check for teams without drivers
    const teamsWithoutDrivers = activeTeams.filter(t => !t.driver);
    if (teamsWithoutDrivers.length > 0) {
        teamsWithoutDrivers.forEach(team => {
            alerts.push({
                id: `no-driver-${team.id}`,
                type: 'warning',
                title: 'Missing Driver',
                message: `${team.name} has no driver assigned`,
                team: team.name,
            });
        });
    }

    // Check for teams without supervisors
    const teamsWithoutSupervisors = activeTeams.filter(t => !t.supervisor);
    if (teamsWithoutSupervisors.length > 0) {
        teamsWithoutSupervisors.forEach(team => {
            alerts.push({
                id: `no-supervisor-${team.id}`,
                type: 'warning',
                title: 'Missing Supervisor',
                message: `${team.name} has no supervisor assigned`,
                team: team.name,
            });
        });
    }

    // Check for teams without vehicles
    const teamsWithoutVehicles = activeTeams.filter(t => t.vehicleNumber === 'No Vehicle');
    if (teamsWithoutVehicles.length > 0) {
        teamsWithoutVehicles.forEach(team => {
            alerts.push({
                id: `no-vehicle-${team.id}`,
                type: 'info',
                title: 'No Vehicle',
                message: `${team.name} has no vehicle assigned`,
                team: team.name,
            });
        });
    }

    // Check for teams without routes
    const teamsWithoutRoutes = activeTeams.filter(t => !t.route);
    if (teamsWithoutRoutes.length > 0) {
        teamsWithoutRoutes.forEach(team => {
            alerts.push({
                id: `no-route-${team.id}`,
                type: 'info',
                title: 'No Route',
                message: `${team.name} has no route assigned`,
                team: team.name,
            });
        });
    }

    return alerts;
}

const AlertIcon = ({ type }) => {
    switch (type) {
        case 'error':
            return <AlertCircle size={16} className="text-red-600" />;
        case 'warning':
            return <AlertTriangle size={16} className="text-yellow-600" />;
        case 'info':
            return <Info size={16} className="text-blue-600" />;
        case 'success':
            return <CheckCircle size={16} className="text-green-600" />;
        default:
            return <Bell size={16} className="text-gray-600" />;
    }
};

const AlertItem = ({ alert }) => {
    const bgColor = {
        error: 'bg-red-50 border-red-600',
        warning: 'bg-yellow-50 border-yellow-600',
        info: 'bg-blue-50 border-blue-600',
        success: 'bg-green-50 border-green-600',
    }[alert.type] || 'bg-gray-50 border-gray-600';

    return (
        <div className={`p-3 border-l-4 ${bgColor} mb-2`}>
            <div className="flex items-start gap-2">
                <AlertIcon type={alert.type} />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs uppercase tracking-wide text-gray-800">
                        {alert.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                        {alert.message}
                    </p>
                </div>
            </div>
        </div>
    );
};

export const AlertsPanel = ({ activeTeams = [], loading = false }) => {
    const alerts = useMemo(() => detectAlerts(activeTeams), [activeTeams]);

    if (loading) {
        return (
            <div className="bg-white border-2 md:border-4 border-black shadow-brutal md:shadow-brutal-lg p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-red-600 p-2 border-2 border-black shadow-brutal-sm">
                        <Bell size={16} className="text-white" />
                    </div>
                    <h3 className="font-black text-lg uppercase tracking-wide text-gray-900">
                        Alerts
                    </h3>
                </div>
                <div className="space-y-2">
                    <div className="h-12 bg-gray-200 animate-pulse rounded" />
                    <div className="h-12 bg-gray-200 animate-pulse rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border-2 md:border-4 border-black shadow-brutal md:shadow-brutal-lg p-4 md:p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-red-600 p-2 border-2 border-black shadow-brutal-sm">
                        <Bell size={16} className="text-white" />
                    </div>
                    <h3 className="font-black text-lg uppercase tracking-wide text-gray-900">
                        Alerts
                    </h3>
                </div>
                {alerts.length > 0 && (
                    <span className="bg-red-600 text-white px-2 py-0.5 text-xs font-black border-2 border-black">
                        {alerts.length}
                    </span>
                )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {alerts.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-500 uppercase">
                            All Systems Operational
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            No warnings or conflicts detected
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {alerts.map(alert => (
                            <AlertItem key={alert.id} alert={alert} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
