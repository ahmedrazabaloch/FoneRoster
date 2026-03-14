/**
 * IdCardPreviewModal.jsx — ID Card Preview + PDF Download
 *
 * Shows front and back of the employee ID card side by side.
 * "Download PDF" button generates a vector-safe CR80 PDF via jsPDF.
 * Button is role-guarded: only ADMIN + SUPER_ADMIN can see it.
 * Fetches authority config to pass signatureUrl to the PDF generator.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, RotateCcw, Download, Loader } from 'lucide-react';
import { EmployeeCard } from './EmployeeCard';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission } from '../../utils/rbac';
import { authorityService } from '../../services/firebaseService';

export const IdCardPreviewModal = ({ employee, onClose }) => {
    const { role } = useAuth();
    const canDownloadPdf = hasPermission(role, 'employees:write');
    const [generating, setGenerating] = useState(false);
    const [authorityConfig, setAuthorityConfig] = useState(null);
    const frontCardRef = useRef(null);
    const backCardRef = useRef(null);

    // Fetch authority config for signature
    useEffect(() => {
        const unsub = authorityService.subscribe(
            (data) => setAuthorityConfig(data),
            () => setAuthorityConfig({ authorityName: '', signatureUrl: '' })
        );
        return unsub;
    }, []);

    const handleDownload = useCallback(async () => {
        if (generating) return;
        setGenerating(true);
        try {
            const { generateIdCardPdf } = await import('./generateIdCardPdf');
            await generateIdCardPdf(employee, {
                signatureUrl: authorityConfig?.signatureUrl || null,
                frontRef: frontCardRef,
                backRef: backCardRef,
            });
        } catch (err) {
            console.error('[IdCard] PDF generation failed:', err);
        } finally {
            setGenerating(false);
        }
    }, [employee, generating, authorityConfig]);

    if (!employee) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white border-4 border-black shadow-brutal-lg max-w-[1050px] w-full max-h-[95vh] overflow-y-auto p-6"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-black text-lg uppercase tracking-wide">
                            ID Card Preview
                        </h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                            {employee.name} — {employee.employeeId}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {canDownloadPdf && (
                            <button
                                onClick={handleDownload}
                                disabled={generating}
                                className={`flex items-center gap-2 px-4 py-2 font-black text-xs uppercase tracking-wide border-2 border-black shadow-brutal-sm transition-all ${generating
                                        ? 'bg-gray-200 text-gray-500 cursor-wait'
                                        : 'bg-green-500 text-white hover:translate-y-0.5 hover:shadow-none'
                                    }`}
                            >
                                {generating ? (
                                    <><Loader size={14} className="animate-spin" /> Generating...</>
                                ) : (
                                    <><Download size={14} /> Download PDF</>
                                )}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 bg-gray-100 border-2 border-black shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* ── Cards ── */}
                <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6">
                    <div className="text-center">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-2">
                            Front
                        </div>
                        <div ref={frontCardRef}>
                            <EmployeeCard
                                employee={employee}
                                side="front"
                                signatureUrl={authorityConfig?.signatureUrl || ''}
                            />
                        </div>
                    </div>
                    <div className="hidden lg:flex items-center text-gray-300">
                        <RotateCcw size={20} />
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-2">
                            Back
                        </div>
                        <div ref={backCardRef}>
                            <EmployeeCard employee={employee} side="back" />
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="mt-4 text-center">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                        CR80 · 54 × 85.6 mm · Portrait · 300 DPI · Print Ready
                    </p>
                </div>
            </div>
        </div>
    );
};
