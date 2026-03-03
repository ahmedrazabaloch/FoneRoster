import { useState, useEffect } from 'react';
import { employeeService } from '../services/firebaseService';

/**
 * Hook to fetch employee records for the Admin panel.
 * Supports toggling between active-only and all (including soft-deleted).
 *
 * @param {boolean} showInactive - If true, fetch all employees; otherwise only active.
 */
export function useAdminEmployees(showInactive = false) {
    const [adminEmployees, setAdminEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const subscribeFn = showInactive
            ? employeeService.subscribeAll
            : employeeService.subscribe;

        const unsub = subscribeFn(
            (data) => {
                setAdminEmployees(data);
                setLoading(false);
            },
            (err) => {
                console.error('[useAdminEmployees] subscription error:', err);
                setLoading(false);
            }
        );
        return unsub;
    }, [showInactive]);

    return { adminEmployees, loading };
}
