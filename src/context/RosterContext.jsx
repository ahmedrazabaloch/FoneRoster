/**
 * RosterContext.jsx
 * Application-wide state management.
 *
 * Rules enforced:
 *  - ZERO Firestore imports — all persistence delegated to service layer
 *  - Snapshot listeners returned and cleaned up in useEffect
 *  - No serverTimestamp(), deleteDoc, or addDoc here
 *  - Context exposes service function wrappers bound to adminEmail
 */
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { employeeService, teamService, configService } from '../services/firebaseService';
import { logActivity, AUDIT_ACTIONS } from '../services/auditService';

export const RosterContext = createContext(null);

export const RosterProvider = ({ children }) => {
    const auth = useContext(AuthContext);
    const adminEmail = auth?.user?.email || 'unknown';

    // ─── State ────────────────────────────────────────────────
    const [employees, setEmployees] = useState([]);
    const [teams, setTeams] = useState([]);
    const [hotlineConfig, setHotlineConfig] = useState('standard');
    const [hotlineRoster, setHotlineRoster] = useState({ morning: '', evening: '', night: '', shift1: '', shift2: '' });
    const [fieldSupervisorRoster, setFieldSupervisorRoster] = useState({ day: [], night: [] });
    const [loading, setLoading] = useState(true);

    // ─── Snapshot listeners (all cleaned up in return) ────────
    useEffect(() => {
        // Wait until Firebase Auth has resolved before starting Firestore listeners.
        // Starting listeners before auth resolves causes permission-denied errors.
        console.log('[RosterContext] auth.loading:', auth.loading, '| auth.user:', auth?.user?.email || null);
        if (auth.loading) return;

        // If there is no signed-in user, Firestore rules will reject all reads.
        // Clear state and mark as done loading so the UI shows the login screen.
        if (!auth.user) {
            setEmployees([]);
            setTeams([]);
            setLoading(false);
            return;
        }

        let loadCount = 0;
        const checkLoaded = () => { loadCount++; if (loadCount >= 3) setLoading(false); };

        // Employee snapshot
        const unsubEmployees = employeeService.subscribe(
            (data) => {
                console.log('[RosterContext] employees received:', data.length, data.map(e => e.name));
                setEmployees(data);
                checkLoaded();
            },
            (err) => {
                console.error('[RosterContext] employeeService error:', err);
                checkLoaded();
            }
        );

        // Team snapshot
        const unsubTeams = teamService.subscribe(
            (data) => { setTeams(data); checkLoaded(); },
            () => { checkLoaded(); }
        );

        // Config snapshot — call checkLoaded even when doc is missing
        const unsubConfig = configService.subscribe(
            (data) => {
                if (data.hotlineConfig) setHotlineConfig(data.hotlineConfig);
                if (data.hotlineRoster) setHotlineRoster(data.hotlineRoster);
                if (data.fieldSupervisorRoster) setFieldSupervisorRoster(data.fieldSupervisorRoster);
                checkLoaded();
            },
            () => { checkLoaded(); }   // doc missing or permission error — still unblock loading
        );

        return () => { unsubEmployees(); unsubTeams(); unsubConfig(); };
    }, [auth.loading, auth.user]);

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

    // ─── Config action ────────────────────────────────────────
    const saveConfig = useCallback(async (updates) => {
        return configService.save(updates);
    }, []);

    // ─── Context value ────────────────────────────────────────
    const value = {
        employees,
        users: employees,       // backward-compat alias
        teams,
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
        saveConfig,

        // Audit helper for panels that need to log non-CRUD events
        logActivity: (params) => logActivity({ adminEmail, ...params }),
        AUDIT_ACTIONS,
    };

    return <RosterContext.Provider value={value}>{children}</RosterContext.Provider>;
};
