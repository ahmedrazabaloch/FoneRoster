import React from 'react';
import { UserCheck, Phone } from 'lucide-react';

export const FieldSupervisorCard = ({ supervisors }) => (
    <div className="bg-white border-4 border-black p-4 md:p-6 shadow-brutal-lg">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-black p-3 rounded-full shadow-brutal-sm">
                <UserCheck className="text-white" size={24} />
            </div>
            <div>
                <h3 className="text-xl font-black uppercase text-gray-900 leading-none">
                    Field Supervisors
                </h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                    Shift Operations Command
                </p>
            </div>
        </div>

        <div className="space-y-4">
            {supervisors && supervisors.length > 0 ? (
                supervisors.map((sup, idx) => (
                    <div
                        key={idx}
                        className="border-2 border-black p-4 bg-gray-50 shadow-brutal"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <span className="font-black uppercase text-lg text-gray-900">{sup.name}</span>
                            <span className="bg-gray-900 text-white px-3 py-1 text-xs font-bold uppercase border-2 border-black shadow-brutal-sm">
                                Supervisor {idx + 1}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 border-2 border-black p-3 shadow-brutal-sm flex-shrink-0">
                                <Phone size={20} className="text-blue-700" />
                            </div>
                            <div className={`inline-block bg-yellow-300 px-4 py-1.5 border-2 border-black shadow-brutal-sm ${idx % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}>
                                <span className="font-mono font-black text-xl text-red-600 tracking-tighter">
                                    {sup.phone}
                                </span>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <span className="text-sm font-bold text-gray-400 italic">
                    No supervisors assigned
                </span>
            )}
        </div>
    </div>
);
