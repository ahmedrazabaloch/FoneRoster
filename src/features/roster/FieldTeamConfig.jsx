import React, { useContext, useState, useMemo } from 'react';
import { Trash2, Truck, Sun, Moon, ChevronDown, ChevronRight } from 'lucide-react';
import { CollapsibleSection } from '../../components/ui/CollapsibleSection';
import { RosterContext } from '../../context/RosterContext';
import { SaveBar } from '../../components/ui/SaveBar';
import { FieldSupervisorControl } from './FieldSupervisorControl';
import { VehicleManagement } from './VehicleManagement';
import { useRosterDirtyState } from '../../hooks/useRosterDirtyState';
import { toast } from 'sonner';

const EMPTY_FORM = {
    name: '',
    vehicleId: '',
    route: '',
    driverId: '',
    supervisorId: '',
    helperId: '',
    dayShift: true,
    nightShift: false,
};

export const FieldTeamConfig = () => {
    const {
        teams,
        employees,
        vehicles,
        vehiclesMap,
        fieldSupervisorRoster,
        addTeam: addTeamToFirestore,
        updateTeam,
        deleteTeam,
        saveConfig,
    } = useContext(RosterContext);

    const [isSaving, setIsSaving] = useState(false);



    // ─── Create Team form state ───────────────────────────
    const [createForm, setCreateForm] = useState({ ...EMPTY_FORM });
    const [createError, setCreateError] = useState('');
    const [createOpen, setCreateOpen] = useState(false);

    // Active vehicles for dropdowns
    const activeVehicles = useMemo(() => vehicles.filter(v => v.isActive !== false), [vehicles]);

    // Filter by designation for field team roles
    const drivers = employees.filter(e => e.designation === 'driver');
    const supervisors = employees.filter(e => e.designation === 'supervisor');
    const helpers = employees.filter(e => e.designation === 'helper');

    // Dirty state tracking
    const rosterData = useMemo(() => ({
        teams: teams.map(t => ({ id: t.id, name: t.name, vehicleId: t.vehicleId, route: t.route, assignments: t.assignments })),
        fieldSupervisorRoster,
    }), [teams, fieldSupervisorRoster]);

    const { isDirty, markClean } = useRosterDirtyState(rosterData);

    // ─── Backward compatibility resolver ──────────────────
    const resolveVehicle = (team) => {
        if (team.vehicleId) return vehiclesMap[team.vehicleId] || null;
        // Legacy: match string vehicle number
        if (team.vehicle) return vehicles.find(v => v.number === team.vehicle) || null;
        return null;
    };

    const getVehicleDisplay = (team) => {
        const v = resolveVehicle(team);
        if (v) return `${v.type} — ${v.number}`;
        // Legacy fallback: show raw string if no match
        if (team.vehicle) return `⚠️ ${team.vehicle} (unlinked)`;
        return 'No Vehicle';
    };

    const handleAssignmentChange = async (teamId, role, empId) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return;
        const updatedAssignments = { ...(team.assignments || {}), [role]: empId || '' };
        try {
            await updateTeam(teamId, { assignments: updatedAssignments });
        } catch (error) {
            toast.error('Failed to update assignment');
        }
    };

    const updateTeamDetails = async (id, field, value) => {
        try {
            await updateTeam(id, { [field]: value });
        } catch (error) {
            toast.error('Failed to update team');
        }
    };

    // ─── Unified Create Team ─────────────────────────────
    const handleCreateTeam = async () => {
        setCreateError('');

        // Validate team name
        const teamName = createForm.name.trim();
        if (!teamName || teamName.length < 2) {
            setCreateError('Team name is required (min 2 characters).');
            return;
        }
        if (teamName.length > 20) {
            setCreateError('Team name max 20 characters.');
            return;
        }

        // Validate vehicle selection
        if (!createForm.vehicleId) {
            setCreateError('Select a vehicle.');
            return;
        }

        // Validate min 2 members
        const assignedCount = [createForm.driverId, createForm.supervisorId, createForm.helperId].filter(Boolean).length;
        if (assignedCount < 2) {
            setCreateError('Each team must have at least 2 assigned members.');
            return;
        }

        // Validate at least one shift
        if (!createForm.dayShift && !createForm.nightShift) {
            setCreateError('Select at least one shift.');
            return;
        }

        const assignments = {};
        if (createForm.driverId) assignments.Driver = createForm.driverId;
        if (createForm.supervisorId) assignments.Supervisor = createForm.supervisorId;
        if (createForm.helperId) assignments.Helper = createForm.helperId;

        const shifts = [];
        if (createForm.dayShift) shifts.push('Day');
        if (createForm.nightShift) shifts.push('Night');

        try {
            for (const shift of shifts) {
                const count = teams.filter(t => t.shift === shift).length;
                const isDay = shift === 'Day';
                const isBackup = isDay ? count >= 7 : count >= 3;

                await addTeamToFirestore({
                    name: teamName,
                    shift,
                    vehicleId: createForm.vehicleId,
                    route: createForm.route || 'General Route',
                    isBackup,
                    assignments,
                });
            }

            toast.success(`Team created for ${shifts.join(' & ')} shift${shifts.length > 1 ? 's' : ''}`);
            setCreateForm({ ...EMPTY_FORM });
            setCreateError('');
            if (shifts.includes('Day')) setDayOpen(true);
            if (shifts.includes('Night')) setNightOpen(true);
        } catch (error) {
            toast.error('Failed to create team');
        }
    };

    const removeTeam = async (id) => {
        if (window.confirm('Delete this team and its assignments?')) {
            try {
                await deleteTeam(id);
                toast.success('Team removed');
            } catch (error) {
                toast.error('Failed to remove team');
            }
        }
    };

    const handleSave = async () => {
        // Guard: each team must have at least 2 assigned members
        const underStaffed = teams.filter(t => {
            const a = t.assignments || {};
            const count = [a.Driver, a.Supervisor, a.Helper].filter(Boolean).length;
            return count < 2;
        });
        if (underStaffed.length > 0) {
            const names = underStaffed.map(t => t.name).join(', ');
            toast.error(`Each team must have at least 2 assigned members. Fix: ${names}`);
            return;
        }
        setIsSaving(true);
        try {
            await saveConfig({ fieldSupervisorRoster });
            markClean();
            toast.success('All changes saved successfully!');
        } catch (error) {
            toast.error('Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };



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

                {/* Personnel dropdowns — stacked on mobile, row on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                        className="text-xs border-2 border-black p-2 md:p-1 font-bold w-full min-h-[44px] md:min-h-0 bg-white"
                        value={team.assignments?.Driver || ''}
                        onChange={e => handleAssignmentChange(team.id, 'Driver', e.target.value)}
                    >
                        <option value="">Driver...</option>
                        {drivers.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                    <select
                        className="text-xs border-2 border-black p-2 md:p-1 font-bold w-full min-h-[44px] md:min-h-0 bg-white"
                        value={team.assignments?.Supervisor || ''}
                        onChange={e => handleAssignmentChange(team.id, 'Supervisor', e.target.value)}
                    >
                        <option value="">Supervisor...</option>
                        {supervisors.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                    <select
                        className="text-xs border-2 border-black p-2 md:p-1 font-bold w-full min-h-[44px] md:min-h-0 bg-white"
                        value={team.assignments?.Helper || ''}
                        onChange={e => handleAssignmentChange(team.id, 'Helper', e.target.value)}
                    >
                        <option value="">Helper...</option>
                        {helpers.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        );
    };

    const dayTeams = teams.filter(t => t.shift === 'Day');
    const nightTeams = teams.filter(t => t.shift === 'Night');

    return (
        <div className="space-y-4 pb-20">
            {/* Field Supervisor Control */}
            <FieldSupervisorControl />

            {/* Vehicle Management */}
            <VehicleManagement />

            {/* ─── Create Team ─────────────────────────────── */}
            <div className="bg-white border-2 border-black shadow-brutal md:shadow-brutal-lg">
                <div
                    onClick={() => setCreateOpen(prev => !prev)}
                    className="w-full flex items-center justify-between p-3 md:p-5 cursor-pointer min-h-[48px]"
                >
                    <div className="flex items-center gap-2">
                        {createOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        <Truck size={18} />
                        <h3 className="font-black text-base md:text-xl uppercase">Create Team</h3>
                    </div>
                </div>

                {createOpen && (
                    <div className="p-3 md:p-5 pt-0 border-t-2 border-black">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-3">
                            {/* Team Name */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Team Name</label>
                                <input
                                    type="text"
                                    value={createForm.name}
                                    onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                    maxLength={20}
                                    className="border-2 border-black p-2 font-bold text-sm min-h-[44px] bg-white"
                                    placeholder="e.g. Korangi, Orangi Town"
                                />
                            </div>

                            {/* Vehicle Dropdown */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Vehicle</label>
                                <select
                                    value={createForm.vehicleId}
                                    onChange={e => setCreateForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                                    className="border-2 border-black p-2 font-bold text-sm min-h-[44px] bg-white"
                                >
                                    <option value="">Select Vehicle...</option>
                                    {activeVehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.type} — {v.number}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Route */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Route</label>
                                <input
                                    type="text"
                                    value={createForm.route}
                                    onChange={e => setCreateForm(prev => ({ ...prev, route: e.target.value }))}
                                    className="border-2 border-black p-2 font-bold text-sm min-h-[44px] bg-white"
                                    placeholder="Assigned Route Area"
                                />
                            </div>

                            {/* Driver */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Driver</label>
                                <select
                                    className="border-2 border-black p-2 font-bold text-sm min-h-[44px] bg-white"
                                    value={createForm.driverId}
                                    onChange={e => setCreateForm(prev => ({ ...prev, driverId: e.target.value }))}
                                >
                                    <option value="">Select Driver...</option>
                                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            {/* Supervisor */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Supervisor</label>
                                <select
                                    className="border-2 border-black p-2 font-bold text-sm min-h-[44px] bg-white"
                                    value={createForm.supervisorId}
                                    onChange={e => setCreateForm(prev => ({ ...prev, supervisorId: e.target.value }))}
                                >
                                    <option value="">Select Supervisor...</option>
                                    {supervisors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            {/* Helper */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Helper</label>
                                <select
                                    className="border-2 border-black p-2 font-bold text-sm min-h-[44px] bg-white"
                                    value={createForm.helperId}
                                    onChange={e => setCreateForm(prev => ({ ...prev, helperId: e.target.value }))}
                                >
                                    <option value="">Select Helper...</option>
                                    {helpers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            {/* Shift Checkboxes */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Shift Assignment</label>
                                <div className="flex gap-4 items-center min-h-[44px]">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={createForm.dayShift}
                                            onChange={e => setCreateForm(prev => ({ ...prev, dayShift: e.target.checked }))}
                                            className="w-5 h-5 border-2 border-black accent-red-600"
                                        />
                                        <span className="font-black text-sm uppercase">Day</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={createForm.nightShift}
                                            onChange={e => setCreateForm(prev => ({ ...prev, nightShift: e.target.checked }))}
                                            className="w-5 h-5 border-2 border-black accent-indigo-600"
                                        />
                                        <span className="font-black text-sm uppercase">Night</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Error */}
                        {createError && (
                            <div className="mt-3 p-2 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold uppercase">
                                {createError}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleCreateTeam}
                            className="w-full mt-4 py-3 bg-black text-white font-black text-sm uppercase tracking-wide border-2 border-black shadow-brutal active:shadow-none active:translate-x-1 active:translate-y-1 min-h-[48px] flex items-center justify-center gap-2"
                        >
                            <Truck size={18} />
                            Create Team
                        </button>
                    </div>
                )}
            </div>

            {/* Day Shift */}
            <CollapsibleSection
                title="Day Shift Configuration"
                icon={Sun}
                badge={`${dayTeams.length} Teams`}
                defaultOpen={false}
            >
                <div className="space-y-6 md:space-y-8">
                    {dayTeams.length === 0 && (
                        <p className="text-sm text-gray-400 font-bold uppercase text-center py-6">No day teams yet. Use Create Team above.</p>
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
                        <p className="text-sm text-gray-400 font-bold uppercase text-center py-6">No night teams yet. Use Create Team above.</p>
                    )}
                    {nightTeams.map(renderTeamCard)}
                </div>
            </CollapsibleSection>

            <SaveBar isDirty={isDirty} isSaving={isSaving} onSave={handleSave} />
        </div>
    );
};
