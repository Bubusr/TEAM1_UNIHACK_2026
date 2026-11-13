import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MĂNG NON — Sinh linh Đồng hành Học tập & Nuôi lớn Cộng đồng',
  description: 'Tựa game Web3 trên Avalanche kết hợp AI Companion, lấy cảm hứng từ Thánh Gióng x Công chúa Kaguya. UniHack 2026 - Team 1.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Mali:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-[#CFA85B] selection:text-[#1F2224] bg-[#182325] overflow-x-hidden font-sans">
        {/* SVG Filter Definition for Rough Doodle & Eerie Vintage Boiling Linework */}
        <svg className="pointer-events-none fixed inset-0 h-0 w-0 opacity-0" aria-hidden="true">
          <defs>
            {/* Rough Doodle Hand-inked Edge */}
            <filter id="doodle-rough-edge" x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" seed="3" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            {/* Backward-compatible alias */}
            <filter id="woodblock-edge" x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence type="fractalNoise" baseFrequency="0.038" numOctaves="3" result="noise" seed="1" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.0" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            {/* 3 Stepped Frames for Shaky Hand-drawn Doodle Boiling Line (Rusty Lake / Indie 2D Style) */}
            <filter id="cuphead-boil-1" x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" result="noise" seed="2" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="cuphead-boil-2" x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" result="noise" seed="5" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="cuphead-boil-3" x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" result="noise" seed="9" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>

        <main className="min-h-screen w-full flex flex-col">{children}</main>
      </body>
    </html>
  );
}
