/**
 * CreateTeamSection.jsx — Create Team Form
 * 
 * Shows only the Create Team form.
 * Used in the Admin Panel's "Teams" section.
 */
import React, { useContext, useState, useMemo } from 'react';
import { Truck } from 'lucide-react';
import { RosterContext } from '../../context/RosterContext';
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

export const CreateTeamSection = () => {
    const {
        teams,
        employees,
        vehicles,
        addTeam: addTeamToFirestore,
    } = useContext(RosterContext);

    const [createForm, setCreateForm] = useState({ ...EMPTY_FORM });
    const [createError, setCreateError] = useState('');

    // Active vehicles for dropdowns
    const activeVehicles = useMemo(() => vehicles.filter(v => v.isActive !== false), [vehicles]);

    // Filter by designation for field team roles
    const drivers = employees.filter(e => e.licenseNo);
    const supervisors = employees.filter(e => e.designation === 'supervisor' || e.licenseNo);
    const helpers = employees.filter(e => e.designation === 'helper' || e.designation === 'supervisor');

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

        // Guard: prevent same employee in all 3 roles simultaneously
        const assignedIds = [createForm.driverId, createForm.supervisorId, createForm.helperId].filter(Boolean);
        const uniqueIds = new Set(assignedIds);
        if (assignedIds.length === 3 && uniqueIds.size === 1) {
            setCreateError('Same employee cannot be assigned to all three roles.');
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
        } catch {
            toast.error('Failed to create team');
        }
    };

    return (
        <div className="bg-white border-2 border-black shadow-brutal md:shadow-brutal-lg">
            <div className="p-3 md:p-5 border-b-2 border-black bg-gray-50">
                <div className="flex items-center gap-2">
                    <Truck size={18} />
                    <h3 className="font-black text-base md:text-xl uppercase">Create New Team</h3>
                </div>
            </div>

            <div className="p-3 md:p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
                        <p className="text-[10px] text-gray-400">Includes supervisors eligible as driver</p>
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
                            <option value="">(none — optional)</option>
                            {helpers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <p className="text-[10px] text-gray-400">Includes vehicle supervisors eligible as helper</p>
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
        </div>
    );
};
