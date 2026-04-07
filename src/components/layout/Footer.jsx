import React, { useEffect, useState } from 'react';
import { ArrowUp, Linkedin } from 'lucide-react';

export const Footer = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleScrollTop}
        aria-label="Scroll to top"
        className={`fixed bottom-16 right-4 z-50 inline-flex h-12 w-12 items-center justify-center border-2 border-black bg-red-600 text-white transition-all duration-200 hover:-translate-y-1 hover:bg-red-700 ${
          showScrollTop ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        } rounded-none shadow-yellow-brutal`}
      >
        <ArrowUp size={20} strokeWidth={2.5} />
      </button>

      <footer className="border-t-2 border-black bg-white">
        <div className="mx-auto flex min-h-12 max-w-7xl items-center justify-center gap-2 px-3 py-2 text-center text-[11px] font-bold tracking-wide text-gray-700 sm:text-xs">
        <span>Designed &amp; Built by Ahmedraza</span>
        <a
          href="https://www.linkedin.com/in/ahmedrazabaloch"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ahmedraza on LinkedIn"
          className="inline-flex h-7 w-7 items-center justify-center border-2 border-black bg-blue-600 text-white transition-transform hover:-translate-y-0.5 hover:shadow-brutal sm:h-6 sm:w-6"
        >
          <Linkedin size={14} />
        </a>
        </div>
      </footer>
    </>
  );
};
