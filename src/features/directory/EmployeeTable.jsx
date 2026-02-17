import React, { useState, useMemo } from 'react';
import { Search, Edit, Trash2, User, Phone, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, Button } from '../../components/ui';

const ITEMS_PER_PAGE = 5;

export const EmployeeTable = ({ employees, onEdit, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredEmployees = useMemo(() => {
        return employees.filter(
            emp =>
                emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.id.toString().includes(searchTerm) ||
                emp.role.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees, searchTerm]);

    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
    const currentEmployees = filteredEmployees.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset to page 1 when search changes
    const handleSearch = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    return (
        <div className="bg-white border-2 border-black shadow-brutal-lg overflow-hidden flex flex-col">
            <div className="bg-gray-900 text-white p-4 border-b-2 border-black flex justify-between items-center">
                <h3 className="font-black text-xl uppercase">Employee Database</h3>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search Name, ID, Role..."
                            className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-red-500 w-48"
                            value={searchTerm}
                            onChange={e => handleSearch(e.target.value)}
                        />
                        <Search size={14} className="absolute right-2 top-1.5 text-gray-400" />
                    </div>
                    <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded">
                        Total: {filteredEmployees.length}
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto flex-grow">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b-2 border-black text-xs font-black uppercase tracking-wider">
                            <th className="p-4 border-r-2 border-black w-12">ID</th>
                            <th className="p-4 border-r-2 border-black w-16 text-center">Pic</th>
                            <th className="p-4 border-r-2 border-black">Name / Role</th>
                            <th className="p-4 border-r-2 border-black">Contact</th>
                            <th className="p-4 border-r-2 border-black">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black text-sm font-bold">
                        {currentEmployees.map(emp => (
                            <tr key={emp.id} className="hover:bg-blue-50 transition-colors">
                                <td className="p-4 border-r-2 border-black font-mono">{emp.id}</td>
                                <td className="p-4 border-r-2 border-black text-center">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-black overflow-hidden flex items-center justify-center mx-auto">
                                        {emp.photo ? (
                                            <img src={emp.photo} alt="Emp" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={20} className="text-gray-400" />
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 border-r-2 border-black">
                                    <div className="font-black uppercase">{emp.name}</div>
                                    <div className="text-[10px] text-gray-500 uppercase mb-1">
                                        S/O {emp.fatherName || '-'}
                                    </div>
                                    <Badge variant="default">{emp.role}</Badge>
                                    {emp.license && emp.license !== 'N/A' && (
                                        <div className="text-[10px] font-mono mt-1 text-gray-600">
                                            Lic: {emp.license}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 border-r-2 border-black font-mono text-xs">
                                    {emp.phone === emp.whatsapp ? (
                                        <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded border border-gray-300">
                                            <div className="flex space-x-1">
                                                <Phone size={12} className="text-blue-600" />
                                                <MessageCircle size={12} className="text-green-600" />
                                            </div>
                                            <span>{emp.phone}</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <div className="flex items-center">
                                                <Phone size={12} className="mr-1 text-blue-600" />
                                                {emp.phone}
                                            </div>
                                            <div className="flex items-center text-green-600">
                                                <MessageCircle size={12} className="mr-1" />
                                                {emp.whatsapp}
                                            </div>
                                        </div>
                                    )}
                                    <div className="text-[10px] text-gray-400 mt-1">CNIC: {emp.cnic}</div>
                                </td>
                                <td className="p-4 border-r-2 border-black">
                                    {emp.onLeave ? (
                                        <Badge variant="danger">On Leave</Badge>
                                    ) : (
                                        <Badge variant="success">Active</Badge>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => onEdit(emp)}
                                            className="p-2 bg-yellow-300 border-2 border-black shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(emp.id)}
                                            className="p-2 bg-red-500 text-white border-2 border-black shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {currentEmployees.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500 italic">
                                    No employees found matching criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="bg-gray-50 border-t-2 border-black p-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`p-2 border-2 border-black ${currentPage === 1
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-white hover:bg-gray-100 shadow-brutal-sm'
                                }`}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`p-2 border-2 border-black ${currentPage === totalPages
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-white hover:bg-gray-100 shadow-brutal-sm'
                                }`}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
