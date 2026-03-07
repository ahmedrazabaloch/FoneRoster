/**
 * DashboardPage.jsx — Dispatch Control Center Dashboard
 *
 * This page is PERMANENTLY PUBLIC. It renders identically for:
 *   - Anonymous users (not logged in)
 *   - Team Users / Viewers
 *   - Admins
 *   - Super Admins
 *
 * Layout (Two-Zone Public Dashboard):
 *   LEFT COLUMN (Status Panel):
 *     - LiveClock
 *     - HotlinePanel
 *     - FieldSupervisorCard
 *
 *   CENTER/RIGHT COLUMN (Team Operations Board):
 *     - Shift Toggle (Day/Night)
 *     - Team Cards Grid
 *
 * AlertsPanel is NOT shown here — it only appears in AdminPage.
 *
 * ALL data is pre-sanitized by usePublicDashboardData().
 * NO raw Firestore documents, IDs, or sensitive fields reach this page.
 */
import React from 'react';
import { usePublicDashboardData } from '../hooks/usePublicDashboardData';
import { HotlinePanel } from '../components/HotlinePanel';
import { FieldSupervisorCard } from '../components/FieldSupervisorCard';
import { TeamCard } from '../components/TeamCard';
import { TeamCardSkeleton } from '../components/TeamCardSkeleton';
import { ShiftToggle } from '../components/ShiftToggle';

export const DashboardPage = () => {
    const {
        loading,
        isNightTime,
        isEffectiveNight,
        setViewMode,
        currentShiftName,
        hotlineOperator,
        fieldSupervisors,
        activeTeams,
    } = usePublicDashboardData();

    const handleShiftToggle = (mode) => {
        setViewMode(mode);
    };

    return (
        <div className="max-w-[1440px] mx-auto px-3 md:px-4 py-4 md:py-8">
            {/* Two-Zone Layout - Public Dashboard */}
            <div className="flex flex-col lg:flex-row gap-4 md:gap-8 relative items-start">
                {/* LEFT COLUMN — Status Panel (Sticky) */}
                <div className="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0 lg:sticky lg:top-[72px] space-y-4 md:space-y-6 z-10">
                    <HotlinePanel
                        currentOperator={hotlineOperator}
                        shiftName={currentShiftName}
                        onDayShift={!isNightTime}
                        loading={loading}
                    />
                    <FieldSupervisorCard supervisors={fieldSupervisors} />
                </div>

                {/* RIGHT COLUMN — Team Operations Board */}
                <div className="w-full lg:w-2/3 xl:w-3/4">
                    {/* Header with Shift Toggle */}
                    <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                        <h2 className="text-2xl md:text-5xl font-black uppercase text-gray-900 leading-none">
                            {isEffectiveNight ? 'Night Teams' : 'Day Teams'}
                        </h2>
                        <ShiftToggle
                            isEffectiveNight={isEffectiveNight}
                            onToggle={handleShiftToggle}
                        />
                    </div>

                    {/* Team Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {loading ? (
                            <>
                                <TeamCardSkeleton />
                                <TeamCardSkeleton />
                                <TeamCardSkeleton />
                                <TeamCardSkeleton />
                            </>
                        ) : activeTeams.length > 0 ? (
                            activeTeams.map(team => (
                                <TeamCard
                                    key={team.id}
                                    team={team}
                                    isNight={isEffectiveNight}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 bg-white border-4 border-black shadow-brutal">
                                <p className="text-xl font-black uppercase text-gray-400">
                                    No Teams Configured
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    {isEffectiveNight ? 'Night' : 'Day'} shift has no active teams
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
