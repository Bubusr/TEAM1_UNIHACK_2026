'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isCheckin = pathname.startsWith('/checkin');
  const isWallet = pathname.startsWith('/wallet');

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      <div className="bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-2px_10px_rgba(15,23,42,0.03)]">
        <div className="flex items-center justify-around h-16 px-4 pb-safe">

          {/* Trang chủ */}
          <Link href="/" className="flex flex-col items-center gap-1 flex-1 py-1 touch-press group">
            <svg
              className={`w-5 h-5 transition-colors ${isHome ? 'text-emerald-700 stroke-[2.2]' : 'text-slate-400 stroke-[1.6]'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
            <span className={`text-[10px] font-medium tracking-tight transition-colors ${isHome ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
              Trang chủ
            </span>
          </Link>

          {/* Quét QR Check-in */}
          <Link href="/checkin" className="flex flex-col items-center -mt-5 relative touch-press">
            <div
              className={`w-13 h-13 p-3.5 rounded-full flex items-center justify-center border-3 border-white transition-all shadow-md ${
                isCheckin ? 'bg-emerald-800 shadow-emerald-900/20' : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              <svg className="w-6 h-6 text-white stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM13.5 13.5h3.75m-3.75 3.75h3.75m3.75-3.75v3.75m0-3.75h.008v.008H21v-.008zm0 3.75h.008v.008H21v-.008z"
                />
              </svg>
            </div>
            <span className={`text-[10px] mt-1 font-medium tracking-tight transition-colors ${isCheckin ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
              Quét QR
            </span>
          </Link>

          {/* Ví của tôi */}
          <Link href="/wallet" className="flex flex-col items-center gap-1 flex-1 py-1 touch-press group">
            <svg
              className={`w-5 h-5 transition-colors ${isWallet ? 'text-emerald-700 stroke-[2.2]' : 'text-slate-400 stroke-[1.6]'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
              />
            </svg>
            <span className={`text-[10px] font-medium tracking-tight transition-colors ${isWallet ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
              Ví của tôi
            </span>
          </Link>

        </div>
      </div>
    </nav>
  );
}
