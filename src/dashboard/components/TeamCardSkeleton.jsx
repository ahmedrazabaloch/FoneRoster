/**
 * TeamCardSkeleton.jsx — Loading skeleton for team cards
 */
import React from 'react';

export const TeamCardSkeleton = () => (
    <div className="bg-white border-2 md:border-4 border-black shadow-brutal md:shadow-brutal-lg animate-pulse">
        <div className="p-3 md:p-4 border-b-2 md:border-b-4 border-black bg-gray-100">
            <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-6 bg-gray-200 rounded w-32" />
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
            <div>
                <div className="h-3 bg-gray-200 rounded w-12 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
            <div>
                <div className="h-3 bg-gray-200 rounded w-12 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
        </div>
        <div className="p-2 md:p-3 border-t-2 md:border-t-4 border-black bg-gray-200">
            <div className="h-4 bg-gray-300 rounded w-48" />
        </div>
    </div>
);
