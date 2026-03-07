/**
 * AddMemberForm.jsx — Standalone Add Member Form
 * 
 * A wrapper around EmployeeForm for adding new employees.
 * Used in the Admin Panel's "Add Member" section.
 */
import React, { useContext, useMemo, useRef, useCallback } from 'react';
import { EmployeeForm } from '../../features/directory/EmployeeForm';
import { RosterContext } from '../../context/RosterContext';
import { useAdminEmployees } from '../../hooks/useAdminEmployees';

export const AddMemberForm = () => {
    const { addEmployee } = useContext(RosterContext);
    const { adminEmployees: employees } = useAdminEmployees(false);
    const submittingRef = useRef(false);

    // Auto-generate next employee code
    const nextEmployeeId = useMemo(() => {
        if (!employees || employees.length === 0) return 'EMP-001';
        const nums = employees
            .map(e => {
                const match = (e.employeeId || '').match(/\d+$/);
                return match ? parseInt(match[0], 10) : 0;
            })
            .filter(n => !isNaN(n));
        const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
        return `EMP-${String(maxNum + 1).padStart(3, '0')}`;
    }, [employees]);

    const handleSubmit = useCallback(async (data) => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        try {
            await addEmployee(data);
        } finally {
            submittingRef.current = false;
        }
    }, [addEmployee]);

    return (
        <div className="w-full max-w-3xl">
            <EmployeeForm
                onSubmit={handleSubmit}
                editingEmployee={null}
                onCancel={() => {}}
                nextEmployeeId={nextEmployeeId}
            />
        </div>
    );
};
