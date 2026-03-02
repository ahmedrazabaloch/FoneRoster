/**
 * VerifyPage.jsx — Public Employee Verification Page
 *
 * Route: /verify/:id (PUBLIC — no auth required)
 * Fetches from publicEmployees collection only.
 *
 * DISPLAYS: Name, Designation, Employee ID, Status (Active/On Leave)
 * DOES NOT DISPLAY: CNIC, License, Phone, Blood Group, Father Name, Firestore ID
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublicEmployee } from '../services/verifyService';
import { Shield, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

const DESIGNATION_LABELS = {
    driver: 'Driver',
    supervisor: 'Vehicle Supervisor',
    helper: 'Helper',
    field_supervisor: 'Field Supervisor',
    executive_officer: 'Executive Officer',
};

export const VerifyPage = () => {
    const { id } = useParams();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setNotFound(false);

        fetchPublicEmployee(id).then(data => {
            if (cancelled) return;
            if (data) {
                setEmployee(data);
            } else {
                setNotFound(true);
            }
            setLoading(false);
        });

        return () => { cancelled = true; };
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <Loader size={32} className="animate-spin text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                        Verifying employee...
                    </p>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white border-4 border-black shadow-brutal-lg p-8 text-center">
                    <div className="bg-red-600 p-3 border-2 border-black shadow-brutal-sm inline-block mb-4">
                        <AlertTriangle className="text-white" size={28} />
                    </div>
                    <h2 className="text-2xl font-black uppercase mb-2">Not Found</h2>
                    <p className="text-sm text-gray-500 font-bold">
                        No employee record found for ID: <span className="font-mono">{id}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-3">
                        This ID card may be invalid or the employee record does not exist.
                    </p>
                </div>
            </div>
        );
    }

    const designationLabel = DESIGNATION_LABELS[employee.designation] || employee.designation;
    const isActive = !employee.onLeave;

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white border-4 border-black shadow-brutal-lg overflow-hidden">
                {/* ── Header ── */}
                <div className="bg-[#E10600] px-6 py-4 border-b-4 border-black">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 border-2 border-black">
                            <Shield size={20} className="text-[#E10600]" />
                        </div>
                        <div>
                            <div className="text-white font-black text-sm tracking-[2px] uppercase">
                                Formula One
                            </div>
                            <div className="text-red-200 text-[9px] font-bold tracking-[1.5px] uppercase">
                                Employee Verification
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Verification Badge ── */}
                <div className="px-6 py-5 border-b-2 border-black bg-green-50 flex items-center gap-3">
                    <CheckCircle size={24} className="text-green-600 shrink-0" />
                    <div>
                        <div className="font-black text-sm uppercase text-green-800">
                            Verified Employee
                        </div>
                        <div className="text-[10px] text-green-600 font-bold">
                            This person is registered with Formula One Telecom Logistics
                        </div>
                    </div>
                </div>

                {/* ── Employee Details ── */}
                <div className="px-6 py-5 space-y-4">
                    <InfoRow label="Full Name" value={employee.name} bold />
                    <InfoRow label="Designation" value={designationLabel} />
                    <InfoRow label="Employee ID" value={employee.employeeId} mono />
                    <div className="flex items-center justify-between pt-2 border-t-2 border-dashed border-gray-200">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            Status
                        </span>
                        {isActive ? (
                            <span className="bg-green-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 border-2 border-black shadow-brutal-sm">
                                Active
                            </span>
                        ) : (
                            <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 border-2 border-black shadow-brutal-sm">
                                On Leave
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="bg-gray-900 px-6 py-3 border-t-4 border-black text-center">
                    <p className="text-[9px] text-gray-400 font-bold tracking-wider uppercase">
                        For internal verification purposes only
                    </p>
                </div>
            </div>
        </div>
    );
};

const InfoRow = ({ label, value, bold, mono }) => (
    <div>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">
            {label}
        </div>
        <div className={`text-sm text-gray-900 ${bold ? 'font-black' : 'font-bold'} ${mono ? 'font-mono' : ''}`}>
            {value || '—'}
        </div>
    </div>
);
