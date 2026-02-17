import React, { useContext } from 'react';
import { Save } from 'lucide-react';
import { RosterContext } from '../../context/RosterContext';
import { Button } from '../../components/ui';
import { toast } from 'sonner';

export const HotlineConfig = () => {
    const { employees, hotlineConfig, setHotlineConfig, hotlineRoster, setHotlineRoster } =
        useContext(RosterContext);

    const hotlineOps = employees.filter(e => e.role === 'Hotline');

    const handleHotlineAssign = (slotId, empId) => {
        setHotlineRoster(prev => ({ ...prev, [slotId]: parseInt(empId, 10) }));
    };

    const handleSave = () => {
        toast.success('Hotline roster updated successfully');
    };

    return (
        <div className="max-w-2xl bg-white border-2 border-black p-6 shadow-brutal-lg">
            <h3 className="font-black text-xl mb-4 uppercase">Hotline Shifts</h3>
            <div className="space-y-4">
                <label className="block font-bold">Shift Mode</label>
                <div className="flex space-x-2 mb-6">
                    <button
                        onClick={() => setHotlineConfig('standard')}
                        className={`flex-1 py-2 border-2 border-black font-bold uppercase ${hotlineConfig === 'standard' ? 'bg-green-300' : 'bg-white hover:bg-gray-50'
                            }`}
                    >
                        3 x 8hr (Standard)
                    </button>
                    <button
                        onClick={() => setHotlineConfig('leave')}
                        className={`flex-1 py-2 border-2 border-black font-bold uppercase ${hotlineConfig === 'leave' ? 'bg-red-300' : 'bg-white hover:bg-gray-50'
                            }`}
                    >
                        2 x 12hr (Leave)
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 border-2 border-black p-4 bg-gray-50">
                    {hotlineConfig === 'standard' ? (
                        <>
                            <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2">
                                <span className="font-bold">☀️ Morning (08:00 - 16:00)</span>
                                <select
                                    className="border-2 border-black p-1 font-bold bg-white"
                                    value={hotlineRoster.morning || ''}
                                    onChange={e => handleHotlineAssign('morning', e.target.value)}
                                >
                                    <option value="">Select Operator</option>
                                    {hotlineOps.map(op => (
                                        <option key={op.id} value={op.id}>
                                            {op.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2">
                                <span className="font-bold">🌅 Evening (16:00 - 00:00)</span>
                                <select
                                    className="border-2 border-black p-1 font-bold bg-white"
                                    value={hotlineRoster.evening || ''}
                                    onChange={e => handleHotlineAssign('evening', e.target.value)}
                                >
                                    <option value="">Select Operator</option>
                                    {hotlineOps.map(op => (
                                        <option key={op.id} value={op.id}>
                                            {op.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center justify-between pb-2">
                                <span className="font-bold">🌙 Night (00:00 - 08:00)</span>
                                <select
                                    className="border-2 border-black p-1 font-bold bg-white"
                                    value={hotlineRoster.night || ''}
                                    onChange={e => handleHotlineAssign('night', e.target.value)}
                                >
                                    <option value="">Select Operator</option>
                                    {hotlineOps.map(op => (
                                        <option key={op.id} value={op.id}>
                                            {op.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2">
                                <span className="font-bold">☀️ Day Shift (08:00 - 20:00)</span>
                                <select
                                    className="border-2 border-black p-1 font-bold bg-white"
                                    value={hotlineRoster.shift1 || ''}
                                    onChange={e => handleHotlineAssign('shift1', e.target.value)}
                                >
                                    <option value="">Select Operator</option>
                                    {hotlineOps.map(op => (
                                        <option key={op.id} value={op.id}>
                                            {op.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center justify-between pb-2">
                                <span className="font-bold">🌙 Night Shift (20:00 - 08:00)</span>
                                <select
                                    className="border-2 border-black p-1 font-bold bg-white"
                                    value={hotlineRoster.shift2 || ''}
                                    onChange={e => handleHotlineAssign('shift2', e.target.value)}
                                >
                                    <option value="">Select Operator</option>
                                    {hotlineOps.map(op => (
                                        <option key={op.id} value={op.id}>
                                            {op.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                </div>

                <Button onClick={handleSave} variant="secondary" size="lg" className="w-full mt-4">
                    <Save className="mr-2" size={18} />
                    Update Roster
                </Button>
            </div>
        </div>
    );
};
