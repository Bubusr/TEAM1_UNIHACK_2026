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
      <body className="antialiased selection:bg-warm-amber selection:text-forest-abyss bg-[#0A1113] overflow-x-hidden">
        <main className="min-h-screen w-full flex flex-col">{children}</main>
      </body>
    </html>
  );
}
