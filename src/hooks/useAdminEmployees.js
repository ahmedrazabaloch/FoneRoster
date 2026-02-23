import { useState, useEffect } from 'react';
import { employeeService } from '../services/firebaseService';

/**
 * Hook to fetch the full (private) employee records from the 'employees' collection.
 * This is meant exclusively for the Admin panel.
 * Protected by Firestore rules (requires admin/superadmin role).
 */
export function useAdminEmployees() {
    const [adminEmployees, setAdminEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = employeeService.subscribe(
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
    }, []);

    return { adminEmployees, loading };
}
