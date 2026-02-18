import React from 'react';

export const RouteDisplay = ({ route }) => {
    if (!route) return null;

    return (
        <div className="flex items-center flex-wrap gap-2 mt-2 bg-gray-900 p-2 border-2 border-black">
            <span className="text-red-500 font-bold uppercase text-[10px]">ROUTE:</span>
            {route.split(',').map((segment, idx) => (
                <span
                    key={idx}
                    className={`inline-block bg-white text-gray-900 px-2 py-1 border-2 border-red-500 text-[10px] font-black ${idx % 2 === 0 ? '-rotate-2' : 'rotate-2'}`}
                    style={{ boxShadow: '3px 3px 0px #ef4444' }}
                >
                    {segment.trim()}
                </span>
            ))}
        </div>
    );
};
