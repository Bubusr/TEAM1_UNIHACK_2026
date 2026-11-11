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
      <body className="antialiased selection:bg-warm-amber selection:text-forest-abyss bg-[#0A1113] overflow-x-hidden">
        <main className="min-h-screen w-full flex flex-col">{children}</main>
      </body>
    </html>
  );
}
