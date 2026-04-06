/**
 * ShiftToggle.jsx — Day/Night Shift Toggle Switch
 *
 * Allows users to manually switch between day and night shift views.
 * Auto mode follows the current time.
 */
import React from 'react';
import { Sun, Moon } from 'lucide-react';

export const ShiftToggle = ({ isEffectiveNight, onToggle }) => {
    return (
        <div
            className="
                flex border-4 border-black rounded-none
                shadow-[8px_8px_0_#FFD600]
                active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_#FFD600]
                select-none w-fit
            "
        >
            {/* DAY segment */}
            <button
                onClick={() => onToggle('day')}
                className={`
                    relative flex items-center justify-center gap-2 px-4 md:px-5 h-[48px]
                    font-black text-[11px] md:text-xs tracking-[1.5px] uppercase
                    border-none cursor-pointer
                    ${!isEffectiveNight
                        ? 'bg-[#E10600] text-white'
                        : 'bg-[#3a3a3a] text-[#777]'
                    }
                `}
            >
                <Sun size={16} strokeWidth={2.5} />
                DAY
                {!isEffectiveNight && (
                    <span className="w-[8px] h-[8px] bg-[#00E676] rounded-none inline-block flex-shrink-0" />
                )}
            </button>

            {/* Vertical divider */}
            <div className="w-[4px] bg-black" />

            {/* NIGHT segment */}
            <button
                onClick={() => onToggle('night')}
                className={`
                    relative flex items-center justify-center gap-2 px-4 md:px-5 h-[48px]
                    font-black text-[11px] md:text-xs tracking-[1.5px] uppercase
                    border-none cursor-pointer
                    ${isEffectiveNight
                        ? 'bg-[#E10600] text-white'
                        : 'bg-[#3a3a3a] text-[#777]'
                    }
                `}
            >
                <Moon size={16} strokeWidth={2.5} />
                NIGHT
                {isEffectiveNight && (
                    <span className="w-[8px] h-[8px] bg-[#00E676] rounded-none inline-block flex-shrink-0" />
                )}
            </button>
        </div>
    );
};
