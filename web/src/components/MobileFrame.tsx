'use client';

import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="min-h-screen w-full bg-[#141C1E] flex items-center justify-center p-2 sm:p-6 overflow-hidden relative">
      {/* Background: Eerie Vintage Forest & Dó Paper Fiber Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(#2D3C3F 1.5px, transparent 1.5px), radial-gradient(#1A2426 1.5px, transparent 1.5px)',
          backgroundSize: '20px 20px, 10px 10px',
          backgroundPosition: '0 0, 5px 5px',
        }}
      />

      {/* Rough Doodle 2D Cutout Frame */}
      <div
        className="relative w-full h-[100dvh] sm:w-[410px] sm:h-[844px] sm:max-h-[92vh] bg-[#222E30] border-0 sm:border-[3.5px] sm:border-[#26292B] sm:shadow-[7px_7px_0px_#191B1D] overflow-hidden flex flex-col z-10"
        style={{
          borderRadius: 'var(--radius-doodle-1)',
        }}
      >
        {/* Inner App Content */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col select-none">
          {children}
        </div>
      </div>
    </div>
  );
}
