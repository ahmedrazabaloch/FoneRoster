import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Tracks whether roster data has changed from its initial state.
 * Uses JSON.stringify for deep comparison.
 */
export const useRosterDirtyState = (currentData) => {
    const snapshotRef = useRef(null);
    const [isDirty, setIsDirty] = useState(false);

    // Take initial snapshot on mount
    useEffect(() => {
        if (snapshotRef.current === null) {
            snapshotRef.current = JSON.stringify(currentData);
        }
    }, []);

    // Compare on every render
    useEffect(() => {
        if (snapshotRef.current === null) return;
        const current = JSON.stringify(currentData);
        setIsDirty(current !== snapshotRef.current);
    }, [currentData]);

    const markClean = useCallback(() => {
        snapshotRef.current = JSON.stringify(currentData);
        setIsDirty(false);
    }, [currentData]);

    return { isDirty, markClean };
};
