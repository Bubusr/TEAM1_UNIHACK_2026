import type { Metadata, Viewport } from 'next';
import './globals.css';
import DemoBanner from '@/components/DemoBanner';
import SimulationBanner from '@/components/SimulationBanner';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'BusQuest — Khám phá Sài Gòn bằng xe buýt',
  description: 'Tour xe buýt nhiệm vụ — ghé 3 điểm di tích lịch sử, nhận Huy hiệu NFT & Voucher ưu đãi trên Avalanche Fuji',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-slate-100 min-h-screen flex justify-center">
        <div className="w-full max-w-[430px] min-h-screen bg-white flex flex-col relative overflow-hidden shadow-2xl">
          {/* Banners cố định trên cùng */}
          <div className="flex-shrink-0">
            <DemoBanner />
            <SimulationBanner />
          </div>

          {/* Nội dung trang cuộn được */}
          <main className="flex-1 overflow-y-auto pb-20">
            {children}
          </main>

          {/* Thanh điều hướng dưới cố định */}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
