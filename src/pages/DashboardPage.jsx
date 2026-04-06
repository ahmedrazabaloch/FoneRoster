/**
 * DashboardPage.jsx — Public Dashboard (Lock Policy Enforced)
 *
 * This page is PERMANENTLY PUBLIC.  It renders identically for:
 *   - Anonymous users (not logged in)
 *   - Team Users / Viewers
 *   - Admins
 *   - Super Admins
 *
 * ALL data is pre-sanitized by useDashboardData().
 * NO raw Firestore documents, IDs, or sensitive fields reach this page.
 */
import React from "react";
import { Sun, Moon, RefreshCw } from "lucide-react";
import { useDashboardData } from "../hooks/useDashboardData";
import { HotlinePanel } from "../features/dashboard/HotlinePanel";
import { NeoTeamCard } from "../features/dashboard/NeoTeamCard";
import { FieldSupervisorCard } from "../features/dashboard/FieldSupervisorCard";
import { TeamCardSkeleton } from "../features/dashboard/TeamCardSkeleton";

export const DashboardPage = () => {
  const {
    loading,
    currentHour,
    isNightTime,
    isEffectiveNight,
    viewMode,
    setViewMode,
    currentShiftName,
    hotlineOperator,
    fieldSupervisors,
    activeTeams,
  } = useDashboardData();

  return (
    <div className="max-w-[1440px] mx-auto px-3 md:px-4 py-4 md:py-8">
      <div className="flex flex-col lg:flex-row gap-4 md:gap-8 relative items-start">
        {/* Left Column: Sticky Hotline Panel */}
        <div className="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0 lg:sticky lg:top-[72px] space-y-4 md:space-y-6 z-10">
          <HotlinePanel
            currentOperator={hotlineOperator}
            shiftName={currentShiftName}
            onDayShift={!isNightTime}
            loading={loading}
          />
          <FieldSupervisorCard supervisors={fieldSupervisors} />
        </div>

        {/* Right Column: Scrollable Teams */}
        <div className="w-full lg:w-2/3 xl:w-3/4">
          <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <h2 className="text-2xl md:text-5xl font-black uppercase text-gray-900 leading-none">
              {isEffectiveNight ? "Night Teams" : "Day Teams"}
            </h2>

            {/* Brutalist Segmented Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex border-4 border-black rounded-none shadow-[8px_8px_0_#FFD600] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0_#FFD600] select-none">
                {/* DAY segment */}
                <button
                  onClick={() =>
                    setViewMode((prev) => {
                      if (prev === null) return isNightTime ? "day" : "day";
                      return "day";
                    })
                  }
                  className={`
                                        relative flex items-center justify-center gap-2 px-4 md:px-5 h-[48px]
                                        font-black text-[11px] md:text-xs tracking-[1.5px] uppercase
                                        border-none cursor-pointer
                                        ${
                                          !isEffectiveNight
                                            ? "bg-[#E10600] text-white"
                                            : "bg-[#3a3a3a] text-[#777]"
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
                  onClick={() =>
                    setViewMode((prev) => {
                      if (prev === null) return isNightTime ? "night" : "night";
                      return "night";
                    })
                  }
                  className={`
                                        relative flex items-center justify-center gap-2 px-4 md:px-5 h-[48px]
                                        font-black text-[11px] md:text-xs tracking-[1.5px] uppercase
                                        border-none cursor-pointer
                                        ${
                                          isEffectiveNight
                                            ? "bg-[#0B1B2B] text-white"
                                            : "bg-[#3a3a3a] text-[#777]"
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
                {[1, 2, 3, 4].map((i) => (
                  <TeamCardSkeleton key={i} />
                ))}
              </>
            ) : (
              activeTeams.map((team) => (
                <NeoTeamCard
                  key={team.id}
                  team={team}
                  vehicleDisplay={team.vehicleNumber}
                  driver={team.driver}
                  supervisor={team.supervisor}
                  helper={team.helper}
                  isNight={isEffectiveNight}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
