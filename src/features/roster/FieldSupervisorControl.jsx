import React, { useContext } from 'react';
import { Shield } from 'lucide-react';
import { RosterContext } from '../../context/RosterContext';
import { CollapsibleSection } from '../../components/ui/CollapsibleSection';

export const FieldSupervisorControl = () => {
    const { employees, fieldSupervisorRoster, setFieldSupervisorRoster, saveConfig } = useContext(RosterContext);

    // Dual-safe: supports roleType (post-migration) and designation (always present)
    const fieldSupervisors = employees.filter(
        e => e.roleType?.toLowerCase().trim() === 'field_supervisor' ||
            e.designation?.toLowerCase().trim() === 'field_supervisor'
    );

    const isSupervisorAssigned = (supId, shift) => {
        return (fieldSupervisorRoster[shift] || []).includes(supId);
    };

    const toggleSupervisorShift = (supId, shift) => {
        setFieldSupervisorRoster(prev => {
            const current = [...(prev[shift] || [])];
            const idx = current.indexOf(supId);
            if (idx >= 0) {
                // Remove
                current.splice(idx, 1);
            } else {
                // Add
                current.push(supId);
            }
            const updated = { ...prev, [shift]: current };

            // Persist to Firestore
            saveConfig({ fieldSupervisorRoster: updated }).catch(err =>
                console.error('Failed to save field supervisor config:', err)
            );

            return updated;
        });
    };

    return (
        <CollapsibleSection
            title="Field Supervisor Control"
            icon={Shield}
            badge={`${fieldSupervisors.length} Supervisors`}
            defaultOpen={false}
            titleClass="text-emerald-900"
        >
            {fieldSupervisors.length === 0 ? (
                <p className="text-sm font-bold text-gray-400 italic">
                    No field supervisors found. Add supervisors with designation "Field Supervisor" in the directory.
                </p>
            ) : (
                <div className="space-y-3 md:space-y-4">
                    {fieldSupervisors.map(sup => (
                        <div
                            key={sup.id}
                            className="border-2 border-black p-3 md:p-4 bg-gray-50 shadow-brutal-sm md:shadow-brutal"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                <div>
                                    <span className="font-black uppercase text-base md:text-lg text-gray-900 block">
                                        {sup.name}
                                    </span>
                                    <span className="text-xs text-gray-500 font-bold">
                                        {sup.phone}
                                    </span>
                                </div>
                                <span className="bg-emerald-600 text-white px-3 py-1 text-[10px] md:text-xs font-bold uppercase border-2 border-black shadow-brutal-sm self-start">
                                    Field Supervisor
                                </span>
                            </div>

                            {/* Day/Night availability checkboxes */}
                            <div className="flex items-center gap-4 md:gap-6">
                                <label className="flex items-center gap-2 cursor-pointer min-h-[44px] md:min-h-0">
                                    <input
                                        type="checkbox"
                                        checked={isSupervisorAssigned(sup.id, 'day')}
                                        onChange={() => toggleSupervisorShift(sup.id, 'day')}
                                        className="w-5 h-5 md:w-4 md:h-4 accent-orange-500 border-2 border-black"
                                    />
                                    <span className="text-sm font-bold uppercase">☀️ Day</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer min-h-[44px] md:min-h-0">
                                    <input
                                        type="checkbox"
                                        checked={isSupervisorAssigned(sup.id, 'night')}
                                        onChange={() => toggleSupervisorShift(sup.id, 'night')}
                                        className="w-5 h-5 md:w-4 md:h-4 accent-indigo-500 border-2 border-black"
                                    />
                                    <span className="text-sm font-bold uppercase">🌙 Night</span>
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CollapsibleSection>
    );
};
