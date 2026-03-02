/**
 * EmployeeCard.jsx — CR80 ID Card Preview (Front + Back)
 *
 * Screen preview at 324×204px (landscape CR80 ratio: 85.6:53.98 ≈ 1.586:1)
 * Matches the PDF output from generateIdCardPdf.js
 *
 * Front: Company header, photo, name, designation, ID, authority signature
 * Back:  QR code, phone, license (drivers only), footer, microtext
 *
 * Data rules:
 *   - No fatherName displayed
 *   - No WhatsApp number
 *   - License field ONLY when designation === 'driver'
 *   - Diagonal "F1" watermark at low opacity
 */
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User } from 'lucide-react';

// Landscape CR80 preview ratio: 85.6mm → 430px, 53.98mm → 271px
const CARD_W = 430;
const CARD_H = 271;

const DESIGNATION_LABELS = {
    driver: 'Driver',
    supervisor: 'Vehicle Supervisor',
    helper: 'Helper',
    field_supervisor: 'Field Supervisor',
    executive_officer: 'Executive Officer',
};

// ─── Watermark Pattern ─────────────────────────────────────────────

const WatermarkPattern = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ opacity: 0.06 }}>
        <div style={{
            position: 'absolute', inset: '-50%', width: '200%', height: '200%',
            transform: 'rotate(-35deg)', transformOrigin: 'center',
        }}>
            {Array.from({ length: 15 }, (_, row) => (
                <div key={row} style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
                    {Array.from({ length: 12 }, (_, col) => (
                        <span key={col} style={{
                            fontSize: 14, fontWeight: 900, color: '#888',
                            letterSpacing: 2, whiteSpace: 'nowrap', userSelect: 'none',
                        }}>
                            F1
                        </span>
                    ))}
                </div>
            ))}
        </div>
    </div>
);

// ─── Front Side ────────────────────────────────────────────────────

