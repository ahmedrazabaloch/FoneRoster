import React, { useState, useCallback, useContext, useEffect, useRef, useMemo } from 'react';
import { Plus, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeTable } from './EmployeeTable';
import { RosterContext } from '../../context/RosterContext';
import { useWindowWidth } from '../../hooks/useWindowWidth';
import { useAdminEmployees } from '../../hooks/useAdminEmployees';
import { toast } from 'sonner';

export const DirectoryManager = () => {
    const { addEmployee, updateEmployee, deleteEmployee, restoreEmployee, toggleLeave, teams } = useContext(RosterContext);
    const [showInactive, setShowInactive] = useState(false);
    const { adminEmployees: employees, loading } = useAdminEmployees(showInactive);

    // ── Auto-generate next employee code ─────────────────────────────
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

    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const submittingRef = useRef(false);

    const windowWidth = useWindowWidth();
    const isMobile = windowWidth <= 768;

    useEffect(() => {
        if (isMobile && editingEmployee) {
            setFormOpen(true);
        }
    }, [isMobile, editingEmployee]);

    const handleSubmit = useCallback(async (data) => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        try {
            if (editingEmployee) {
                await updateEmployee(editingEmployee.id, data);
                setEditingEmployee(null);
                if (isMobile) setFormOpen(false);
            } else {
                await addEmployee(data);
                if (isMobile) setFormOpen(false);
            }
        } finally {
            submittingRef.current = false;
        }
    }, [editingEmployee, addEmployee, updateEmployee, isMobile]);

    const handleEdit = useCallback((employee) => {
        setEditingEmployee(employee);
    }, []);

    const handleDelete = useCallback(async (id, employeeId) => {
        if (submittingRef.current) return;

        // Guard: block delete if employee is assigned to any team
        const assignedTeams = teams.filter(t => {
            const a = t.assignments || {};
            return a.Driver === id || a.Supervisor === id || a.Helper === id;
        });
        if (assignedTeams.length > 0) {
            const names = assignedTeams.map(t => t.name || 'Unnamed').join(', ');
            toast.error(`Cannot delete: assigned to team(s) — ${names}. Remove from team first.`);
            return;
        }

        if (window.confirm('Are you sure? This will soft-delete the employee (recoverable).')) {
            submittingRef.current = true;
            try { await deleteEmployee(id, employeeId); }
            finally { submittingRef.current = false; }
        }
    }, [deleteEmployee, teams]);

    const handleRestore = useCallback(async (id, employeeId) => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        try {
            await restoreEmployee(id);
            toast.success(`Restored ${employeeId || 'employee'}`);
        } catch {
            toast.error('Restore failed');
        } finally {
            submittingRef.current = false;
        }
    }, [restoreEmployee]);

    const handleCancel = useCallback(() => {
        setEditingEmployee(null);
        if (isMobile) setFormOpen(false);
    }, [isMobile]);

    const toggleForm = useCallback(() => setFormOpen(o => !o), []);

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* ── FORM COLUMN ───────────────────────────────────── */}
            <div className="w-full lg:w-1/3">
                {isMobile ? (
                    <div>
                        <button
                            onClick={toggleForm}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '14px 16px',
                                background: '#fff',
                                border: '2px solid #000',
                                boxShadow: formOpen ? 'none' : '3px 3px 0 #000',
                                fontWeight: 900,
                                fontSize: 14,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                cursor: 'pointer',
                                transition: 'box-shadow 200ms ease',
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Plus
                                    size={18}
                                    style={{
                                        transition: 'transform 300ms ease',
                                        transform: formOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                                        strokeWidth: 2.5,
                                    }}
                                />
                                {editingEmployee ? 'Update Member' : 'Add New Member'}
                            </span>
                            <ChevronDown
                                size={16}
                                style={{
                                    transition: 'transform 300ms ease',
                                    transform: formOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    color: '#6b7280',
                                }}
                            />
                        </button>

                        <div style={{
                            overflow: 'hidden',
                            maxHeight: formOpen ? '2000px' : 0,
                            transition: 'max-height 320ms ease-in-out',
                            borderLeft: '2px solid #000',
                            borderRight: '2px solid #000',
                            borderBottom: formOpen ? '2px solid #000' : 'none',
                        }}>
                            <div style={{ padding: '0' }}>
                                <EmployeeForm
                                    onSubmit={handleSubmit}
                                    editingEmployee={editingEmployee}
                                    onCancel={handleCancel}
                                    nextEmployeeId={!editingEmployee ? nextEmployeeId : undefined}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <EmployeeForm
                        onSubmit={handleSubmit}
                        editingEmployee={editingEmployee}
                        onCancel={handleCancel}
                        nextEmployeeId={!editingEmployee ? nextEmployeeId : undefined}
                    />
                )}
            </div>

            {/* ── TABLE COLUMN ──────────────────────────────────── */}
            <div className="w-full lg:w-2/3">
                {/* Show Inactive Toggle */}
                <div className="flex items-center justify-end mb-2">
                    <button
                        onClick={() => setShowInactive(v => !v)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider border-2 border-black transition-all ${showInactive
                            ? 'bg-yellow-400 text-black shadow-brutal-sm'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        {showInactive ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showInactive ? 'Hide Inactive' : 'Show Inactive'}
                    </button>
                </div>

                <EmployeeTable
                    employees={employees}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRestore={showInactive ? handleRestore : null}
                    onUpdate={updateEmployee}
                    onToggleLeave={toggleLeave}
                    loading={loading}
                />
            </div>
        </div>
    );
};
