import React, { useContext, useState, useMemo } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { RosterContext } from '../../context/RosterContext';
import { Button } from '../../components/ui';
import { useRosterDirtyState } from '../../hooks/useRosterDirtyState';
import { toast } from 'sonner';

export const HotlineConfig = () => {
    const { employees, hotlineConfig, setHotlineConfig, hotlineRoster, setHotlineRoster, saveConfig } =
        useContext(RosterContext);

    const [isSaving, setIsSaving] = useState(false);

    const hotlineOps = employees.filter(e => e.roleType === 'executive');

    // Dirty state tracking
    const rosterData = useMemo(() => ({
        hotlineConfig, hotlineRoster
    }), [hotlineConfig, hotlineRoster]);

    const { isDirty, markClean } = useRosterDirtyState(rosterData);

    const handleHotlineAssign = (slotId, empId) => {
        setHotlineRoster(prev => ({ ...prev, [slotId]: empId }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveConfig({ hotlineConfig, hotlineRoster });
            markClean();
            toast.success('Hotline roster updated successfully');
        } catch (error) {
            toast.error('Failed to save. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl bg-white border-2 border-black p-3 md:p-6 shadow-brutal md:shadow-brutal-lg">
            <h3 className="font-black text-base md:text-xl mb-4 uppercase">Hotline Shifts</h3>
            <div className="space-y-4">
                <label className="block font-bold text-sm md:text-base">Shift Mode</label>
                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                    <button
                        onClick={() => setHotlineConfig('standard')}
                        className={`flex-1 py-3 md:py-2 border-2 border-black font-bold uppercase text-sm min-h-[44px] ${hotlineConfig === 'standard' ? 'bg-green-300' : 'bg-white hover:bg-gray-50'
                            }`}
                    >
                        3 × 8hr (Standard)
                    </button>
                    <button
                        onClick={() => setHotlineConfig('leave')}
                        className={`flex-1 py-3 md:py-2 border-2 border-black font-bold uppercase text-sm min-h-[44px] ${hotlineConfig === 'leave' ? 'bg-red-300' : 'bg-white hover:bg-gray-50'
                            }`}
                    >
                        2 × 12hr (Leave)
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 border-2 border-black p-3 md:p-4 bg-gray-50">
                    {hotlineConfig === 'standard' ? (
                        <>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-gray-200 pb-3">
                                <span className="font-bold text-sm">☀️ Morning (08:00 - 16:00)</span>
                                <select
                                    className="border-2 border-black p-2 md:p-1 font-bold bg-white w-full sm:w-auto min-h-[44px] md:min-h-0 text-sm"
                                    value={hotlineRoster.morning || ''}
                                    onChange={e => handleHotlineAssign('morning', e.target.value)}
                                >
                                    <option value="">Select Operator</option>
                                    {hotlineOps.map(op => (
                                        <option key={op.id} value={op.id}>{op.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-gray-200 pb-3">
                                <span className="font-bold text-sm">🌅 Evening (16:00 - 00:00)</span>
                                <select
                                    className="border-2 border-black p-2 md:p-1 font-bold bg-white w-full sm:w-auto min-h-[44px] md:min-h-0 text-sm"
                                    value={hotlineRoster.evening || ''}
                                    onChange={e => handleHotlineAssign('evening', e.target.value)}
                                >
                                    <option value="">Select Operator</option>
                                    {hotlineOps.map(op => (
                                        <option key={op.id} value={op.id}>{op.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                                <span className="font-bold text-sm">🌙 Night (00:00 - 08:00)</span>
                                <select
                                    className="border-2 border-black p-2 md:p-1 font-bold bg-white w-full sm:w-auto min-h-[44px] md:min-h-0 text-sm"
                                    value={hotlineRoster.night || ''}
                                    onChange={e => handleHotlineAssign('night', e.target.value)}
                                >
                                    <option value="">Select Operator</option>
                                    {hotlineOps.map(op => (
                                        <option key={op.id} value={op.id}>{op.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-gray-200 pb-3">
                                <span className="font-bold text-sm">☀️ Day Shift (08:00 - 20:00)</span>
                                <select
                                    className="border-2 border-black p-2 md:p-1 font-bold bg-white w-full sm:w-auto min-h-[44px] md:min-h-0 text-sm"
                                    value={hotlineRoster.shift1 || ''}
                                    onChange={e => handleHotlineAssign('shift1', e.target.value)}
                                >
                                    <option value="">Select Operator</option>
                                    {hotlineOps.map(op => (
                                        <option key={op.id} value={op.id}>{op.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                                <span className="font-bold text-sm">🌙 Night Shift (20:00 - 08:00)</span>
                                <select
                                    className="border-2 border-black p-2 md:p-1 font-bold bg-white w-full sm:w-auto min-h-[44px] md:min-h-0 text-sm"
                                    value={hotlineRoster.shift2 || ''}
                                    onChange={e => handleHotlineAssign('shift2', e.target.value)}
                                >
                                    <option value="">Select Operator</option>
                                    {hotlineOps.map(op => (
                                        <option key={op.id} value={op.id}>{op.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                </div>

                {/* Save Button — only shows when dirty */}
                {isDirty && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full mt-4 py-3 md:py-2 font-black text-sm uppercase tracking-wide border-2 border-black flex items-center justify-center gap-2 min-h-[48px] transition-all ${isSaving
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-800 shadow-brutal active:shadow-none active:translate-x-1 active:translate-y-1'
                            }`}
                    >
                        {isSaving ? (
                            <><Loader2 size={18} className="animate-spin" /> Saving...</>
                        ) : (
                            <><Save size={18} /> Save Changes</>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
