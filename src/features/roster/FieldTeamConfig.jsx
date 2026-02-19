import React, { useContext, useState, useMemo } from 'react';
import { Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { RosterContext } from '../../context/RosterContext';
import { Button } from '../../components/ui';
import { SaveBar } from '../../components/ui/SaveBar';
import { FieldSupervisorControl } from './FieldSupervisorControl';
import { useRosterDirtyState } from '../../hooks/useRosterDirtyState';
import { toast } from 'sonner';

export const FieldTeamConfig = () => {
    const {
        teams,
        employees,
        fieldSupervisorRoster,
        addTeam: addTeamToFirestore,
        updateTeam,
        deleteTeam,
        saveConfig,
    } = useContext(RosterContext);

    const [isSaving, setIsSaving] = useState(false);

    // Collapsible state (mobile only — desktop always shows content)
    const [dayOpen, setDayOpen] = useState(false);
    const [nightOpen, setNightOpen] = useState(false);

    // Filter by designation for field team roles
    const drivers = employees.filter(e => e.designation === 'driver');
    const supervisors = employees.filter(e => e.designation === 'supervisor');
    const helpers = employees.filter(e => e.designation === 'helper');

    // Dirty state tracking
    const rosterData = useMemo(() => ({
        teams: teams.map(t => ({ id: t.id, name: t.name, vehicle: t.vehicle, route: t.route, assignments: t.assignments })),
        fieldSupervisorRoster,
    }), [teams, fieldSupervisorRoster]);

    const { isDirty, markClean } = useRosterDirtyState(rosterData);

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

    const addTeam = async (shift) => {
        const isDay = shift === 'Day';
        const count = teams.filter(t => t.shift === shift).length;
        const isBackup = isDay ? count >= 7 : count >= 3;

        const newTeam = {
            name: `${isDay ? 'Day' : 'Night'} Team ${count + 1}${isBackup ? ' (Backup)' : ''}`,
            shift: shift,
            vehicle: '',
            route: 'General Route',
            isBackup: isBackup,
            assignments: {},
        };

        try {
            await addTeamToFirestore(newTeam);
            // Auto-open the section on mobile when adding
            if (isDay) setDayOpen(true);
            else setNightOpen(true);
            toast.success('Team added successfully');
        } catch (error) {
            toast.error('Failed to add team');
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

    const toggleDay = () => {
        setDayOpen(prev => !prev);
        if (!dayOpen) setNightOpen(false);
    };

    const toggleNight = () => {
        setNightOpen(prev => !prev);
        if (!nightOpen) setDayOpen(false);
    };

    const renderTeamCard = (team) => (
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
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase w-12 shrink-0 text-gray-400">
                        Vehicle:
                    </span>
                    <input
                        type="text"
                        value={team.vehicle || ''}
                        onChange={e => updateTeamDetails(team.id, 'vehicle', e.target.value)}
                        className="font-mono text-xs md:text-sm border-b-2 border-gray-300 focus:border-black outline-none flex-1 min-w-0 bg-transparent"
                        placeholder="Vehicle No"
                    />
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

    const dayTeams = teams.filter(t => t.shift === 'Day');
    const nightTeams = teams.filter(t => t.shift === 'Night');

    return (
        <>
            {/* Field Supervisor Control — extracted dedicated section */}
            <FieldSupervisorControl />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 pb-20">
                {/* Day Shift */}
                <div className="p-0 md:p-6 bg-white border-2 border-black shadow-brutal md:shadow-brutal-lg">
                    {/* Mobile: Collapsible header */}
                    <button
                        onClick={toggleDay}
                        className="md:hidden w-full flex items-center justify-between p-3 min-h-[48px]"
                    >
                        <div className="flex items-center gap-2">
                            {dayOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            <h3 className="font-black text-base uppercase">Day Shift Configuration</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400">{dayTeams.length} teams</span>
                            <Button onClick={(e) => { e.stopPropagation(); addTeam('Day'); }} size="sm" variant="success" className="min-h-[36px] px-2">
                                <Plus size={16} />
                            </Button>
                        </div>
                    </button>

                    {/* Desktop: Always-visible header */}
                    <div className="hidden md:flex justify-between items-center mb-6">
                        <h3 className="font-black text-xl uppercase">Day Shift Configuration</h3>
                        <Button onClick={() => addTeam('Day')} size="sm" variant="success">
                            <Plus size={16} />
                            <span className="ml-1">Add Team</span>
                        </Button>
                    </div>

                    {/* Content — collapsible on mobile, always visible on desktop */}
                    <div className={`${dayOpen ? 'block' : 'hidden'} md:block p-3 md:p-0`}>
                        <div className="space-y-6 md:space-y-8">
                            {dayTeams.map(renderTeamCard)}
                        </div>
                    </div>
                </div>

                {/* Night Shift */}
                <div className="p-0 md:p-6 bg-white border-2 border-black shadow-brutal md:shadow-brutal-lg">
                    {/* Mobile: Collapsible header */}
                    <button
                        onClick={toggleNight}
                        className="md:hidden w-full flex items-center justify-between p-3 min-h-[48px]"
                    >
                        <div className="flex items-center gap-2">
                            {nightOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            <h3 className="font-black text-base uppercase text-indigo-900">Night Shift Configuration</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400">{nightTeams.length} teams</span>
                            <Button onClick={(e) => { e.stopPropagation(); addTeam('Night'); }} size="sm" className="bg-indigo-500 min-h-[36px] px-2">
                                <Plus size={16} />
                            </Button>
                        </div>
                    </button>

                    {/* Desktop: Always-visible header */}
                    <div className="hidden md:flex justify-between items-center mb-6">
                        <h3 className="font-black text-xl uppercase text-indigo-900">
                            Night Shift Configuration
                        </h3>
                        <Button onClick={() => addTeam('Night')} size="sm" className="bg-indigo-500">
                            <Plus size={16} />
                            <span className="ml-1">Add Team</span>
                        </Button>
                    </div>

                    {/* Content — collapsible on mobile, always visible on desktop */}
                    <div className={`${nightOpen ? 'block' : 'hidden'} md:block p-3 md:p-0`}>
                        <div className="space-y-6 md:space-y-8">
                            {nightTeams.map(renderTeamCard)}
                        </div>
                    </div>
                </div>
            </div>

            <SaveBar isDirty={isDirty} isSaving={isSaving} onSave={handleSave} />
        </>
    );
};
