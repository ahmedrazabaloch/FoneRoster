import React from 'react';
import { Card } from '../components/ui';

export const SearchPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-3 md:p-4">
            <Card className="max-w-3xl w-full relative">
                <h2 className="text-2xl md:text-4xl font-black uppercase mb-4 md:mb-8 tracking-wider">Site Locator</h2>

                <div className="flex border-2 md:border-4 border-black p-1.5 md:p-2 shadow-brutal">
                    <input
                        type="text"
                        placeholder="ENTER SITE ID..."
                        className="flex-1 min-w-0 p-2 text-sm md:text-xl font-bold uppercase placeholder-gray-400 focus:outline-none"
                    />
                    <button className="bg-red-600 text-white px-4 md:px-8 py-2 font-black uppercase text-sm md:text-base border-2 border-black hover:translate-y-px hover:shadow-none transition-all shrink-0 min-h-[44px]">
                        Search
                    </button>
                </div>

                <div className="mt-12 text-center">
                    <span className="bg-yellow-400 text-black px-4 py-2 font-black border-2 border-black text-xl uppercase -rotate-2 inline-block shadow-brutal">
                        Coming Soon
                    </span>
                    <p className="mt-4 font-bold text-gray-500 uppercase tracking-widest text-sm">
                        Advanced Search & History Modules Under Construction
                    </p>
                </div>
            </Card>
        </div>
    );
};
