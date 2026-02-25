import React, { useContext } from 'react';
import { Sun, Moon, RefreshCw } from 'lucide-react';
import { RosterContext } from '../context/RosterContext';
import { useClock } from '../hooks/useClock';
import { useShiftLogic } from '../hooks/useShiftLogic';
import { HotlinePanel } from '../features/dashboard/HotlinePanel';
import { NeoTeamCard } from '../features/dashboard/NeoTeamCard';
import { FieldSupervisorCard } from '../features/dashboard/FieldSupervisorCard';
import { TeamCardSkeleton } from '../features/dashboard/TeamCardSkeleton';

export const DashboardPage = () => {
    const { currentHour } = useClock();
    const {
        employees,
        teams,
        vehicles,
        vehiclesMap,
        hotlineConfig,
        hotlineRoster,
        fieldSupervisorRoster,
        loading,
    } = useContext(RosterContext);

    const {
        isEffectiveNight,
        viewMode,
        setViewMode,
        currentShiftName,
        activeHotlineOp,
        activeFieldSupervisors,
    } = useShiftLogic(currentHour, hotlineConfig, hotlineRoster, employees, fieldSupervisorRoster);

    const activeTeams = teams.filter(t =>
        isEffectiveNight ? t.shift === 'Night' : t.shift === 'Day'
    );

    const getEmpDetails = id => employees.find(e => e.id === id);

    // Backward-compat vehicle resolver
    const resolveVehicleDisplay = (team) => {
        if (team.vehicleId && vehiclesMap[team.vehicleId]) {
            const v = vehiclesMap[team.vehicleId];
            return `${v.type} — ${v.number}`;
        }
        if (team.vehicle) {
            const match = vehicles.find(v => v.number === team.vehicle);
            if (match) return `${match.type} — ${match.number}`;
            return team.vehicle; // legacy string fallback
        }
        return 'No Vehicle';
    };

    const isNightTime = currentHour >= 20 || currentHour < 8;

    return (
        <div className="max-w-[1440px] mx-auto px-3 md:px-4 py-4 md:py-8">
            <div className="flex flex-col lg:flex-row gap-4 md:gap-8 relative items-start">
                {/* Left Column: Sticky Hotline Panel */}
                <div className="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0 lg:sticky lg:top-[72px] space-y-4 md:space-y-6 z-10">
                    <HotlinePanel
                        currentOperator={activeHotlineOp}
                        shiftName={currentShiftName}
                        onDayShift={!isNightTime}
                    />
                    <FieldSupervisorCard supervisors={activeFieldSupervisors} />
                </div>

                {/* Right Column: Scrollable Teams */}
                <div className="w-full lg:w-2/3 xl:w-3/4">
                    <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                        <h2 className="text-2xl md:text-5xl font-black uppercase text-gray-900 leading-none">
                            {isEffectiveNight ? 'Night Teams' : 'Day Teams'}
                        </h2>

                        {/* Brutalist Segmented Toggle */}
                        <div className="flex items-center gap-3">
                            <div
                                className="
                                    flex border-4 border-black rounded-none
                                    shadow-[8px_8px_0_#FFD600]
                                    active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_#FFD600]
                                    select-none
                                "
                            >
                                {/* DAY segment */}
                                <button
                                    onClick={() => setViewMode(prev => {
                                        if (prev === null) return isNightTime ? 'day' : 'day';
                                        return 'day';
                                    })}
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
                                    {!isEffectiveNight && (
                                        <span className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[8px] h-[8px] bg-[#00E676] rounded-none" />
                                    )}
                                    <Sun size={16} strokeWidth={2.5} />
                                    DAY
                                </button>

                                {/* Vertical divider */}
                                <div className="w-[4px] bg-black" />

                                {/* NIGHT segment */}
                                <button
                                    onClick={() => setViewMode(prev => {
                                        if (prev === null) return isNightTime ? 'night' : 'night';
                                        return 'night';
                                    })}
                                    className={`
                                        relative flex items-center justify-center gap-2 px-4 md:px-5 h-[48px]
                                        font-black text-[11px] md:text-xs tracking-[1.5px] uppercase
                                        border-none cursor-pointer
                                        ${isEffectiveNight
                                            ? 'bg-[#0B1B2B] text-white'
                                            : 'bg-[#3a3a3a] text-[#777]'
                                        }
                                    `}
                                >
                                    {isEffectiveNight && (
                                        <span className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[8px] h-[8px] bg-[#00E676] rounded-none" />
                                    )}
                                    <Moon size={16} strokeWidth={2.5} />
                                    NIGHT
                                </button>
                            </div>

                            {/* Reset to auto */}
                            {viewMode !== null && (
                                <button
                                    onClick={() => setViewMode(null)}
                                    className="border-2 border-black bg-white p-2 shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                                    title="Reset to auto"
                                >
                                    <RefreshCw size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Grid Layout for Cards */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                        {loading ? (
                            <>
                                {[1, 2, 3, 4].map(i => <TeamCardSkeleton key={i} />)}
                            </>
                        ) : (
                            activeTeams.map(team => {
                                const teamAssign = team.assignments || {};
                                return (
                                    <NeoTeamCard
                                        key={team.id}
                                        team={team}
                                        vehicleDisplay={resolveVehicleDisplay(team)}
                                        driver={getEmpDetails(teamAssign.Driver)}
                                        supervisor={getEmpDetails(teamAssign.Supervisor)}
                                        helper={getEmpDetails(teamAssign.Helper)}
                                        isNight={isEffectiveNight}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
