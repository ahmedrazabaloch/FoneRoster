import { useState, useMemo } from 'react';
import { getShiftName } from '../lib/utils';

export const useShiftLogic = (currentHour, hotlineConfig, hotlineRoster, employees, fieldSupervisorRoster) => {
    const [viewMode, setViewMode] = useState(null); // 'day' | 'night' | null (auto)

    // Real time shift detection
    const isNightTime = currentHour >= 20 || currentHour < 8;

    // Effective shift (view mode overrides time)
    const isEffectiveNight = viewMode ? viewMode === 'night' : isNightTime;

    // Get current hotline operator ID (string doc ID from Firestore)
    const currentHotlineId = useMemo(() => {
        if (hotlineConfig === 'standard') {
            if (currentHour >= 8 && currentHour < 16) return hotlineRoster.morning;
            if (currentHour >= 16 && currentHour < 24) return hotlineRoster.evening;
            return hotlineRoster.night;
        } else {
            if (currentHour >= 8 && currentHour < 20) return hotlineRoster.shift1;
            return hotlineRoster.shift2;
        }
    }, [currentHour, hotlineConfig, hotlineRoster]);

    const currentShiftName = getShiftName(currentHour, hotlineConfig);

    // Find by string doc ID (no parseInt)
    const activeHotlineOp = employees.find(e => e.id === currentHotlineId);

    // Get active field supervisors (string IDs)
    const currentFieldSupIds = isEffectiveNight ? fieldSupervisorRoster.night : fieldSupervisorRoster.day;
    const activeFieldSupervisors = (currentFieldSupIds || [])
        .map(id => employees.find(e => e.id === id))
        .filter(Boolean);

    return {
        isNightTime,
        isEffectiveNight,
        viewMode,
        setViewMode,
        currentHotlineId,
        currentShiftName,
        activeHotlineOp,
        activeFieldSupervisors,
    };
};
