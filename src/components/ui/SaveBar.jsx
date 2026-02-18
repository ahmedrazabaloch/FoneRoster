import React from 'react';
import { Save, Loader2 } from 'lucide-react';

/**
 * Sticky bottom save bar — only visible when isDirty is true.
 * Full-width on mobile, centered on desktop.
 */
export const SaveBar = ({ isDirty, isSaving, onSave }) => {
    if (!isDirty) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:p-4 bg-white/95 backdrop-blur border-t-2 border-black shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
            <div className="max-w-7xl mx-auto flex justify-center">
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className={`
                        w-full md:w-auto md:min-w-[280px]
                        h-[52px] md:h-12
                        flex items-center justify-center gap-2
                        px-8 font-black text-base uppercase tracking-wide
                        border-2 border-black
                        transition-all duration-150
                        ${isSaving
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700 shadow-brutal active:shadow-brutal-none active:translate-x-[4px] active:translate-y-[4px]'
                        }
                    `}
                >
                    {isSaving ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            <span>Save Changes</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
