/**
 * AlertsDropdown.jsx — Header Alerts Notification Dropdown
 *
 * Displays a bell icon with alert count badge.
 * Clicking opens a dropdown showing operational alerts.
 * Only visible to ADMIN and SUPER_ADMIN roles.
 */
import React, { useState, useRef, useEffect, useContext, useMemo } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import { RosterContext } from '../context/RosterContext';
import { useClock } from '../hooks/useClock';

/**
 * Detect conflicts and warnings from active teams
 */
function detectAlerts(activeTeams) {
    const alerts = [];

    // Check for teams without drivers
    activeTeams.filter(t => !t.driver).forEach(team => {
        alerts.push({
            id: `no-driver-${team.id}`,
            type: 'warning',
            title: 'Missing Driver',
            message: `${team.name} has no driver assigned`,
        });
    });

    // Check for teams without supervisors
    activeTeams.filter(t => !t.supervisor).forEach(team => {
        alerts.push({
            id: `no-supervisor-${team.id}`,
            type: 'warning',
            title: 'Missing Supervisor',
            message: `${team.name} has no supervisor assigned`,
        });
    });

    // Check for teams without vehicles
    activeTeams.filter(t => t.vehicleNumber === 'No Vehicle').forEach(team => {
        alerts.push({
            id: `no-vehicle-${team.id}`,
            type: 'info',
            title: 'No Vehicle',
            message: `${team.name} has no vehicle assigned`,
        });
    });

    return alerts;
}

const AlertIcon = ({ type }) => {
    switch (type) {
        case 'error':
            return <AlertCircle size={14} className="text-red-600" />;
        case 'warning':
            return <AlertTriangle size={14} className="text-yellow-600" />;
        case 'info':
            return <Info size={14} className="text-blue-600" />;
        default:
            return <Bell size={14} className="text-gray-600" />;
    }
};

export const AlertsDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const { teams, vehiclesMap, publicEmployees } = useContext(RosterContext);
    const { currentHour } = useClock();

    // Determine shift
    const isNightTime = currentHour >= 20 || currentHour < 8;

    // Build activeTeams for alert detection
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
                driver: driver ? { name: driver.name } : null,
                supervisor: supervisor ? { name: supervisor.name } : null,
            };
        });
    }, [teams, publicEmployees, vehiclesMap, isNightTime]);

    const alerts = useMemo(() => detectAlerts(activeTeams), [activeTeams]);
    const alertCount = alerts.length;

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 border-2 transition-all ${
                    isOpen
                        ? 'bg-red-600 text-white border-black shadow-brutal'
                        : alertCount > 0
                            ? 'border-red-600 text-red-600 hover:bg-red-50'
                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-black'
                }`}
            >
                <Bell size={18} />
                {alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white">
                        {alertCount > 9 ? '9+' : alertCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border-4 border-black shadow-brutal-lg z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b-2 border-black bg-gray-50">
                        <div className="flex items-center gap-2">
                            <Bell size={16} className="text-red-600" />
                            <span className="font-black text-xs uppercase tracking-widest">
                                Alerts
                            </span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-gray-200 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Alert List */}
                    <div className="max-h-[300px] overflow-y-auto">
                        {alerts.length === 0 ? (
                            <div className="p-6 text-center">
                                <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
                                <p className="text-xs font-bold text-gray-500 uppercase">
                                    All Systems Operational
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {alerts.map(alert => (
                                    <div key={alert.id} className="p-3 hover:bg-gray-50">
                                        <div className="flex items-start gap-2">
                                            <AlertIcon type={alert.type} />
                                            <div>
                                                <p className="font-bold text-xs text-gray-900">
                                                    {alert.title}
                                                </p>
                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                    {alert.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {alerts.length > 0 && (
                        <div className="p-2 border-t-2 border-black bg-gray-50 text-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                {alertCount} active alert{alertCount !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
