import React, { useContext } from 'react';
import { Sun, Moon, RefreshCw } from 'lucide-react';
import { RosterContext } from '../context/RosterContext';
import { useClock } from '../hooks/useClock';
import { useShiftLogic } from '../hooks/useShiftLogic';
import { HotlinePanel } from '../features/dashboard/HotlinePanel';
import { NeoTeamCard } from '../features/dashboard/NeoTeamCard';
import { FieldSupervisorCard } from '../features/dashboard/FieldSupervisorCard';
import { Button } from '../components/ui';

export const DashboardPage = () => {
    const { currentHour } = useClock();
    const {
        employees,
        teams,
        assignments,
        hotlineConfig,
        hotlineRoster,
        fieldSupervisorRoster,
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

    const isNightTime = currentHour >= 20 || currentHour < 8;

    return (
        <div className="max-w-[1440px] mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8 relative items-start">
                {/* Left Column: Sticky Hotline Panel */}
                <div className="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0 lg:sticky lg:top-24 space-y-6 z-10">
                    <HotlinePanel
                        currentOperator={activeHotlineOp}
                        shiftName={currentShiftName}
                        onDayShift={!isNightTime}
                    />
                    <FieldSupervisorCard supervisors={activeFieldSupervisors} />
                </div>

                {/* Right Column: Scrollable Teams */}
                <div className="w-full lg:w-2/3 xl:w-3/4">
                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-3xl md:text-5xl font-black uppercase text-gray-900 leading-none">
                            {isEffectiveNight ? 'Night Zone' : 'Day Zone'}
                        </h2>

                        {/* Manual Toggle Button */}
                        <Button
                            onClick={() =>
                                setViewMode(prev => {
                                    if (prev === null) return isNightTime ? 'day' : 'night';
                                    return prev === 'day' ? 'night' : 'day';
                                })
                            }
                            variant={isEffectiveNight ? 'secondary' : 'primary'}
                            className="flex items-center space-x-2"
                        >
                            {isEffectiveNight ? <Moon size={20} /> : <Sun size={20} />}
                            <span>
                                {viewMode === null ? 'Auto: ' : 'Manual: '}
                                {isEffectiveNight ? 'Night View' : 'Day View'}
                            </span>
                            {viewMode !== null && (
                                <span
                                    onClick={e => {
                                        e.stopPropagation();
                                        setViewMode(null);
                                    }}
                                    className="ml-2 p-1 bg-black/20 rounded-full hover:bg-black/40"
                                >
                                    <RefreshCw size={12} />
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* Grid Layout for Cards */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {activeTeams.map(team => {
                            const teamAssign = assignments[team.id] || {};
                            return (
                                <NeoTeamCard
                                    key={team.id}
                                    team={team}
                                    driver={getEmpDetails(teamAssign.Driver)}
                                    supervisor={getEmpDetails(teamAssign.Supervisor)}
                                    helper={getEmpDetails(teamAssign.Helper)}
                                    isNight={isEffectiveNight}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
