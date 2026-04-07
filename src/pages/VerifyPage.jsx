/**
 * VerifyPage.jsx — Public Employee Verification Page
 *
 * Route: /verify/:id (PUBLIC — no auth required)
 * Fetches from publicEmployees collection only.
 *
 * DISPLAYS: Name, Designation, Employee ID, Status, Phone, Role
 * DOES NOT DISPLAY: CNIC, License, Blood Group, Father Name, Firestore ID
 *
 * SCAN LOGGING: Logs every scan to Firestore `scanLogs` collection
 * with timestamp, geolocation, and browser info.
 * 10-second duplicate prevention per employeeId.
 */
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublicEmployee } from '../services/verifyService';
import { logScan, getLocation } from '../services/scanLogService';
import {
    Shield,
    CheckCircle,
    AlertTriangle,
    Loader,
    MapPin,
    Clock,
} from 'lucide-react';
import { formatPhone } from '../utils/sanitizeInput';

const DESIGNATION_LABELS = {
    driver: 'Driver',
    supervisor: 'Vehicle Supervisor',
    helper: 'Helper',
    field_supervisor: 'Field Supervisor',
    executive_officer: 'Executive Officer',
};

const ROLE_TYPE_LABELS = {
    field_team: 'Field Team',
    hotline: 'Hotline',
    management: 'Management',
};

export const VerifyPage = () => {
    const { id } = useParams();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [location, setLocation] = useState(null);
    const [scanTime] = useState(() => new Date());
    const loggedRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setNotFound(false);

        fetchPublicEmployee(id).then(async (data) => {
            if (cancelled) return;

            if (data) {
                setEmployee(data);
            } else {
                setNotFound(true);
            }
            setLoading(false);

            // ── Log the scan (fire-and-forget, once per mount) ──
            if (!loggedRef.current) {
                loggedRef.current = true;
                logScan({
                    employeeId: id,
                    result: data ? 'verified' : 'not_found',
                });
            }

            // ── Request geolocation for display (non-blocking) ──
            try {
                const loc = await getLocation();
                if (!cancelled) setLocation(loc);
            } catch {
                // Ignore — UI continues fine without it
            }
        });

        return () => { cancelled = true; };
    }, [id]);

    // ── Loading State ──────────────────────────────────────────────
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

    // ── Not Found State ────────────────────────────────────────────
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

    // ── Verified State ─────────────────────────────────────────────
    const designationLabel = DESIGNATION_LABELS[employee.designation] || employee.designation;
    const roleLabel = ROLE_TYPE_LABELS[employee.roleType] || employee.roleType;
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

                {/* ── Employee Details Table ── */}
                <div className="px-0">
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                        <tbody>
                            <DetailRow label="Full Name" value={employee.name} bold />
                            <DetailRow label="Employee ID" value={employee.employeeId} mono />
                            <DetailRow label="Designation" value={designationLabel} />
                            {roleLabel && <DetailRow label="Role" value={roleLabel} />}
                            {employee.phone && <DetailRow label="Phone" value={formatPhone(employee.phone)} />}
                            <tr className="border-b-2 border-dashed border-gray-200">
                                <td className="py-3 px-6 text-[10px] font-black text-gray-400 uppercase tracking-wider w-[35%] bg-gray-50">
                                    Status
                                </td>
                                <td className="py-3 px-6">
                                    {isActive ? (
                                        <span className="bg-green-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 border-2 border-black shadow-brutal-sm">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 border-2 border-black shadow-brutal-sm">
                                            On Leave
                                        </span>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ── Scan Metadata ── */}
                <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        <Clock size={12} />
                        <span>Scanned: {scanTime.toLocaleString('en-PK', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                        })}</span>
                    </div>
                    {location && location.source === 'browser_gps' && (
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            <MapPin size={12} />
                            <span>
                                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                {location.accuracy && ` (±${location.accuracy.toFixed(0)}m)`}
                            </span>
                        </div>
                    )}
                    {location && location.source === 'denied' && (
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            <MapPin size={12} />
                            <span>Location access denied</span>
                        </div>
                    )}
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

// ── Table Row Component ────────────────────────────────────────────
const DetailRow = ({ label, value, bold, mono }) => (
    <tr className="border-b border-gray-100">
        <td className="py-3 px-6 text-[10px] font-black text-gray-400 uppercase tracking-wider w-[35%] bg-gray-50">
            {label}
        </td>
        <td className={`py-3 px-6 text-sm text-gray-900 ${bold ? 'font-black' : 'font-bold'} ${mono ? 'font-mono' : ''}`}>
            {value || '—'}
        </td>
    </tr>
);
