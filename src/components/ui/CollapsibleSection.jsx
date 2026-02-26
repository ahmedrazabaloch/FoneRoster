import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * CollapsibleSection
 *
 * Reusable accordion panel matching the brutalist design system.
 * - Desktop (lg+): collapsible with smooth CSS height transition
 * - Mobile:        always collapsible
 *
 * Props:
 *   title        — string, section heading
 *   icon         — optional Lucide icon component
 *   badge        — optional string/node shown right-aligned in header
 *   defaultOpen  — boolean, initial open state (default: false)
 *   titleClass   — optional extra classes for the title text
 *   children     — section content
 */
export const CollapsibleSection = ({
    title,
    icon: Icon,
    badge,
    defaultOpen = false,
    titleClass = '',
    children,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const contentRef = useRef(null);
    const [contentHeight, setContentHeight] = useState(0);

    // Measure content height for smooth transition
    useEffect(() => {
        if (contentRef.current) {
            const observer = new ResizeObserver(([entry]) => {
                setContentHeight(entry.contentRect.height);
            });
            observer.observe(contentRef.current);
            return () => observer.disconnect();
        }
    }, []);

    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    return (
        <div className="bg-white border-2 border-black shadow-brutal md:shadow-brutal-lg">
            {/* Header — always clickable */}
            <button
                onClick={toggle}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between p-3 md:p-5 cursor-pointer min-h-[48px] select-none"
            >
                <div className="flex items-center gap-2">
                    {isOpen
                        ? <ChevronDown size={20} className="shrink-0" />
                        : <ChevronRight size={20} className="shrink-0" />
                    }
                    {Icon && <Icon size={18} className="shrink-0" />}
                    <h3 className={`font-black text-base md:text-xl uppercase ${titleClass}`}>
                        {title}
                    </h3>
                </div>
                {badge && (
                    <span className="text-xs md:text-sm font-bold text-gray-400 shrink-0 ml-2">
                        {badge}
                    </span>
                )}
            </button>

            {/* Content — CSS height transition for smooth animation */}
            <div
                className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                style={{ maxHeight: isOpen ? `${contentHeight + 32}px` : '0px' }}
            >
                <div ref={contentRef} className="border-t-2 border-black">
                    <div className="p-3 md:p-5">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
