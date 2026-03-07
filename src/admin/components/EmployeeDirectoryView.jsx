/**
 * EmployeeDirectoryView.jsx — Employee Directory Grid Only
 * 
 * Shows only the employee grid without the add/edit form.
 * Used in the Admin Panel's "View Directory" section.
 * Includes a modal for editing employees.
 */
import React, { useState, useCallback, useContext, useRef } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { EmployeeGrid } from '../../features/directory/EmployeeGrid';
import { EmployeeForm } from '../../features/directory/EmployeeForm';
import { RosterContext } from '../../context/RosterContext';
import { useAdminEmployees } from '../../hooks/useAdminEmployees';
import { toast } from 'sonner';

export const EmployeeDirectoryView = () => {
    const { updateEmployee, deleteEmployee, restoreEmployee, toggleLeave, teams } = useContext(RosterContext);
    const [showInactive, setShowInactive] = useState(false);
    const { adminEmployees: employees, loading } = useAdminEmployees(showInactive);
    const submittingRef = useRef(false);
    
    // Edit modal state
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleEdit = useCallback((employee) => {
        setEditingEmployee(employee);
        setIsEditModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setEditingEmployee(null);
        setIsEditModalOpen(false);
    }, []);

    const handleEditSubmit = useCallback(async (data) => {
        if (submittingRef.current || !editingEmployee) return;
        submittingRef.current = true;
        try {
            await updateEmployee(editingEmployee.id, data);
            toast.success('Employee updated successfully');
            handleCloseModal();
        } catch {
            toast.error('Failed to update employee');
        } finally {
            submittingRef.current = false;
        }
    }, [editingEmployee, updateEmployee, handleCloseModal]);

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

    return (
        <div className="w-full">
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

            <EmployeeGrid
                employees={employees}
                teams={teams}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRestore={showInactive ? handleRestore : null}
                onUpdate={updateEmployee}
                onToggleLeave={toggleLeave}
                loading={loading}
            />

            {/* Edit Employee Modal */}
            {isEditModalOpen && editingEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/50"
                        onClick={handleCloseModal}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-white border-4 border-black shadow-brutal max-w-3xl w-full mx-2 md:mx-4 max-h-[95vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gray-900 text-white px-3 md:px-4 py-2 md:py-3 flex items-center justify-between border-b-4 border-black z-10">
                            <h2 className="font-black text-base md:text-lg uppercase tracking-wide">
                                Edit Employee
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-1.5 hover:bg-white/10 rounded transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <div className="p-3 md:p-4">
                            <EmployeeForm
                                onSubmit={handleEditSubmit}
                                editingEmployee={editingEmployee}
                                onCancel={handleCloseModal}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
