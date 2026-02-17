import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';

export const ContactRow = ({ value, type }) => {
    if (!value) return null;

    const isWhatsApp = type === 'wa';

    return (
        <div className="flex items-center gap-2 mt-2">
            <div
                className={`border-2 border-black p-2 shadow-brutal-sm flex-shrink-0 ${isWhatsApp ? 'bg-green-100' : 'bg-blue-100'
                    }`}
            >
                {isWhatsApp ? (
                    <MessageCircle size={14} className="text-green-700" />
                ) : (
                    <Phone size={14} className="text-blue-700" />
                )}
            </div>
            <div className="inline-block bg-cyan-300 px-3 py-1 border-2 border-black shadow-brutal-sm rotate-1">
                <span className="text-xs font-black font-mono text-gray-900 tracking-tight">
                    {value}
                </span>
            </div>
        </div>
    );
};
