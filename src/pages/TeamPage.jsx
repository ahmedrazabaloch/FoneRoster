/**
 * TeamPage.jsx — Team User Portal
 *
 * Route: /team
 * Access: TEAM_USER and above (enforced by ProtectedRoute)
 *
 * TEAM_USER sees all teams in read-only mode and can export
 * a single team's CSV at a time.
 * Admins should use /admin → Exports tab for bulk operations.
 */
import React, { useContext, useState, useMemo } from 'react';
import { Users, Download, Loader, Truck, FileText } from 'lucide-react';
import { RosterContext } from '../context/RosterContext';
import { useAuth } from '../hooks/useAuth';
import { exportTeamCsv } from '../utils/csvExport';
import { logActivity, AUDIT_ACTIONS } from '../services/auditService';
import { toast } from 'sonner';

const DESIGNATION_LABELS = {
    driver: 'Driver',
    supervisor: 'Vehicle Supervisor',
    helper: 'Helper',
    field_supervisor: 'Field Supervisor',
    executive_officer: 'Executive Officer',
};

export const TeamPage = () => {
    const { user } = useAuth();
    const { teams, employees, vehiclesMap, loading } = useContext(RosterContext);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [exporting, setExporting] = useState(false);

    const empMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

    const selectedTeam = useMemo(
        () => teams.find(t => t.id === selectedTeamId) || null,
        [teams, selectedTeamId]
    );

    const teamMembers = useMemo(() => {
        if (!selectedTeam) return [];
        const assignments = selectedTeam.assignments || {};
        const members = [];
        if (assignments.Driver && empMap.has(assignments.Driver)) {
            members.push({ ...empMap.get(assignments.Driver), teamRole: 'Driver' });
        }
        if (assignments.Supervisor && empMap.has(assignments.Supervisor)) {
            members.push({ ...empMap.get(assignments.Supervisor), teamRole: 'Supervisor' });
        }
        if (assignments.Helper && empMap.has(assignments.Helper)) {
            members.push({ ...empMap.get(assignments.Helper), teamRole: 'Helper' });
        }
        return members;
    }, [selectedTeam, empMap]);

    const vehicleDisplay = useMemo(() => {
        if (!selectedTeam) return '';
        const v = vehiclesMap?.[selectedTeam.vehicleId];
        return v ? `${v.type} — ${v.number}` : (selectedTeam.vehicleId || 'Not assigned');
    }, [selectedTeam, vehiclesMap]);

    const handleExport = async () => {
        if (!selectedTeam) return;
        setExporting(true);
        try {
            exportTeamCsv(selectedTeam, employees, vehiclesMap || {});

            logActivity({
                adminEmail: user?.email || 'unknown',
                action: AUDIT_ACTIONS.EXPORT_CSV,
                memberId: selectedTeam.id,
                changes: {
                    selectedTeams: [{ id: selectedTeam.id, name: selectedTeam.name }],
                    teamCount: 1,
                    memberCount: teamMembers.length,
                },
            });

            toast.success(`Exported ${selectedTeam.name}`);
        } catch (err) {
            toast.error('Export failed');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-white border-4 border-black shadow-brutal-lg p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-blue-600 p-2 border-2 border-black shadow-brutal-sm">
                        <Users className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-wide">Team Portal</h2>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            View Roster & Export CSV
                        </p>
                    </div>
                </div>

                {/* Team selector */}
                <div className="mb-6">
                    <label className="block text-xs font-bold uppercase mb-1 text-gray-700">
                        Select Team
                    </label>
                    <select
                        value={selectedTeamId}
                        onChange={e => setSelectedTeamId(e.target.value)}
                        className="w-full border-2 border-black p-2 font-bold bg-gray-50 focus:outline-none focus:shadow-brutal-sm"
                        style={{ minHeight: 44 }}
                    >
                        <option value="">— Choose a team —</option>
                        {teams.map(t => (
                            <option key={t.id} value={t.id}>{t.name || 'Unnamed Team'}</option>
                        ))}
                    </select>
                </div>

                {selectedTeam ? (
                    <div className="space-y-4">
                        {/* Vehicle */}
                        <div className="flex items-center gap-2 bg-gray-100 border-2 border-black px-4 py-3">
                            <Truck size={16} className="text-gray-500 shrink-0" />
                            <span className="font-bold text-sm text-gray-700">{vehicleDisplay}</span>
                        </div>

                        {/* Members table */}
                        <div className="border-2 border-black overflow-hidden">
                            <div className="bg-gray-900 text-white px-4 py-2">
                                <span className="font-black text-xs uppercase tracking-widest">
                                    Team Members ({teamMembers.length})
                                </span>
                            </div>
                            {teamMembers.length === 0 ? (
                                <div className="p-6 text-center text-gray-400 font-bold text-sm">
                                    No members assigned
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b-2 border-black">
                                            <th className="text-left text-xs font-black uppercase px-4 py-2">Role</th>
                                            <th className="text-left text-xs font-black uppercase px-4 py-2">Name</th>
                                            <th className="text-left text-xs font-black uppercase px-4 py-2">Designation</th>
                                            <th className="text-left text-xs font-black uppercase px-4 py-2">Phone</th>
                                            <th className="text-left text-xs font-black uppercase px-4 py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teamMembers.map((m, i) => (
                                            <tr key={m.id || i} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="px-4 py-2">
                                                    <span className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase">
                                                        {m.teamRole}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 font-bold text-sm">{m.name || '—'}</td>
                                                <td className="px-4 py-2 text-xs text-gray-500 font-bold">
                                                    {DESIGNATION_LABELS[m.designation] || m.designation || '—'}
                                                </td>
                                                <td className="px-4 py-2 font-mono text-xs">{m.phone || '—'}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${m.onLeave
                                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                                                        : 'bg-green-50 text-green-700 border-green-300'
                                                        }`}>
                                                        {m.onLeave ? 'On Leave' : 'Active'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Export */}
                        <button
                            onClick={handleExport}
                            disabled={exporting || teamMembers.length === 0}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-black text-sm uppercase tracking-wider border-2 border-black shadow-brutal transition-all ${exporting || teamMembers.length === 0
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-green-500 text-white hover:translate-y-0.5 hover:shadow-none'
                                }`}
                        >
                            {exporting ? (
                                <><Loader size={16} className="animate-spin" /> Exporting...</>
                            ) : (
                                <><Download size={16} /> Export Team CSV</>
                            )}
                        </button>
                        <p className="text-[10px] text-gray-400 text-center">
                            CSV excludes CNIC · License included only for drivers · Export is logged
                        </p>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50">
                        <FileText size={32} className="text-gray-300 mx-auto mb-3" />
                        <p className="font-bold text-sm text-gray-500 uppercase">
                            Select a team to view roster and export CSV
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
