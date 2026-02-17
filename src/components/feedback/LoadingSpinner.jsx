import React from 'react';

export const LoadingSpinner = ({ message = 'Loading...' }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-black border-t-transparent mb-4"></div>
            <p className="font-black uppercase text-sm text-gray-500">{message}</p>
        </div>
    );
};
