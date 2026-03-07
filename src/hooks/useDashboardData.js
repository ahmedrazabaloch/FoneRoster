/**
 * useDashboardData.js — Sanitized data hook for the public dashboard.
 *
 * PURPOSE:
 *   Enforces the Public Dashboard Lock Policy by stripping ALL sensitive
 *   and internal fields before data reaches any dashboard component.
 *
 * RULES:
 *   - Reads from RosterContext (which subscribes to publicEmployees)
 *   - Returns ONLY whitelisted fields: { name, phone, whatsapp }
 *   - NEVER exposes: id, employeeId, cnic, licenseNo, createdAt, updatedAt, audit metadata
 *   - Dashboard output is IDENTICAL regardless of user role (anon, viewer, admin, superadmin)
 *   - NO raw Firestore document objects leave this hook
 */
import { useContext, useMemo, useState } from 'react';
import { RosterContext } from '../context/RosterContext';
import { useClock } from './useClock';
import { getShiftName } from '../lib/utils';

// ─── Sanitizers ────────────────────────────────────────────────────

/** Strip an employee object down to ONLY public-safe contact fields */
function sanitizePerson(emp) {
    if (!emp) return null;
    return {
        name: emp.name || 'Unassigned',
        phone: emp.phone || null,
        whatsapp: emp.whatsapp || null,
    };
}

/** Strip a field supervisor to name + phone only */
function sanitizeSupervisor(emp) {
    if (!emp) return null;
    return {
        name: emp.name || 'Unassigned',
        phone: emp.phone || null,
    };
}

// ─── Hook ──────────────────────────────────────────────────────────

export function useDashboardData() {
    const {
        publicEmployees,
        teams,
        vehiclesMap,
        hotlineConfig,
        hotlineRoster,
        fieldSupervisorRoster,
        loading,
    } = useContext(RosterContext);

    // Use publicEmployees for the dashboard — always available without auth.
    // Full employees are only available to admin+ via a separate subscription.
    const employees = publicEmployees;

    const { time, currentHour } = useClock();

    // ── View mode (day/night manual override) ──────────────
    const [viewMode, setViewMode] = useState(null); // 'day' | 'night' | null (auto)
    const isNightTime = currentHour >= 20 || currentHour < 8;
    const isEffectiveNight = viewMode ? viewMode === 'night' : isNightTime;

    // ── Hotline shift name ─────────────────────────────────
    const currentShiftName = getShiftName(currentHour, hotlineConfig);

    // ── Hotline operator (sanitized) ───────────────────────
    const hotlineOperator = useMemo(() => {
        let opId;
        if (hotlineConfig === 'standard') {
            if (currentHour >= 8 && currentHour < 16) opId = hotlineRoster.morning;
            else if (currentHour >= 16 && currentHour < 24) opId = hotlineRoster.evening;
            else opId = hotlineRoster.night;
        } else {
            if (currentHour >= 8 && currentHour < 20) opId = hotlineRoster.shift1;
            else opId = hotlineRoster.shift2;
        }
        if (!opId) return null;
        const emp = employees.find(e => e.id === opId);
        return sanitizePerson(emp);
    }, [employees, currentHour, hotlineConfig, hotlineRoster]);

    // ── Field supervisors (sanitized) ──────────────────────
    const fieldSupervisors = useMemo(() => {
        const ids = isEffectiveNight
            ? fieldSupervisorRoster.night
            : fieldSupervisorRoster.day;
        return (ids || [])
            .map(id => employees.find(e => e.id === id))
            .filter(Boolean)
            .map(sanitizeSupervisor);
    }, [employees, isEffectiveNight, fieldSupervisorRoster]);

    // ── Active teams (sanitized, flat) ─────────────────────
    const activeTeams = useMemo(() => {
        const shiftTeams = teams.filter(t =>
            isEffectiveNight ? t.shift === 'Night' : t.shift === 'Day'
        );

        return shiftTeams.map(team => {
            const assign = team.assignments || {};

            // Resolve vehicle number only
            let vehicleNumber = 'No Vehicle';
            if (team.vehicleId && vehiclesMap[team.vehicleId]) {
                vehicleNumber = vehiclesMap[team.vehicleId].number;
            } else if (team.vehicle) {
                // Legacy fallback: "TYPE — NUMBER" → extract number
                const parts = team.vehicle.split(' — ');
                vehicleNumber = (parts.length > 1 ? parts[parts.length - 1] : parts[0]).trim();
            }

            return {
                id: team.id,          // Team doc ID — needed for React key only
                name: team.name,
                vehicleNumber,
                shift: team.shift,
                isBackup: team.isBackup || false,
                route: team.route || '',
                driver: sanitizePerson(employees.find(e => e.id === assign.Driver)),
                supervisor: sanitizePerson(employees.find(e => e.id === assign.Supervisor)),
                helper: sanitizePerson(employees.find(e => e.id === assign.Helper)),
            };
        });
    }, [teams, employees, vehiclesMap, isEffectiveNight]);

    return {
        loading,
        time,
        currentHour,
        isNightTime,
        isEffectiveNight,
        viewMode,
        setViewMode,
        currentShiftName,
        hotlineOperator,
        fieldSupervisors,
        activeTeams,
    };
}
