/**
 * RosterContext.jsx
 * Application-wide state management.
 *
 * Rules enforced:
 *  - ZERO Firestore imports — all persistence delegated to service layer
 *  - Snapshot listeners returned and cleaned up in useEffect
 *  - No serverTimestamp(), deleteDoc, or addDoc here
 *  - Context exposes service function wrappers bound to adminEmail
 *  - Loading uses explicit boolean flags (not numeric counters)
 */
import React, { createContext, useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { AuthContext } from '../auth/AuthContext';
import { employeeService, teamService, vehicleService, configService } from '../services/firebaseService';
import { logActivity, AUDIT_ACTIONS } from '../services/auditService';
import { requirePermission } from '../utils/rbac';

export const RosterContext = createContext(null);

export const RosterProvider = ({ children }) => {
    const auth = useContext(AuthContext);
    const adminEmail = auth?.user?.email || 'unknown';
    const role = auth?.role || 'public';

    // ─── State ────────────────────────────────────────────────
    const [employees, setEmployees] = useState([]);       // full admin data (auth-gated)
    const [publicEmployees, setPublicEmployees] = useState([]); // sanitized public view
    const [teams, setTeams] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [hotlineConfig, setHotlineConfig] = useState('standard');
    const [hotlineRoster, setHotlineRoster] = useState({ morning: '', evening: '', night: '', shift1: '', shift2: '' });
    const [fieldSupervisorRoster, setFieldSupervisorRoster] = useState({ day: [], night: [] });

    // ─── Explicit loading flags ───────────────────────────────
    const [employeesLoaded, setEmployeesLoaded] = useState(false);
    const [publicEmployeesLoaded, setPublicEmployeesLoaded] = useState(false);
    const [teamsLoaded, setTeamsLoaded] = useState(false);
    const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
    const [configLoaded, setConfigLoaded] = useState(false);

    // Dashboard is unblocked as soon as public data is ready.
    // Admin tools additionally wait for full employee data.
    const loading = !publicEmployeesLoaded || !teamsLoaded || !vehiclesLoaded || !configLoaded;

    // ─── Snapshot listeners (all cleaned up in return) ────────
    useEffect(() => {
        // ── publicEmployees: always subscribed (no auth required) ──
        // Used by the public dashboard — reads the publicEmployees mirror collection.
        const unsubPublicEmployees = employeeService.subscribePublic(
            (data) => { setPublicEmployees(data); setPublicEmployeesLoaded(true); },
            () => { setPublicEmployeesLoaded(true); }
        );

        // Team snapshot (public collection)
        const unsubTeams = teamService.subscribe(
            (data) => { setTeams(data); setTeamsLoaded(true); },
            () => { setTeamsLoaded(true); }
        );

        // Vehicle snapshot (public collection)
        const unsubVehicles = vehicleService.subscribe(
            (data) => { setVehiclesLoaded(true); setVehicles(data); },
            () => { setVehiclesLoaded(true); }
        );

        // Config snapshot (public collection)
        const unsubConfig = configService.subscribe(
            (data) => {
                if (data.hotlineConfig) setHotlineConfig(data.hotlineConfig);
                if (data.hotlineRoster) setHotlineRoster(data.hotlineRoster);
                if (data.fieldSupervisorRoster) setFieldSupervisorRoster(data.fieldSupervisorRoster);
                setConfigLoaded(true);
            },
            () => { setConfigLoaded(true); }
        );

        return () => { unsubPublicEmployees(); unsubTeams(); unsubVehicles(); unsubConfig(); };
    }, []); // runs once — public subscriptions never change

    // ── Full employees: only when authenticated as admin+ ──
    // Admin panels (FieldTeamConfig, DirectoryManager, etc.) need licenseNo, cnic, etc.
    useEffect(() => {
        if (role === 'admin' || role === 'superadmin') {
            const unsub = employeeService.subscribe(
                (data) => { setEmployees(data); setEmployeesLoaded(true); },
                () => { setEmployeesLoaded(true); }
            );
            return unsub;
        } else {
            // Non-admin: mark as loaded immediately (don't wait for auth-gated read)
            setEmployeesLoaded(true);
        }
    }, [role]);

    // ─── Vehicles lookup map (O(1) by ID) ─────────────────────
    const vehiclesMap = useMemo(() => {
        const map = {};
        vehicles.forEach(v => { map[v.id] = v; });
        return map;
    }, [vehicles]);

    // ─── Employee actions ─────────────────────────────────────
    const addEmployee = useCallback(async (userData) => {
        requirePermission(role, 'employees:write');
        return employeeService.add(userData, adminEmail);
    }, [role, adminEmail]);

    const updateEmployee = useCallback(async (id, updates) => {
        requirePermission(role, 'employees:write');
        return employeeService.update(id, updates, adminEmail);
    }, [role, adminEmail]);

    /**
     * Soft delete — sets isDeleted=true.
     * Physical documents are never removed.
     * @param {string} id          Firestore doc ID (internal)
     * @param {string} employeeId  Human-readable ID for audit log
     */
    const deleteEmployee = useCallback(async (id, employeeId) => {
        requirePermission(role, 'employees:write');
        return employeeService.softDelete(id, employeeId, adminEmail);
    }, [role, adminEmail]);

    const restoreEmployee = useCallback(async (id) => {
        requirePermission(role, 'employees:write');
        return employeeService.restore(id, adminEmail);
    }, [role, adminEmail]);

    const toggleLeave = useCallback(async (id, currentStatus, employeeId) => {
        requirePermission(role, 'employees:write');
        return employeeService.toggleLeave(id, currentStatus, employeeId, adminEmail);
    }, [role, adminEmail]);

    // ─── Team actions ─────────────────────────────────────────
    const addTeam = useCallback(async (teamData) => {
        requirePermission(role, 'teams:write');
        return teamService.add(teamData, adminEmail);
    }, [role, adminEmail]);

    const updateTeam = useCallback(async (id, updates) => {
        requirePermission(role, 'teams:write');
        return teamService.update(id, updates, adminEmail);
    }, [role, adminEmail]);

    const deleteTeam = useCallback(async (id) => {
        requirePermission(role, 'teams:write');
        return teamService.remove(id, adminEmail);
    }, [role, adminEmail]);

    // ─── Vehicle actions ──────────────────────────────────────
    const addVehicle = useCallback(async (vehicleData) => {
        requirePermission(role, 'vehicles:write');
        return vehicleService.add(vehicleData, adminEmail);
    }, [role, adminEmail]);

    const deleteVehicle = useCallback(async (id) => {
        requirePermission(role, 'vehicles:write');
        return vehicleService.remove(id, adminEmail);
    }, [role, adminEmail]);

    // ─── Config action ────────────────────────────────────────
    const saveConfig = useCallback(async (updates) => {
        requirePermission(role, 'config:write');
        return configService.save(updates);
    }, [role]);

    // ─── Context value (memoized to reduce consumer re-renders) ──
    const value = useMemo(() => ({
        employees,            // full data — only populated for admin+, empty for public
        publicEmployees,      // sanitized (name, phone, whatsapp) — always populated
        users: employees,     // backward-compat alias
        teams,
        vehicles,
        vehiclesMap,
        hotlineConfig,
        hotlineRoster,
        fieldSupervisorRoster,
        loading,

        // State setters exposed for config panels
        setHotlineConfig,
        setHotlineRoster,
        setFieldSupervisorRoster,
        // No-op stubs kept for backward compat with roster panels
        setTeams: () => { },
        setAssignments: () => { },
        setEmployees: () => { },

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

        // Audit helper for panels that need to log non-CRUD events
        logActivity: (params) => logActivity({ adminEmail, ...params }),
        AUDIT_ACTIONS,
    }), [
        employees, publicEmployees, teams, vehicles, vehiclesMap,
        hotlineConfig, hotlineRoster, fieldSupervisorRoster, loading,
        addEmployee, updateEmployee, deleteEmployee, restoreEmployee, toggleLeave,
        addTeam, updateTeam, deleteTeam, addVehicle, deleteVehicle,
        saveConfig, adminEmail,
    ]);

    return <RosterContext.Provider value={value}>{children}</RosterContext.Provider>;
};
