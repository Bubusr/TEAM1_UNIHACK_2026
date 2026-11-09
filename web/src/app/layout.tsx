import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

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
      <body className="antialiased selection:bg-emerald-500 selection:text-white">
        <Navigation />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  );
}
