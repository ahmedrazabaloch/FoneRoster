/**
 * FieldTeamAssignments.jsx — Field Teams Management (Field Supervisor + Shift Config)
 * 
 * Shows:
 * - Field Supervisor Control
 * - Day Shift Configuration
 * - Night Shift Configuration
 * 
 * Does NOT include:
 * - Vehicle Management (moved to Vehicles section)
 * - Create Team (moved to Teams section)
 */
import React, { useContext, useMemo, useCallback } from 'react';
import { Trash2, Sun, Moon, AlertTriangle } from 'lucide-react';
import { CollapsibleSection } from '../../components/ui/CollapsibleSection';
import { RosterContext } from '../../context/RosterContext';
import { FieldSupervisorControl } from '../../features/roster/FieldSupervisorControl';
import { toast } from 'sonner';

export const FieldTeamAssignments = () => {
    const {
        teams,
        employees,
        vehicles,
        updateTeam,
        deleteTeam,
    } = useContext(RosterContext);

    // Active vehicles for dropdowns
    const activeVehicles = useMemo(() => vehicles.filter(v => v.isActive !== false), [vehicles]);

    // Filter by designation for field team roles
    const drivers = employees.filter(e => e.licenseNo);
    const supervisors = employees.filter(e => e.designation === 'supervisor' || e.licenseNo);
    const helpers = employees.filter(e => e.designation === 'helper' || e.designation === 'supervisor');

    const handleAssignmentChange = async (teamId, role, empId) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return;
        const updatedAssignments = { ...(team.assignments || {}), [role]: empId || '' };

        // Guard: prevent same employee in all 3 roles simultaneously
        if (empId) {
            const roles = ['Driver', 'Supervisor', 'Helper'];
            const filledRoles = roles.filter(r => r !== role && updatedAssignments[r] === empId);
            if (filledRoles.length >= 2) {
                toast.error('Same employee cannot be assigned to all three roles.');
                return;
            }
        }

        try {
            await updateTeam(teamId, { assignments: updatedAssignments });
        } catch {
            toast.error('Failed to update assignment');
        }
    };

    const updateTeamDetails = async (id, field, value) => {
        try {
            await updateTeam(id, { [field]: value });
        } catch {
            toast.error('Failed to update team');
        }
    };

    const removeTeam = async (id) => {
        if (window.confirm('Delete this team and its assignments?')) {
            try {
                await deleteTeam(id);
                toast.success('Team removed');
            } catch {
                toast.error('Failed to remove team');
            }
        }
    };

    // Conflict detection helper
    const getConflicts = useCallback((empId, excludeTeamId) => {
        if (!empId) return [];
        return teams
            .filter(t => t.id !== excludeTeamId)
            .filter(t => Object.values(t.assignments || {}).includes(empId))
            .map(t => t.name || 'Unnamed');
    }, [teams]);

    const renderTeamCard = (team) => {
        const currentVehicleId = team.vehicleId || '';

        return (
            <div
                key={team.id}
                className="border-b-2 border-dashed border-gray-300 pb-4 md:pb-6 relative group"
            >
                <div className="flex flex-col gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase w-12 shrink-0 text-gray-400">
                            Team:
                        </span>
                        <input
                            type="text"
                            value={team.name}
                            onChange={e => updateTeamDetails(team.id, 'name', e.target.value)}
                            className="font-bold border-b-2 border-gray-300 focus:border-black outline-none flex-1 min-w-0 bg-transparent text-sm md:text-base"
                        />
                        <button
                            onClick={() => removeTeam(team.id)}
                            className="text-red-400 hover:text-red-600 bg-white p-1.5 rounded border border-gray-200 shadow-sm shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                    {/* Vehicle Dropdown */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase w-12 shrink-0 text-gray-400">
                            Vehicle:
                        </span>
                        <select
                            value={currentVehicleId}
                            onChange={e => updateTeamDetails(team.id, 'vehicleId', e.target.value)}
                            className="font-mono text-xs md:text-sm border-2 border-black p-1.5 font-bold flex-1 min-w-0 bg-white min-h-[36px]"
                        >
                            <option value="">Select Vehicle...</option>
                            {activeVehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.type} — {v.number}</option>
                            ))}
                            {/* Show legacy unlinked vehicle if present */}
                            {!currentVehicleId && team.vehicle && (
                                <option value="" disabled>⚠️ {team.vehicle} (unlinked)</option>
                            )}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase w-12 shrink-0 text-gray-400">
                            Route:
                        </span>
                        <input
                            type="text"
                            value={team.route || ''}
                            onChange={e => updateTeamDetails(team.id, 'route', e.target.value)}
                            className="text-xs border-b-2 border-gray-300 focus:border-black outline-none flex-1 min-w-0 bg-transparent"
                            placeholder="Assigned Route Area"
                        />
                    </div>
                </div>

                {/* Personnel dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Driver */}
                    <select
                        className={`text-xs border-2 p-2 md:p-1 font-bold w-full min-h-[44px] md:min-h-0 bg-white ${
                            getConflicts(team.assignments?.Driver, team.id).length > 0
                                ? 'border-yellow-400'
                                : 'border-black'
                        }`}
                        value={team.assignments?.Driver || ''}
                        onChange={e => handleAssignmentChange(team.id, 'Driver', e.target.value)}
                    >
                        <option value="">Driver...</option>
                        {drivers.map(d => {
                            const c = getConflicts(d.id, team.id);
                            return (
                                <option key={d.id} value={d.id}>
                                    {c.length > 0 ? `${d.name} ⚠ (${c.join(', ')})` : d.name}
                                </option>
                            );
                        })}
                    </select>

                    {/* Supervisor */}
                    <select
                        className={`text-xs border-2 p-2 md:p-1 font-bold w-full min-h-[44px] md:min-h-0 bg-white ${
                            getConflicts(team.assignments?.Supervisor, team.id).length > 0
                                ? 'border-yellow-400'
                                : 'border-black'
                        }`}
                        value={team.assignments?.Supervisor || ''}
                        onChange={e => handleAssignmentChange(team.id, 'Supervisor', e.target.value)}
                    >
                        <option value="">Supervisor...</option>
                        {supervisors.map(d => {
                            const c = getConflicts(d.id, team.id);
                            return (
                                <option key={d.id} value={d.id}>
                                    {c.length > 0 ? `${d.name} ⚠ (${c.join(', ')})` : d.name}
                                </option>
                            );
                        })}
                    </select>

                    {/* Helper */}
                    <select
                        className={`text-xs border-2 p-2 md:p-1 font-bold w-full min-h-[44px] md:min-h-0 bg-white ${
                            getConflicts(team.assignments?.Helper, team.id).length > 0
                                ? 'border-yellow-400'
                                : 'border-black'
                        }`}
                        value={team.assignments?.Helper || ''}
                        onChange={e => handleAssignmentChange(team.id, 'Helper', e.target.value)}
                    >
                        <option value="">(none)</option>
                        {helpers.map(d => {
                            const c = getConflicts(d.id, team.id);
                            return (
                                <option key={d.id} value={d.id}>
                                    {c.length > 0 ? `${d.name} ⚠ (${c.join(', ')})` : d.name}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* Conflict warning strip */}
                {(() => {
                    const a = team.assignments || {};
                    const warns = [
                        { role: 'Driver', id: a.Driver },
                        { role: 'Supervisor', id: a.Supervisor },
                        { role: 'Helper', id: a.Helper },
                    ]
                        .map(({ role, id }) => ({ role, conflicts: getConflicts(id, team.id) }))
                        .filter(w => w.conflicts.length > 0);

                    if (warns.length === 0) return null;
                    return (
                        <div className="mt-2 p-2 bg-yellow-50 border-2 border-yellow-400 flex items-start gap-2">
                            <AlertTriangle size={14} className="text-yellow-600 shrink-0 mt-0.5" />
                            <div className="text-[10px] font-bold text-yellow-800 uppercase tracking-wide leading-snug">
                                {warns.map(w => (
                                    <div key={w.role}>
                                        {w.role}: also assigned to {w.conflicts.join(', ')}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </div>
        );
    };

    const dayTeams = teams.filter(t => t.shift === 'Day');
    const nightTeams = teams.filter(t => t.shift === 'Night');

    return (
        <div className="space-y-4">
            {/* Field Supervisor Control */}
            <FieldSupervisorControl />

            {/* Day Shift */}
            <CollapsibleSection
                title="Day Shift Configuration"
                icon={Sun}
                badge={`${dayTeams.length} Teams`}
                defaultOpen={false}
            >
                <div className="space-y-6 md:space-y-8">
                    {dayTeams.length === 0 && (
                        <p className="text-sm text-gray-400 font-bold uppercase text-center py-6">
                            No day teams yet. Create teams in the Teams section.
                        </p>
                    )}
                    {dayTeams.map(renderTeamCard)}
                </div>
            </CollapsibleSection>

            {/* Night Shift */}
            <CollapsibleSection
                title="Night Shift Configuration"
                icon={Moon}
                badge={`${nightTeams.length} Teams`}
                defaultOpen={false}
                titleClass="text-indigo-900"
            >
                <div className="space-y-6 md:space-y-8">
                    {nightTeams.length === 0 && (
                        <p className="text-sm text-gray-400 font-bold uppercase text-center py-6">
                            No night teams yet. Create teams in the Teams section.
                        </p>
                    )}
                    {nightTeams.map(renderTeamCard)}
                </div>
            </CollapsibleSection>
        </div>
    );
};
