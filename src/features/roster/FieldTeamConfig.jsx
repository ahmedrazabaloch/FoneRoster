import React, { useContext, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { RosterContext } from '../../context/RosterContext';
import { Button, Select } from '../../components/ui';
import { toast } from 'sonner';

export const FieldTeamConfig = () => {
    const {
        teams,
        setTeams,
        employees,
        assignments,
        setAssignments,
        fieldSupervisorRoster,
        setFieldSupervisorRoster,
    } = useContext(RosterContext);

    const drivers = employees.filter(e => e.role === 'Driver');
    const supervisors = employees.filter(e => e.role === 'Supervisor');
    const helpers = employees.filter(e => e.role === 'Helper');

    const handleAssignmentChange = (teamId, role, empId) => {
        setAssignments(prev => ({
            ...prev,
            [teamId]: { ...prev[teamId], [role]: parseInt(empId, 10) },
        }));
    };

    const handleFieldSupervisorAssign = (shift, index, empId) => {
        setFieldSupervisorRoster(prev => {
            const updated = [...prev[shift]];
            updated[index] = parseInt(empId, 10);
            return { ...prev, [shift]: updated };
        });
    };

    const updateTeamDetails = (id, field, value) => {
        setTeams(prev => prev.map(t => (t.id === id ? { ...t, [field]: value } : t)));
    };

    const addTeam = (shift) => {
        const isDay = shift === 'Day';
        const count = teams.filter(t => t.shift === shift).length;
        const isBackup = isDay ? count >= 7 : count >= 3;

        const newTeam = {
            id: `${shift.toLowerCase()}-${Date.now()}`,
            name: `${isDay ? 'Day' : 'Night'} Team ${count + 1}${isBackup ? ' (Backup)' : ''}`,
            shift: shift,
            vehicle: '',
            route: 'General Route',
            isBackup: isBackup,
        };

        setTeams(prev => [newTeam, ...prev]);
        toast.success('Team added successfully');
    };

    const removeTeam = (id) => {
        if (window.confirm('Delete this team and its assignments?')) {
            setTeams(prev => prev.filter(t => t.id !== id));
            setAssignments(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            toast.success('Team removed');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Day Shift */}
            <div className="p-6 bg-white border-2 border-black shadow-brutal-lg">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-xl uppercase">Day Shift Configuration</h3>
                    <Button onClick={() => addTeam('Day')} size="sm" variant="success">
                        <Plus size={16} className="mr-1" /> Add Team
                    </Button>
                </div>

                {/* Field Supervisor Config (Day) */}
                <div className="mb-6 bg-gray-50 p-4 border-2 border-black border-dashed">
                    <label className="block text-xs font-bold uppercase mb-2">
                        Shift Field Supervisors (Day)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <select
                            className="border-2 border-black p-1 text-sm font-bold"
                            value={fieldSupervisorRoster.day[0] || ''}
                            onChange={e => handleFieldSupervisorAssign('day', 0, e.target.value)}
                        >
                            <option value="">Select Supervisor 1</option>
                            {supervisors.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="border-2 border-black p-1 text-sm font-bold"
                            value={fieldSupervisorRoster.day[1] || ''}
                            onChange={e => handleFieldSupervisorAssign('day', 1, e.target.value)}
                        >
                            <option value="">Select Supervisor 2</option>
                            {supervisors.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-8">
                    {teams
                        .filter(t => t.shift === 'Day')
                        .map(team => (
                            <div
                                key={team.id}
                                className="border-b-2 border-dashed border-gray-300 pb-6 relative group"
                            >
                                <div className="flex flex-col gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase w-12 text-gray-400">
                                            Team:
                                        </span>
                                        <input
                                            type="text"
                                            value={team.name}
                                            onChange={e => updateTeamDetails(team.id, 'name', e.target.value)}
                                            className="font-bold border-b-2 border-gray-300 focus:border-black outline-none flex-1"
                                        />
                                        <button
                                            onClick={() => removeTeam(team.id)}
                                            className="text-red-400 hover:text-red-600 bg-white p-1 rounded border border-gray-200 shadow-sm"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase w-12 text-gray-400">
                                            Vehicle:
                                        </span>
                                        <input
                                            type="text"
                                            value={team.vehicle}
                                            onChange={e => updateTeamDetails(team.id, 'vehicle', e.target.value)}
                                            className="font-mono text-sm border-b-2 border-gray-300 focus:border-black outline-none flex-1"
                                            placeholder="Vehicle No"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase w-12 text-gray-400">
                                            Route:
                                        </span>
                                        <input
                                            type="text"
                                            value={team.route}
                                            onChange={e => updateTeamDetails(team.id, 'route', e.target.value)}
                                            className="text-xs border-b-2 border-gray-300 focus:border-black outline-none flex-1"
                                            placeholder="Assigned Route Area"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        className="text-xs border-2 border-black p-1 font-bold"
                                        value={assignments[team.id]?.Driver || ''}
                                        onChange={e => handleAssignmentChange(team.id, 'Driver', e.target.value)}
                                    >
                                        <option value="">Driver...</option>
                                        {drivers.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        className="text-xs border-2 border-black p-1 font-bold"
                                        value={assignments[team.id]?.Supervisor || ''}
                                        onChange={e => handleAssignmentChange(team.id, 'Supervisor', e.target.value)}
                                    >
                                        <option value="">Super...</option>
                                        {supervisors.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        className="text-xs border-2 border-black p-1 font-bold"
                                        value={assignments[team.id]?.Helper || ''}
                                        onChange={e => handleAssignmentChange(team.id, 'Helper', e.target.value)}
                                    >
                                        <option value="">Helper...</option>
                                        {helpers.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Night Shift - Similar structure */}
            <div className="p-6 bg-white border-2 border-black shadow-brutal-lg">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-xl uppercase text-indigo-900">
                        Night Shift Configuration
                    </h3>
                    <Button onClick={() => addTeam('Night')} size="sm" className="bg-indigo-500">
                        <Plus size={16} className="mr-1" /> Add Team
                    </Button>
                </div>

                {/* Field Supervisor Config (Night) */}
                <div className="mb-6 bg-gray-50 p-4 border-2 border-black border-dashed">
                    <label className="block text-xs font-bold uppercase mb-2">
                        Shift Field Supervisors (Night)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <select
                            className="border-2 border-black p-1 text-sm font-bold"
                            value={fieldSupervisorRoster.night[0] || ''}
                            onChange={e => handleFieldSupervisorAssign('night', 0, e.target.value)}
                        >
                            <option value="">Select Supervisor 1</option>
                            {supervisors.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="border-2 border-black p-1 text-sm font-bold"
                            value={fieldSupervisorRoster.night[1] || ''}
                            onChange={e => handleFieldSupervisorAssign('night', 1, e.target.value)}
                        >
                            <option value="">Select Supervisor 2</option>
                            {supervisors.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-8">
                    {teams
                        .filter(t => t.shift === 'Night')
                        .map(team => (
                            <div
                                key={team.id}
                                className="border-b-2 border-dashed border-gray-300 pb-6 relative group"
                            >
                                <div className="flex flex-col gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase w-12 text-gray-400">
                                            Team:
                                        </span>
                                        <input
                                            type="text"
                                            value={team.name}
                                            onChange={e => updateTeamDetails(team.id, 'name', e.target.value)}
                                            className="font-bold border-b-2 border-gray-300 focus:border-black outline-none flex-1"
                                        />
                                        <button
                                            onClick={() => removeTeam(team.id)}
                                            className="text-red-400 hover:text-red-600 bg-white p-1 rounded border border-gray-200 shadow-sm"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase w-12 text-gray-400">
                                            Vehicle:
                                        </span>
                                        <input
                                            type="text"
                                            value={team.vehicle}
                                            onChange={e => updateTeamDetails(team.id, 'vehicle', e.target.value)}
                                            className="font-mono text-sm border-b-2 border-gray-300 focus:border-black outline-none flex-1"
                                            placeholder="Vehicle No"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase w-12 text-gray-400">
                                            Route:
                                        </span>
                                        <input
                                            type="text"
                                            value={team.route}
                                            onChange={e => updateTeamDetails(team.id, 'route', e.target.value)}
                                            className="text-xs border-b-2 border-gray-300 focus:border-black outline-none flex-1"
                                            placeholder="Assigned Route Area"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        className="text-xs border-2 border-black p-1 font-bold"
                                        value={assignments[team.id]?.Driver || ''}
                                        onChange={e => handleAssignmentChange(team.id, 'Driver', e.target.value)}
                                    >
                                        <option value="">Driver...</option>
                                        {drivers.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        className="text-xs border-2 border-black p-1 font-bold"
                                        value={assignments[team.id]?.Supervisor || ''}
                                        onChange={e => handleAssignmentChange(team.id, 'Supervisor', e.target.value)}
                                    >
                                        <option value="">Super...</option>
                                        {supervisors.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        className="text-xs border-2 border-black p-1 font-bold"
                                        value={assignments[team.id]?.Helper || ''}
                                        onChange={e => handleAssignmentChange(team.id, 'Helper', e.target.value)}
                                    >
                                        <option value="">Helper...</option>
                                        {helpers.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};
