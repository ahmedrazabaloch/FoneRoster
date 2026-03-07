/**
 * useAdminRosterData.js — Admin data hook
 *
 * Provides access to full employee data (including sensitive fields)
 * for admin users only. This hook is used by admin components that need
 * access to employee details like CNIC, license numbers, etc.
 *
 * For public dashboard data, use usePublicDashboardData instead.
 */
import { useContext, useMemo } from 'react';
import { RosterContext } from '../../context/RosterContext';

export function useAdminRosterData() {
    const {
        employees,
        teams,
        vehicles,
        vehiclesMap,
        hotlineConfig,
        hotlineRoster,
        fieldSupervisorRoster,
        loading,
        // Actions
        addEmployee,
        updateEmployee,
        deleteEmployee,
        restoreEmployee,
        toggleLeave,
        addTeam,
        updateTeam,
        deleteTeam,
        addVehicle,
        deleteVehicle,
        saveConfig,
    } = useContext(RosterContext);

    // Derived data
    const activeEmployees = useMemo(() => 
        employees.filter(e => !e.isDeleted),
        [employees]
    );

    const deletedEmployees = useMemo(() =>
        employees.filter(e => e.isDeleted),
        [employees]
    );

    const employeesOnLeave = useMemo(() =>
        activeEmployees.filter(e => e.onLeave),
        [activeEmployees]
    );

    const availableDrivers = useMemo(() =>
        activeEmployees.filter(e => 
            e.designation === 'driver' && !e.onLeave
        ),
        [activeEmployees]
    );

    const availableSupervisors = useMemo(() =>
        activeEmployees.filter(e =>
            e.designation === 'supervisor' && !e.onLeave
        ),
        [activeEmployees]
    );

    const availableHelpers = useMemo(() =>
        activeEmployees.filter(e =>
            e.designation === 'helper' && !e.onLeave
        ),
        [activeEmployees]
    );

    return {
        // Raw data
        employees,
        teams,
        vehicles,
        vehiclesMap,
        hotlineConfig,
        hotlineRoster,
        fieldSupervisorRoster,
        loading,

        // Derived data
        activeEmployees,
        deletedEmployees,
        employeesOnLeave,
        availableDrivers,
        availableSupervisors,
        availableHelpers,

        // Actions
        addEmployee,
        updateEmployee,
        deleteEmployee,
        restoreEmployee,
        toggleLeave,
        addTeam,
        updateTeam,
        deleteTeam,
        addVehicle,
        deleteVehicle,
        saveConfig,
    };
}
