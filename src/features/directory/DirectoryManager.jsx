import React, { useState, useContext } from 'react';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeTable } from './EmployeeTable';
import { RosterContext } from '../../context/RosterContext';

export const DirectoryManager = () => {
    const { employees, addEmployee, updateEmployee, deleteEmployee } = useContext(RosterContext);
    const [editingEmployee, setEditingEmployee] = useState(null);

    const handleSubmit = async (data) => {
        if (editingEmployee) {
            await updateEmployee(editingEmployee.id, data);
            setEditingEmployee(null);
        } else {
            await addEmployee(data);
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure? This will remove them from all current duties.')) {
            await deleteEmployee(id);
        }
    };

    const handleCancel = () => {
        setEditingEmployee(null);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full lg:w-1/3">
                <EmployeeForm
                    onSubmit={handleSubmit}
                    editingEmployee={editingEmployee}
                    onCancel={handleCancel}
                />
            </div>
            <div className="w-full lg:w-2/3">
                <EmployeeTable
                    employees={employees}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
};
