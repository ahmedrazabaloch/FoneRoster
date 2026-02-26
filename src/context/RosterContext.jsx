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
import { AuthContext } from './AuthContext';
import { employeeService, teamService, vehicleService, configService } from '../services/firebaseService';
import { logActivity, AUDIT_ACTIONS } from '../services/auditService';

export const RosterContext = createContext(null);

export const RosterProvider = ({ children }) => {
    const auth = useContext(AuthContext);
    const adminEmail = auth?.user?.email || 'unknown';

    // ─── State ────────────────────────────────────────────────
    const [employees, setEmployees] = useState([]);
    const [teams, setTeams] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [hotlineConfig, setHotlineConfig] = useState('standard');
    const [hotlineRoster, setHotlineRoster] = useState({ morning: '', evening: '', night: '', shift1: '', shift2: '' });
    const [fieldSupervisorRoster, setFieldSupervisorRoster] = useState({ day: [], night: [] });

    // ─── Explicit loading flags ───────────────────────────────
    const [employeesLoaded, setEmployeesLoaded] = useState(false);
    const [teamsLoaded, setTeamsLoaded] = useState(false);
    const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
    const [configLoaded, setConfigLoaded] = useState(false);

    const loading = !employeesLoaded || !teamsLoaded || !vehiclesLoaded || !configLoaded;

    // ─── Snapshot listeners (all cleaned up in return) ────────
    useEffect(() => {
        // Employee snapshot (PUBLIC data only)
        const unsubEmployees = employeeService.subscribePublic(
            (data) => {
                setEmployees(data);
                setEmployeesLoaded(true);
            },
            (err) => {
                console.error('[RosterContext] public employeeService error:', err);
                setEmployeesLoaded(true);
            }
        );

        // Team snapshot
        const unsubTeams = teamService.subscribe(
            (data) => { setTeams(data); setTeamsLoaded(true); },
            () => { setTeamsLoaded(true); }
        );

        // Vehicle snapshot
        const unsubVehicles = vehicleService.subscribe(
            (data) => { setVehicles(data); setVehiclesLoaded(true); },
            () => { setVehiclesLoaded(true); }
        );

        // Config snapshot
        const unsubConfig = configService.subscribe(
            (data) => {
                if (data.hotlineConfig) setHotlineConfig(data.hotlineConfig);
                if (data.hotlineRoster) setHotlineRoster(data.hotlineRoster);
                if (data.fieldSupervisorRoster) setFieldSupervisorRoster(data.fieldSupervisorRoster);
                setConfigLoaded(true);
            },
            () => { setConfigLoaded(true); }   // doc missing or permission error — still unblock loading
        );

        return () => { unsubEmployees(); unsubTeams(); unsubVehicles(); unsubConfig(); };
    }, []);

    // ─── Vehicles lookup map (O(1) by ID) ─────────────────────
    const vehiclesMap = useMemo(() => {
        const map = {};
        vehicles.forEach(v => { map[v.id] = v; });
        return map;
    }, [vehicles]);

    // ─── Employee actions ─────────────────────────────────────
    const addEmployee = useCallback(async (userData) => {
        return employeeService.add(userData, adminEmail);
    }, [adminEmail]);

    const updateEmployee = useCallback(async (id, updates) => {
        return employeeService.update(id, updates, adminEmail);
    }, [adminEmail]);

    /**
     * Soft delete — sets isDeleted=true.
     * Physical documents are never removed.
     * @param {string} id          Firestore doc ID (internal)
     * @param {string} employeeId  Human-readable ID for audit log
     */
    const deleteEmployee = useCallback(async (id, employeeId) => {
        return employeeService.softDelete(id, employeeId, adminEmail);
    }, [adminEmail]);

    const toggleLeave = useCallback(async (id, currentStatus, employeeId) => {
        return employeeService.toggleLeave(id, currentStatus, employeeId, adminEmail);
    }, [adminEmail]);

    // ─── Team actions ─────────────────────────────────────────
    const addTeam = useCallback(async (teamData) => {
        return teamService.add(teamData, adminEmail);
    }, [adminEmail]);

    const updateTeam = useCallback(async (id, updates) => {
        return teamService.update(id, updates, adminEmail);
    }, [adminEmail]);

    const deleteTeam = useCallback(async (id) => {
        return teamService.remove(id, adminEmail);
    }, [adminEmail]);

    // ─── Vehicle actions ──────────────────────────────────────
    const addVehicle = useCallback(async (vehicleData) => {
        return vehicleService.add(vehicleData, adminEmail);
    }, [adminEmail]);

    const deleteVehicle = useCallback(async (id) => {
        return vehicleService.remove(id, adminEmail);
    }, [adminEmail]);

    // ─── Config action ────────────────────────────────────────
    const saveConfig = useCallback(async (updates) => {
        return configService.save(updates);
    }, []);

    // ─── Context value (memoized to reduce consumer re-renders) ──
    const value = useMemo(() => ({
        employees,
        users: employees,       // backward-compat alias
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
        employees, teams, vehicles, vehiclesMap,
        hotlineConfig, hotlineRoster, fieldSupervisorRoster, loading,
        addEmployee, updateEmployee, deleteEmployee, toggleLeave,
        addTeam, updateTeam, deleteTeam, addVehicle, deleteVehicle,
        saveConfig, adminEmail,
    ]);

    return <RosterContext.Provider value={value}>{children}</RosterContext.Provider>;
};
