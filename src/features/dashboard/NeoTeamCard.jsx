import React from 'react';
import { User, Users, Truck } from 'lucide-react';
import { ContactRow } from './ContactRow';
import { Badge } from '../../components/ui';

export const NeoTeamCard = ({ team, driver, supervisor, helper, isNight }) => {
    return (
        <div
            className={`bg-white border-4 border-black shadow-brutal-lg p-0 flex flex-col h-full ${isNight ? 'shadow-indigo-900' : ''
                }`}
        >
            {/* Card Header */}
            <div
                className={`p-4 border-b-4 border-black flex justify-between items-center ${isNight ? 'bg-indigo-50' : 'bg-orange-50'
                    }`}
            >
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center">
                        Team{' '}
                        {team.isBackup && (
                            <Badge variant="danger" className="ml-2">
                                BACKUP
                            </Badge>
                        )}
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 uppercase leading-none break-words">
                        {team.name}
                    </h3>
                </div>
                <div className="bg-white border-2 border-black px-2 py-1 shadow-brutal flex-shrink-0 ml-2">
                    <div className="flex items-center space-x-1">
                        <Truck size={14} />
                        <span className="font-black font-mono text-xs md:text-sm">
                            {team.vehicle || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Personnel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black h-full">
                {/* Driver Column */}
                <div className="p-3 md:p-4 flex flex-col">
                    <div className="flex items-center space-x-2 mb-2 text-gray-400">
                        <User size={14} />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">
                            Driver
                        </span>
                    </div>
                    <p className="font-bold text-sm md:text-base leading-tight mb-2 truncate">
                        {driver?.name || 'Unassigned'}
                    </p>
                    {driver && (
                        <div className="space-y-1 mt-auto">
                            <ContactRow value={driver.whatsapp} type="wa" />
                            <ContactRow value={driver.phone} type="ph" />
                        </div>
                    )}
                </div>

                {/* Supervisor Column */}
                <div className="p-3 md:p-4 bg-gray-50 flex flex-col">
                    <div className="flex items-center space-x-2 mb-2 text-gray-400">
                        <User size={14} />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">
                            Supervisor
                        </span>
                    </div>
                    <p className="font-bold text-sm md:text-base leading-tight mb-2 truncate">
                        {supervisor?.name || 'Unassigned'}
                    </p>
                    {supervisor && (
                        <div className="space-y-1 mt-auto">
                            <ContactRow value={supervisor.whatsapp} type="wa" />
                            <ContactRow value={supervisor.phone} type="ph" />
                        </div>
                    )}
                </div>

                {/* Helper Column */}
                <div className="p-3 md:p-4 flex flex-col">
                    <div className="flex items-center space-x-2 mb-2 text-gray-400">
                        <Users size={14} />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">
                            Helper
                        </span>
                    </div>
                    <p className="font-bold text-sm md:text-base leading-tight mb-2 truncate">
                        {helper?.name || 'Unassigned'}
                    </p>
                    {helper && (
                        <div className="space-y-1 mt-auto">
                            <ContactRow value={helper.whatsapp} type="wa" />
                            <ContactRow value={helper.phone} type="ph" />
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Route */}
            <div className="p-3 border-t-4 border-black bg-gray-900 text-white mt-auto">
                <p className="text-xs font-mono">
                    <span className="text-red-500 font-bold uppercase mr-2">Route:</span>
                    {team.route}
                </p>
            </div>
        </div>
    );
};
