import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { LiveClock } from './LiveClock';
import { formatWhatsAppUrl } from '../../lib/utils';

export const HotlinePanel = ({ currentOperator, shiftName, onDayShift }) => (
    <div className="bg-white border-2 md:border-4 border-black shadow-brutal md:shadow-brutal-xl p-4 md:p-8 flex flex-col h-fit">
        <LiveClock />
        <div className="border-t-2 md:border-t-4 border-black my-4 md:my-6"></div>
        <div className="mb-4 md:mb-6">
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Hotline No: 24/7
            </span>
            <div className="inline-block bg-yellow-300 px-4 py-1 border-2 border-black shadow-brutal-sm -rotate-1">
                <span className="block text-base md:text-xl font-black text-red-600 font-mono tracking-tighter">
                    0313-1234567
                </span>
            </div>
        </div>
        <div className="flex items-center space-x-2 mb-2">
            <Phone size={16} className="text-red-600" />
            <span className="font-black text-xs md:text-sm text-gray-500 uppercase tracking-wider">
                Current Hotline Operator
            </span>
        </div>
        <h2 className="text-2xl md:text-5xl font-black text-gray-900 uppercase leading-none mb-3 md:mb-4 break-words">
            {currentOperator?.name || 'Unassigned'}
        </h2>
        <div className="mb-4 md:mb-8">
            <span
                className={`inline-block px-4 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-black ${onDayShift ? 'bg-orange-100' : 'bg-indigo-100'
                    }`}
            >
                {shiftName}
            </span>
        </div>
        <div className="space-y-3 mb-4 md:mb-8">
            <div className="flex items-center gap-3">
                <div className="bg-green-100 border-2 border-black p-3 shadow-brutal-sm flex-shrink-0">
                    <MessageCircle size={20} className="text-green-700" />
                </div>
                <div className="inline-block bg-yellow-300 px-4 py-1.5 border-2 border-black shadow-brutal-sm -rotate-1">
                    <span className="font-mono font-black text-base md:text-xl text-red-600 tracking-tighter">
                        {currentOperator?.whatsapp || 'N/A'}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 border-2 border-black p-3 shadow-brutal-sm flex-shrink-0">
                    <Phone size={20} className="text-blue-700" />
                </div>
                <div className="inline-block bg-yellow-300 px-4 py-1.5 border-2 border-black shadow-brutal-sm rotate-1">
                    <span className="font-mono font-black text-base md:text-xl text-red-600 tracking-tighter">
                        {currentOperator?.phone || 'N/A'}
                    </span>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 mt-auto">
            <a
                href={`tel:${currentOperator?.phone}`}
                className="flex items-center justify-center bg-green-600 text-white border-2 border-black py-2.5 md:py-3 font-black uppercase text-sm shadow-brutal-sm md:shadow-brutal hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-brutal-active transition-all min-h-[44px]"
            >
                <Phone size={18} className="mr-2" /> Call
            </a>
            <a
                href={formatWhatsAppUrl(currentOperator?.whatsapp)}
                className="flex items-center justify-center bg-gray-900 text-white border-2 border-black py-2.5 md:py-3 font-black uppercase text-sm shadow-brutal-sm md:shadow-brutal hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-brutal-active transition-all min-h-[44px]"
            >
                <MessageCircle size={18} className="mr-2" /> WhatsApp
            </a>
        </div>
    </div>
);
