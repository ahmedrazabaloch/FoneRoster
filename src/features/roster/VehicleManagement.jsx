import React, { useContext, useState } from 'react';
import { Truck, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { RosterContext } from '../../context/RosterContext';
import { validateVehicle } from '../../lib/validators';
import { toast } from 'sonner';

const VEHICLE_TYPE_REGEX = /^[A-Za-z\s]{2,30}$/;

export const VehicleManagement = () => {
    const { vehicles, addVehicle, deleteVehicle } = useContext(RosterContext);
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState('');
    const [number, setNumber] = useState('');
    const [error, setError] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        setError('');
        const normalizedType = type.trim().toUpperCase().replace(/\s+/g, ' ');
        const normalizedNumber = number.trim().toUpperCase();

        if (!normalizedType) {
            setError('Vehicle type is required.');
            return;
        }
        if (!VEHICLE_TYPE_REGEX.test(normalizedType)) {
            setError('Vehicle type: 2-30 letters only (no numbers or special characters).');
            return;
        }
        if (!normalizedNumber) {
            setError('Vehicle number is required.');
            return;
        }
        if (!validateVehicle(normalizedNumber)) {
            setError('Invalid number format. Use: ABC-1234 or KHI-987 (max 9 chars)');
            return;
        }

        setIsAdding(true);
        try {
            await addVehicle({ type: normalizedType, number: normalizedNumber });
            setNumber('');
            setType('');
            toast.success(`Vehicle ${normalizedType} — ${normalizedNumber} added`);
        } catch (err) {
            if (err.message?.includes('already exists')) {
                setError('Vehicle number already exists.');
            } else if (err.message?.includes('type must be')) {
                setError(err.message);
            } else {
                toast.error('Failed to add vehicle');
            }
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id, display) => {
        if (window.confirm(`Delete vehicle ${display}?`)) {
            try {
                await deleteVehicle(id);
                toast.success('Vehicle removed');
            } catch {
                toast.error('Failed to remove vehicle');
            }
        }
    };

    const activeVehicles = vehicles.filter(v => v.isActive !== false);

    return (
        <div className="bg-white border-2 border-black shadow-brutal md:shadow-brutal-lg">
            <div
                onClick={() => setIsOpen(prev => !prev)}
                className="w-full flex items-center justify-between p-3 md:p-5 cursor-pointer min-h-[48px]"
            >
                <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <Truck size={18} />
                    <h3 className="font-black text-base md:text-xl uppercase">Vehicle Management</h3>
                </div>
                <span className="text-xs font-bold text-gray-400">{activeVehicles.length} vehicles</span>
            </div>

            {isOpen && (
                <div className="p-3 md:p-5 pt-0 border-t-2 border-black">
                    {/* Add Vehicle Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Type</label>
                            <input
                                type="text"
                                value={type}
                                onChange={e => setType(e.target.value)}
                                maxLength={30}
                                className="border-2 border-black p-2 font-bold text-sm uppercase min-h-[44px] bg-white"
                                placeholder="Enter Vehicle Type"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Number</label>
                            <input
                                type="text"
                                value={number}
                                onChange={e => setNumber(e.target.value.toUpperCase())}
                                maxLength={9}
                                className="border-2 border-black p-2 font-mono font-bold text-sm uppercase min-h-[44px] bg-white"
                                placeholder="ABC-1234"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">&nbsp;</label>
                            <button
                                onClick={handleAdd}
                                disabled={isAdding}
                                className="bg-black text-white font-black text-sm uppercase border-2 border-black shadow-brutal-sm active:shadow-none active:translate-x-0.5 active:translate-y-0.5 min-h-[44px] disabled:opacity-50"
                            >
                                {isAdding ? 'Adding...' : 'Add Vehicle'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-2 p-2 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold uppercase">
                            {error}
                        </div>
                    )}

                    {/* Vehicle List */}
                    {activeVehicles.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {activeVehicles.map(v => (
                                <div
                                    key={v.id}
                                    className="flex items-center justify-between p-2 md:p-3 border-2 border-black bg-gray-50 shadow-brutal-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase">
                                            {v.type}
                                        </span>
                                        <span className="font-mono font-bold text-sm">{v.number}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(v.id, `${v.type} — ${v.number}`)}
                                        className="text-red-400 hover:text-red-600 p-1.5 border border-gray-200 rounded min-w-[32px] min-h-[32px] flex items-center justify-center"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
