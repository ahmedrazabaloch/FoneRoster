import React from 'react';

/**
 * EmployeeCardSkeleton.jsx
 * Shimmer skeleton placeholder for EmployeeCard.
 * Matches the new card layout with photo, badges, and contact sections.
 */
export const EmployeeCardSkeleton = () => (
    <div className="bg-white border-2 border-black p-4 animate-pulse">
        {/* Top Section */}
        <div className="flex items-start gap-3">
            {/* Photo */}
            <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0" />
            
            {/* Name & Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                    </div>
                    <div className="w-8 h-8 bg-gray-100 rounded" />
                </div>
                
                {/* Badges */}
                <div className="flex gap-2 mt-3">
                    <div className="h-5 bg-gray-100 rounded w-16" />
                    <div className="h-5 bg-gray-100 rounded w-16" />
                </div>
            </div>
        </div>
        
        {/* Contact Section */}
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-100 rounded w-28" />
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
        </div>
    </div>
);
