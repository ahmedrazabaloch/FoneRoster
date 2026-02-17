import React from 'react';
import { Clock } from 'lucide-react';
import { useClock } from '../../hooks/useClock';

export const LiveClock = () => {
    const { time } = useClock();

    const timeString = time.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const period = time.getHours() >= 12 ? 'PM' : 'AM';

    return (
        <div className="mb-6">
            <div className="flex items-center space-x-2 text-red-600 mb-1">
                <Clock size={20} />
                <span className="font-bold text-sm tracking-wider uppercase">Live Time</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter whitespace-nowrap">
                    {timeString}
                </span>
                <span className="text-4xl md:text-5xl font-black text-gray-900">
                    {period}
                </span>
            </div>
            <div className="text-gray-500 font-medium mt-1">
                {time.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                })}
            </div>
        </div>
    );
};
