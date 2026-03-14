import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User } from 'lucide-react';
import logoAsset from '../../assets/logo.png';
import CardFrontBg from '../../assets/card_front_bg.svg?react';
import CardBackBg from '../../assets/card_back_bg.svg?react';
import {
    ADDRESS_LINES,
    EMERGENCY_CONTACT,
    buildIdCardQrPayload,
    getCardDetails,
} from './idCardConstants';

const baseCardStyle = {
    position: 'relative',
    width: '300px',
    height: '480px',
    borderRadius: '18px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    fontFamily: 'Barlow, sans-serif',
};

const FrontSignatureBlock = () => (
    <div
        style={{
            position: 'absolute',
            right: '18px',
            bottom: '14px',
            width: '110px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}
    >
        <div
            style={{
                fontFamily: 'Dancing Script, cursive',
                fontWeight: 600,
                fontSize: '26px',
                color: '#2a2a2a',
                lineHeight: 1,
                marginBottom: '4px',
            }}
        >
            Formula One
        </div>
        <div style={{ width: '90px', borderTop: '1px solid #ccc' }} />
        <div
            style={{
                marginTop: '4px',
                fontFamily: 'Barlow, sans-serif',
                fontWeight: 400,
                fontSize: '9px',
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
            }}
        >
            Authorized By
        </div>
    </div>
);

// ─── Front Side ────────────────────────────────────────────────────

const CardFront = ({ employee, signatureUrl }) => {
    const details = getCardDetails(employee);
    const qrValue = buildIdCardQrPayload(employee);

    return (
        <div style={baseCardStyle}>
            <CardFrontBg
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    userSelect: 'none',
                }}
            />

            <div style={{ position: 'absolute', inset: 0 }}>
                <div
                    style={{
                        position: 'absolute',
                        top: '20px',
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                    }}
                >
                    <img
                        src={logoAsset}
                        alt="Formula One"
                        style={{
                            width: '150px',
                            height: '46px',
                            objectFit: 'contain',
                            margin: '0 auto',
                        }}
                    />
                </div>
                <div
                    style={{
                        position: 'absolute',
                        top: '68px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '148px',
                        height: '162px',
                        borderRadius: '9px',
                        border: '3px solid #fff',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                        overflow: 'hidden',
                        background: '#ffffff',
                    }}
                >
                    {details.photoUrl ? (
                        <img
                            src={details.photoUrl}
                            alt={details.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-[#B8B8B8] bg-white">
                            <User size={52} strokeWidth={1.5} />
                        </div>
                    )}
                </div>

                <div
                    style={{
                        position: 'absolute',
                        top: '244px',
                        width: '100%',
                        textAlign: 'center',
                        fontFamily: 'Barlow, sans-serif',
                        fontWeight: 700,
                        fontSize: '20px',
                        color: '#1a1a1a',
                        lineHeight: 1.2,
                        padding: '0 16px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                    title={details.name}
                >
                    {details.name}
                </div>

                <div
                    style={{
                        position: 'absolute',
                        top: '268px',
                        width: '100%',
                        textAlign: 'center',
                        fontFamily: 'Barlow, sans-serif',
                        fontStyle: 'italic',
                        fontWeight: 400,
                        fontSize: '13px',
                        color: '#666',
                        lineHeight: 1.2,
                        padding: '0 16px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                    title={details.designation}
                >
                    {details.designation}
                </div>

                <div
                    style={{
                        position: 'absolute',
                        top: '287px',
                        width: '100%',
                        textAlign: 'center',
                        fontFamily: 'Barlow, sans-serif',
                        fontWeight: 600,
                        fontSize: '12px',
                        color: '#444',
                        letterSpacing: '0.04em',
                        lineHeight: 1.2,
                        padding: '0 16px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                    title={`Employee ID: ${details.employeeId}`}
                >
                    {`Employee ID: ${details.employeeId}`}
                </div>

                <div
                    style={{
                        position: 'absolute',
                        top: '346px',
                        width: '100%',
                        textAlign: 'center',
                        fontFamily: 'Barlow, sans-serif',
                        fontWeight: 700,
                        fontSize: '12px',
                        color: '#fff',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                    }}
                >
                    ZONG FUEL LOGISTICS PROJECT
                </div>

                <div
                    style={{
                        position: 'absolute',
                        bottom: '14px',
                        left: '18px',
                        width: '62px',
                        height: '62px',
                        background: '#fff',
                        padding: '4px',
                        borderRadius: '4px',
                        lineHeight: 0,
                        boxSizing: 'border-box',
                    }}
                >
                    <QRCodeSVG value={qrValue} size={54} level="H" includeMargin={false} bgColor="transparent" />
                </div>

                <FrontSignatureBlock signatureUrl={signatureUrl} />
            </div>
        </div>
    );
};

// ─── Back Side ─────────────────────────────────────────────────────

const CardBack = ({ employee }) => {
    const details = getCardDetails(employee);
    const fields = [
        { label: 'Father Name', value: details.fatherName },
        { label: 'CNIC', value: details.cnic },
        { label: 'License', value: details.license },
        { label: 'Blood Group', value: details.bloodGroup },
        { label: 'Emergency Contact', value: EMERGENCY_CONTACT },
    ];

    return (
        <div style={baseCardStyle}>
            <CardBackBg
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    userSelect: 'none',
                }}
            />

            <div style={{ position: 'absolute', inset: 0 }}>
                <div
                    style={{
                        position: 'absolute',
                        top: '96px',
                        left: '22px',
                        right: '22px',
                    }}
                >
                    {fields.map((field) => (
                        <div key={field.label} style={{ marginBottom: '11px' }}>
                            <div
                                style={{
                                    fontFamily: 'Barlow, sans-serif',
                                    fontWeight: 700,
                                    fontSize: '11px',
                                    color: '#1a1a1a',
                                    lineHeight: 1.2,
                                }}
                            >
                                {field.label}:
                            </div>
                            <div
                                style={{
                                    marginTop: '1px',
                                    fontFamily: 'Barlow, sans-serif',
                                    fontWeight: 400,
                                    fontSize: '12px',
                                    color: '#333',
                                    lineHeight: 1.2,
                                    wordBreak: 'break-word',
                                }}
                            >
                                {field.value}
                            </div>
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        position: 'absolute',
                        top: '310px',
                        left: '22px',
                        right: '22px',
                        borderTop: '0.5px solid rgba(0,0,0,0.12)',
                    }}
                />

                <div
                    style={{
                        position: 'absolute',
                        top: '322px',
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '16px',
                    }}
                >
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={`stamp-${index}`}
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '999px',
                                background: 'conic-gradient(from 0deg,#e8d5ff,#d5e8ff,#d5ffd8,#ffe8d5,#ffd5e8,#d5d5ff,#e8d5ff)',
                                border: '1px solid rgba(180,180,180,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <img
                                src={logoAsset}
                                alt="Formula One"
                                style={{ width: '24px', height: '24px', objectFit: 'contain', opacity: 0.9 }}
                            />
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        position: 'absolute',
                        left: '18px',
                        right: '18px',
                        bottom: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            marginBottom: '6px',
                        }}
                    >
                        <img
                            src={logoAsset}
                            alt="Formula One"
                            style={{
                                width: '132px',
                                height: '40px',
                                objectFit: 'contain',
                            }}
                        />
                    </div>

                    <div
                        style={{
                            fontFamily: 'Barlow, sans-serif',
                            fontWeight: 400,
                            fontSize: '9.5px',
                            color: '#000',
                            lineHeight: 1.55,
                            textAlign: 'center',
                        }}
                    >
                        {ADDRESS_LINES.map((line) => (
                            <div key={line}>{line}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Combined Export ───────────────────────────────────────────────

export const EmployeeCard = ({ employee, side = 'front', signatureUrl = '' }) => {

    if (side === 'back') {
        return <CardBack employee={employee} />;
    }
    return <CardFront employee={employee} signatureUrl={signatureUrl} />;
};
