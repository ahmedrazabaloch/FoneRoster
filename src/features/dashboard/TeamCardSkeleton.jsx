import React from 'react';

const Bar = ({ width = '100%', height = '16px', className = '' }) => (
    <div
        className={`shimmer rounded-none ${className}`}
        style={{ width, height }}
    />
);

export const TeamCardSkeleton = () => (
    <div className="bg-white border-2 md:border-4 border-black shadow-brutal md:shadow-brutal-lg flex flex-col">
        {/* Header */}
        <div className="p-3 md:p-4 border-b-2 md:border-b-4 border-black bg-gray-100 flex justify-between items-center">
            <div className="flex flex-col gap-2">
                <Bar width="60px" height="10px" />
                <Bar width="140px" height="22px" />
            </div>
            <div className="bg-white border-2 border-black px-3 py-2 shadow-brutal-sm">
                <Bar width="70px" height="14px" />
            </div>
        </div>

        {/* Mobile rows */}
        <div className="md:hidden p-2 space-y-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-200">
                    <Bar width="50px" height="10px" />
                    <Bar width="120px" height="14px" />
                </div>
            ))}
        </div>

        {/* Desktop 3-column */}
        <div className="hidden md:grid md:grid-cols-3 md:divide-x-2 divide-black">
            {[1, 2, 3].map(i => (
                <div key={i} className={`p-4 flex flex-col gap-2 ${i === 2 ? 'bg-gray-50' : ''}`}>
                    <Bar width="80px" height="10px" />
                    <Bar width="130px" height="16px" />
                    <div className="mt-auto space-y-1 pt-3">
                        <Bar width="100%" height="12px" />
                        <Bar width="100%" height="12px" />
                    </div>
                </div>
            ))}
        </div>

        {/* Route footer */}
        <div className="p-2 md:p-3 border-t-2 md:border-t-4 border-black bg-gray-900">
            <div className="flex items-center gap-2">
                <Bar width="50px" height="12px" className="!bg-red-500/30" />
                <Bar width="80px" height="20px" className="!bg-white/20" />
                <Bar width="100px" height="20px" className="!bg-white/20" />
            </div>
        </div>
    </div>
);
