/**
 * ExportPanel.jsx — Admin Bulk CSV Export
 *
 * Accessible to ADMIN and SUPER_ADMIN only (rendered inside RosterManager).
 *
 * Features:
 *   - Checkbox list of all teams + Select All
 *   - Bulk CSV export (single file, multiple teams)
 *   - Audit log with selectedTeams array
 */
import React, { useContext, useState, useMemo } from 'react';
import { Download, Loader, CheckSquare, Square, FileText } from 'lucide-react';
import { RosterContext } from '../../context/RosterContext';
import { useAuth } from '../../hooks/useAuth';
import { exportMultiTeamCsv } from '../../utils/csvExport';
import { logActivity, AUDIT_ACTIONS } from '../../services/auditService';
import { toast } from 'sonner';

export const ExportPanel = () => {
    const { user } = useAuth();
    const { teams, employees, vehiclesMap, loading } = useContext(RosterContext);
    const [selected, setSelected] = useState(new Set());
    const [exporting, setExporting] = useState(false);

    const allSelected = teams.length > 0 && selected.size === teams.length;

    const toggleTeam = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(teams.map(t => t.id)));
        }
    };

    const selectedTeams = useMemo(
        () => teams.filter(t => selected.has(t.id)),
        [teams, selected]
    );

    const handleExport = async () => {
        if (selectedTeams.length === 0) {
            toast.error('Select at least one team');
            return;
        }
        setExporting(true);
        try {
            exportMultiTeamCsv(selectedTeams, employees, vehiclesMap || {});

            // Audit log with selectedTeams array
            logActivity({
                adminEmail: user?.email || 'unknown',
                action: AUDIT_ACTIONS.EXPORT_CSV,
                changes: {
                    selectedTeams: selectedTeams.map(t => ({ id: t.id, name: t.name })),
                    teamCount: selectedTeams.length,
                },
            });

            toast.success(`Exported ${selectedTeams.length} team(s)`);
        } catch (err) {
            console.error('[ExportPanel] Export failed:', err);
            toast.error('Export failed');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="max-w-3xl">
            <div className="bg-white border-4 border-black shadow-brutal-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-lg uppercase tracking-wide flex items-center gap-2">
                        <FileText size={20} />
                        Team CSV Export
                    </h3>
                    <span className="text-xs font-bold text-gray-400 uppercase">
                        {selected.size} / {teams.length} selected
                    </span>
                </div>

                {/* Select All */}
                <button
                    onClick={toggleAll}
                    disabled={loading}
                    className={`flex items-center gap-2 w-full border-2 border-black px-4 py-2 mb-2 font-black text-xs uppercase tracking-widest transition-colors ${loading ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                >
                    {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    Select All
                </button>

                {/* Team checkbox list */}
                <div className="border-2 border-black max-h-[400px] overflow-y-auto">
                    {loading ? (
                        /* Skeleton rows */
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                                <div className="w-4 h-4 bg-gray-200 border border-gray-300" />
                                <div className="h-3 bg-gray-200 flex-1" style={{ maxWidth: `${140 + i * 20}px` }} />
                            </div>
                        ))
                    ) : teams.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 font-bold text-sm">
                            No teams available
                        </div>
                    ) : (
                        teams.map(team => (
                            <label
                                key={team.id}
                                className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selected.has(team.id) ? 'bg-blue-50' : ''
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.has(team.id)}
                                    onChange={() => toggleTeam(team.id)}
                                    className="w-4 h-4 accent-black"
                                />
                                <span className="font-bold text-sm flex-1">{team.name || 'Unnamed Team'}</span>
                                {team.vehicleId && (
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        {vehiclesMap?.[team.vehicleId]?.number || ''}
                                    </span>
                                )}
                            </label>
                        ))
                    )}
                </div>

                {/* Export button */}
                <button
                    onClick={handleExport}
                    disabled={loading || exporting || selected.size === 0}
                    className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 font-black text-sm uppercase tracking-wider border-2 border-black shadow-brutal transition-all ${exporting || selected.size === 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:translate-y-0.5 hover:shadow-none'
                        }`}
                >
                    {exporting ? (
                        <><Loader size={16} className="animate-spin" /> Exporting...</>
                    ) : (
                        <><Download size={16} /> Export {selected.size > 0 ? `${selected.size} Team(s)` : 'CSV'}</>
                    )}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-2">
                    CSV excludes CNIC · License included only for drivers · Export is logged
                </p>
            </div>
        </div>
    );
};
