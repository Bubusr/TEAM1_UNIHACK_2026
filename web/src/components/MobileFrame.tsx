'use client';

import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="min-h-screen w-full bg-forest-abyss flex items-center justify-center p-0 sm:p-6 overflow-hidden">
      {/* Background ambient lighting for desktop */}
      <div className="fixed inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#3E5C45_1px,transparent_1px)] [background-size:24px_24px]"></div>
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-warm-amber/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* The 390x844 Mobile Device Viewport */}
      <div className="relative w-full h-[100dvh] sm:w-[390px] sm:h-[844px] sm:max-h-[92vh] sm:rounded-[44px] bg-forest-darker border-0 sm:border-[8px] sm:border-forest-deep shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-10">
        {/* Dynamic Island / Top Speaker Notch on Desktop */}
        <div className="hidden sm:flex absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4 bg-forest-abyss rounded-full z-50 items-center justify-center pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-forest-deep/80 mr-2"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-warm-amber/60 animate-pulse"></div>
        </div>

        {/* Inner App Content */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col select-none">
          {children}
        </div>
      </div>
    </div>
  );
}

