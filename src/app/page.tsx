'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RouteData {
  id: string;
  name: string;
  description: string;
  estimatedTime: number;
  stops: Array<{ id: string; name: string; orderIndex: number }>;
}

export default function HomePage() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAlias, setUserAlias] = useState('');

  useEffect(() => {
    const loggedIn = localStorage.getItem('busquest_user_logged_in') === 'true';
    setIsLoggedIn(loggedIn);

    let alias = localStorage.getItem('busquest_user_alias');
    if (!alias) {
      alias = `Khách #${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('busquest_user_alias', alias);
    }
    setUserAlias(alias);

    fetch('/api/routes')
      .then((r) => r.json())
      .then((d) => {
        if (d.routes) setRoutes(d.routes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = () => {
    localStorage.setItem('busquest_user_logged_in', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('busquest_user_logged_in');
    setIsLoggedIn(false);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50/60 pb-8">
      {/* Top App Header */}
      <header className="bg-white px-5 pt-4 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-700 font-semibold text-xs">
              {isLoggedIn ? userAlias.slice(0, 2).toUpperCase() : 'BQ'}
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                BusQuest TP.HCM
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {isLoggedIn ? userAlias : 'Khám phá bằng xe buýt'}
              </div>
            </div>
          </div>

          <div>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100/70 hover:bg-slate-100 px-3 py-1.5 rounded-full transition-colors touch-press"
              >
                Đăng xuất
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-3.5 py-1.5 rounded-full shadow-sm transition-colors touch-press"
              >
                Đăng nhập Google
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Overview */}
      <div className="px-4 pt-5 pb-3">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                Lộ trình Quận 1
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Tour Di Tích & Lịch Sử
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed pt-0.5">
                Đi xe buýt qua 3 trạm lịch sử trung tâm để nhận huy hiệu Soulbound NFT và voucher đối tác.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
            <div className="bg-slate-50/70 rounded-xl py-2 px-1">
              <div className="text-xs font-bold text-slate-800">3 Điểm</div>
              <div className="text-[10px] text-slate-400">Dừng chân</div>
            </div>
            <div className="bg-slate-50/70 rounded-xl py-2 px-1">
              <div className="text-xs font-bold text-slate-800">Tuyến 19, 04, 18</div>
              <div className="text-[10px] text-slate-400">Xe buýt đón</div>
            </div>
            <div className="bg-slate-50/70 rounded-xl py-2 px-1">
              <div className="text-xs font-bold text-emerald-700">Fuji C-Chain</div>
              <div className="text-[10px] text-slate-400">Xác thực</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Route Card */}
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Lộ trình khả dụng
          </h3>
          <span className="text-[11px] text-slate-400">1 tuyến đang mở</span>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/70 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-400">Đang tải tuyến đường...</span>
          </div>
        ) : (
          routes.map((route) => (
            <div
              key={route.id}
              className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.03)] overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Tuyến #{route.id}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-100">
                        Buýt: 19 • 04 • 18
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">
                      {route.name}
                    </h4>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shrink-0">
                    Sẵn sàng
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {route.description}
                </p>

                {/* Timeline Stops */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-semibold text-slate-600">
                    Thứ tự các trạm ghé:
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {(route.stops || []).map((stop, i) => (
                      <div key={stop.id || i} className="flex items-center gap-1.5 shrink-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center border border-slate-200">
                          {i + 1}
                        </span>
                        <span className="text-xs text-slate-700 font-medium whitespace-nowrap">
                          {stop.name}
                        </span>
                        {i < (route.stops?.length || 0) - 1 && (
                          <svg
                            className="w-3.5 h-3.5 text-slate-300 mx-1 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rewards preview & CTA */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    Phần thưởng: <strong className="text-slate-800 font-semibold">1 NFT + Voucher 20k</strong>
                  </div>
                  <Link
                    href={`/routes/${route.id}`}
                    className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all touch-press shrink-0"
                  >
                    <span>Xem bản đồ & buýt</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Quick Access Menu */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
            Thao tác nhanh
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/checkin"
              className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:border-slate-300 transition-colors touch-press flex items-center gap-3.5"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM13.5 13.5h3.75m-3.75 3.75h3.75m3.75-3.75v3.75" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Quét QR</div>
                <div className="text-[11px] text-slate-400">Check-in tại trạm</div>
              </div>
            </Link>

            <Link
              href="/wallet"
              className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:border-slate-300 transition-colors touch-press flex items-center gap-3.5"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Ví cá nhân</div>
                <div className="text-[11px] text-slate-400">Huy hiệu & Voucher</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Merchant Link */}
        <div className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-700">Dành cho quán đối tác</div>
            <div className="text-[11px] text-slate-400">Xác thực voucher ưu đãi của khách hàng</div>
          </div>
          <Link
            href="/merchant"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 touch-press"
          >
            Mở cổng đối tác &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
