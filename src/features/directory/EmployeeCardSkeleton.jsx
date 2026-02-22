import React from 'react';

/**
 * Shimmer skeleton placeholder for EmployeeCardMobile.
 * Shown while Firebase data is loading on mobile.
 */
export const EmployeeCardSkeleton = () => (
    <div style={s.card}>
        <style>{`
            @keyframes shimmer {
                0%   { background-position: -400px 0; }
                100% { background-position: 400px 0; }
            }
        `}</style>

        {/* Top row */}
        <div style={s.topRow}>
            <div style={{ ...s.shimmer, width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ ...s.shimmer, height: 14, width: '65%', borderRadius: 2 }} />
                <div style={{ ...s.shimmer, height: 11, width: '40%', borderRadius: 2 }} />
            </div>
            <div style={{ ...s.shimmer, height: 20, width: 52, borderRadius: 999 }} />
        </div>

        {/* Middle rows */}
        <div style={s.middle}>
            {[100, 130, 120].map((w, i) => (
                <div key={i} style={s.infoRow}>
                    <div style={{ ...s.shimmer, height: 11, width: 36, borderRadius: 2 }} />
                    <div style={{ ...s.shimmer, height: 11, width: w, borderRadius: 2, marginLeft: 8 }} />
                </div>
            ))}
        </div>

        {/* Action row */}
        <div style={s.actionRow}>
            <div style={{ ...s.shimmer, flex: 1, height: 44, borderRadius: 2 }} />
            <div style={{ ...s.shimmer, flex: 1, height: 44, borderRadius: 2 }} />
        </div>
    </div>
);

const shimmerBg = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%)';

const s = {
    card: {
        border: '2px solid #000',
        boxShadow: '3px 3px 0 #000',
        background: '#fff',
        padding: 16,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    shimmer: {
        background: shimmerBg,
        backgroundSize: '800px 100%',
        animation: 'shimmer 1.4s infinite linear',
    },
    topRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    middle: {
        borderTop: '2px solid #000',
        paddingTop: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    infoRow: {
        display: 'flex',
        alignItems: 'center',
    },
    actionRow: {
        display: 'flex',
        gap: 10,
    },
};