const CardFront = ({ employee }) => {
    const designationLabel = DESIGNATION_LABELS[employee.designation] || employee.designation;

    return (
        <div
            className="relative bg-white border-[3px] border-black overflow-hidden flex flex-col"
            style={{ width: CARD_W, height: CARD_H }}
        >
            <WatermarkPattern />

            {/* ── Red header ── */}
            <div className="bg-[#E10600] flex items-center gap-2 px-3 py-1.5 border-b-[3px] border-black relative z-10" style={{ minHeight: 32 }}>
                <div className="bg-white border border-black flex items-center justify-center" style={{ width: 18, height: 18 }}>
                    <span className="text-[#E10600] font-black" style={{ fontSize: 7, lineHeight: 1 }}>F1</span>
                </div>
                <div>
                    <div className="text-white font-black leading-none" style={{ fontSize: 9, letterSpacing: 2 }}>FORMULA ONE</div>
                    <div className="text-red-200 font-bold" style={{ fontSize: 5, letterSpacing: 1.5 }}>TELECOM LOGISTICS</div>
                </div>
            </div>

            {/* ── Yellow accent ── */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, #E10600, #FACC15, #E10600)' }} />

            {/* ── Main content ── */}
            <div className="flex-1 flex items-center px-4 py-2 relative z-10" style={{ gap: 16 }}>
                {/* Photo */}
                <div className="border-[2px] border-black bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ width: 72, height: 88 }}
                >
                    {employee.photoUrl ? (
                        <img src={employee.photoUrl} alt={employee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <User size={28} className="text-gray-400" />
                    )}
                </div>

                {/* Details */}
                <div className="flex flex-col justify-center flex-1 min-w-0">
                    <div className="font-black uppercase tracking-wide text-gray-900 leading-tight mb-1" style={{ fontSize: 13 }}>
                        {employee.name}
                    </div>
                    <div className="bg-black text-white font-black uppercase self-start px-2 py-0.5 mb-1.5" style={{ fontSize: 6, letterSpacing: 2 }}>
                        {designationLabel}
                    </div>
                    <div className="inline-flex items-center gap-1 bg-gray-100 border border-black px-2 py-0.5 self-start">
                        <span className="font-mono font-black text-gray-700" style={{ fontSize: 8 }}>
                            {employee.employeeId || '—'}
                        </span>
                    </div>
                </div>

                {/* Signature area */}
                <div className="shrink-0 flex flex-col items-center justify-end self-end" style={{ width: 80 }}>
                    <div className="border-b border-gray-400 w-full mb-0.5" />
                    <span className="text-gray-400 font-bold uppercase" style={{ fontSize: 4, letterSpacing: 1 }}>
                        Authorized Signatory
                    </span>
                </div>
            </div>

            {/* ── Bottom bar ── */}
            <div className="bg-black relative z-10" style={{ height: 5 }} />
        </div>
    );
};

// ─── Back Side ─────────────────────────────────────────────────────

const CardBack = ({ employee, verifyUrl }) => {
    const isDriver = employee.designation === 'driver';
    const microtext = `F1RS-${employee.employeeId || 'UNKNOWN'}-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)}`;

    return (
        <div
            className="relative bg-white border-[3px] border-black overflow-hidden flex flex-col"
            style={{ width: CARD_W, height: CARD_H }}
        >
            <WatermarkPattern />

            {/* ── Dark header ── */}
            <div className="bg-gray-900 text-center border-b-[3px] border-black relative z-10" style={{ padding: '4px 0' }}>
                <span className="text-white font-black uppercase" style={{ fontSize: 6, letterSpacing: 3 }}>Verification Card</span>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 flex items-center px-4 py-2 relative z-10" style={{ gap: 16 }}>
                {/* QR Code */}
                <div className="shrink-0 flex flex-col items-center">
                    <div className="border-[2px] border-black p-1.5 bg-white" style={{ lineHeight: 0 }}>
                        <QRCodeSVG value={verifyUrl} size={80} level="H" includeMargin={false} />
                    </div>
                    <span className="text-gray-400 font-bold uppercase mt-1 text-center" style={{ fontSize: 4, letterSpacing: 1 }}>
                        Scan to verify
                    </span>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    {/* Phone */}
                    <div className="bg-gray-50 border border-black px-2 py-1.5">
                        <div className="text-gray-400 font-bold uppercase" style={{ fontSize: 4, letterSpacing: 1 }}>Phone</div>
                        <div className="font-mono font-bold text-gray-800" style={{ fontSize: 8 }}>{employee.phone || '—'}</div>
                    </div>

                    {/* License — driver only */}
                    {isDriver && employee.licenseNo && employee.licenseNo !== 'N/A' && (
                        <div className="bg-yellow-50 border border-black px-2 py-1.5">
                            <div className="text-yellow-600 font-bold uppercase" style={{ fontSize: 4, letterSpacing: 1 }}>Driving License</div>
                            <div className="font-mono font-bold text-gray-800" style={{ fontSize: 8 }}>{employee.licenseNo}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Red footer ── */}
            <div className="bg-[#E10600] text-center border-t-[3px] border-black relative z-10" style={{ padding: '3px 0' }}>
                <div className="text-white font-bold uppercase" style={{ fontSize: 5, letterSpacing: 2 }}>
                    Property of Formula One Telecom Logistics
                </div>
                <div className="text-red-200" style={{ fontSize: 4 }}>
                    If found, please return to the nearest office
                </div>
            </div>

            {/* ── Microtext ── */}
            <div className="absolute bottom-0.5 left-0 right-0 text-center z-10">
                <span className="text-gray-300 font-mono" style={{ fontSize: 3 }}>{microtext}</span>
            </div>
        </div>
    );
};

// ─── Combined Export ───────────────────────────────────────────────

export const EmployeeCard = ({ employee, side = 'front' }) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const verifyUrl = `${origin}/verify/${employee.employeeId || employee.id}`;

    if (side === 'back') {
        return <CardBack employee={employee} verifyUrl={verifyUrl} />;
    }
    return <CardFront employee={employee} />;
};
