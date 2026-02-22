import React, { useState, useCallback, useContext, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeTable } from './EmployeeTable';
import { RosterContext } from '../../context/RosterContext';
import { useWindowWidth } from '../../hooks/useWindowWidth';

export const DirectoryManager = () => {
    const { employees, addEmployee, updateEmployee, deleteEmployee, loading } = useContext(RosterContext);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formOpen, setFormOpen] = useState(false);

    const windowWidth = useWindowWidth();
    const isMobile = windowWidth <= 768;

    // Auto-expand form on mobile when an employee is selected for editing
    useEffect(() => {
        if (isMobile && editingEmployee) {
            setFormOpen(true);
        }
    }, [isMobile, editingEmployee]);

    const handleSubmit = useCallback(async (data) => {
        if (editingEmployee) {
            await updateEmployee(editingEmployee.id, data);
            setEditingEmployee(null);
            if (isMobile) setFormOpen(false);
        } else {
            await addEmployee(data);
            if (isMobile) setFormOpen(false);
        }
    }, [editingEmployee, addEmployee, updateEmployee, isMobile]);

    const handleEdit = useCallback((employee) => {
        setEditingEmployee(employee);
    }, []);

    const handleDelete = useCallback(async (id, employeeId) => {
        if (window.confirm('Are you sure? This will remove them from all current duties.')) {
            await deleteEmployee(id, employeeId);
        }
    }, [deleteEmployee]);

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
                        {/* Collapsible toggle button */}
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
                                marginBottom: formOpen ? 0 : 0,
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

                        {/* Collapsible form body */}
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
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Desktop: always visible, unchanged */
                    <EmployeeForm
                        onSubmit={handleSubmit}
                        editingEmployee={editingEmployee}
                        onCancel={handleCancel}
                    />
                )}
            </div>

            {/* ── TABLE COLUMN ──────────────────────────────────── */}
            <div className="w-full lg:w-2/3">
                <EmployeeTable
                    employees={employees}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUpdate={updateEmployee}
                    loading={loading}
                />
            </div>
        </div>
    );
};
