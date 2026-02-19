import React from 'react';
import { User, Users, Truck, Phone, MessageCircle } from 'lucide-react';
import { ContactRow } from './ContactRow';
import { Badge } from '../../components/ui';
import { formatWhatsAppUrl } from '../../lib/utils';

const MobilePersonRow = ({ label, icon: Icon, person }) => (
    <div className="flex items-center gap-2 py-2 border-b border-gray-200 last:border-b-0">
        <div className="flex items-center gap-1 w-16 shrink-0 text-gray-400">
            <Icon size={12} />
            <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
        </div>
        <span className="font-bold text-sm text-gray-900 truncate flex-1 min-w-0">
            {person?.name || 'Unassigned'}
        </span>
        {person && (
            <div className="flex items-center gap-1.5 shrink-0">
                {person.whatsapp && (
                    <a href={formatWhatsAppUrl(person.whatsapp)} className="bg-green-100 border border-black p-1.5 shadow-brutal-sm">
                        <MessageCircle size={12} className="text-green-700" />
                    </a>
                )}
                {person.phone && (
                    <a href={`tel:${person.phone}`} className="bg-blue-100 border border-black p-1.5 shadow-brutal-sm">
                        <Phone size={12} className="text-blue-700" />
                    </a>
                )}
            </div>
        )}
    </div>
);

export const NeoTeamCard = ({ team, driver, supervisor, helper, isNight }) => {
    return (
        <div
            className={`bg-white border-2 md:border-4 border-black shadow-brutal md:shadow-brutal-lg p-0 flex flex-col h-full ${isNight ? 'shadow-indigo-900' : ''
                }`}
        >
            {/* Card Header */}
            <div
                className={`p-3 md:p-4 border-b-2 md:border-b-4 border-black flex justify-between items-center ${isNight ? 'bg-indigo-50' : 'bg-orange-50'
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
                <div className="bg-white border-2 border-black px-2 py-1 shadow-brutal-sm md:shadow-brutal flex-shrink-0 ml-2">
                    <div className="flex items-center space-x-1">
                        <Truck size={14} />
                        <span className="font-black font-mono text-xs md:text-sm">
                            {team.vehicle || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Mobile: Compact horizontal rows */}
            <div className="md:hidden p-2">
                <MobilePersonRow label="Driver" icon={User} person={driver} />
                <MobilePersonRow label="Super" icon={User} person={supervisor} />
                <MobilePersonRow label="Helper" icon={Users} person={helper} />
            </div>

            {/* Desktop: 3-column grid (unchanged) */}
            <div className="hidden md:grid md:grid-cols-3 md:divide-x-2 divide-black h-full">
                {/* Driver Column */}
                <div className="p-4 flex flex-col">
                    <div className="flex items-center space-x-2 mb-2 text-gray-400">
                        <User size={14} />
                        <span className="text-xs font-black uppercase tracking-wider">
                            Driver
                        </span>
                    </div>
                    <p className="font-bold text-base leading-tight mb-2 truncate">
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
                <div className="p-4 bg-gray-50 flex flex-col">
                    <div className="flex items-center space-x-2 mb-2 text-gray-400">
                        <User size={14} />
                        <span className="text-xs font-black uppercase tracking-wider">
                            Supervisor
                        </span>
                    </div>
                    <p className="font-bold text-base leading-tight mb-2 truncate">
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
                <div className="p-4 flex flex-col">
                    <div className="flex items-center space-x-2 mb-2 text-gray-400">
                        <Users size={14} />
                        <span className="text-xs font-black uppercase tracking-wider">
                            Helper
                        </span>
                    </div>
                    <p className="font-bold text-base leading-tight mb-2 truncate">
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
            <div className="p-2 md:p-3 border-t-2 md:border-t-4 border-black bg-gray-900 text-white mt-auto">
                <div className="flex items-center flex-wrap gap-1.5 md:gap-2">
                    <span className="text-red-500 font-bold uppercase text-xs mr-1">Route:</span>
                    {team.route.split(',').map((segment, idx) => (
                        <span
                            key={idx}
                            className={`inline-block bg-white text-gray-900 px-2 md:px-3 py-0.5 md:py-1 border-2 border-red-500 text-[10px] md:text-xs font-black ${idx % 2 === 0 ? '-rotate-2' : 'rotate-2'}`}
                            style={{ boxShadow: '2px 2px 0px #ef4444' }}
                        >
                            {segment.trim()}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};
