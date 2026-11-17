'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface BadgeItem {
  id: string;
  routeId: string;
  title: string;
  network: string;
  receivedAt: string;
}

interface VoucherItem {
  id: string;
  routeId: string;
  partnerName: string;
  discount: string;
  expiryDate: string;
  used: boolean;
}

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<'badges' | 'vouchers'>('badges');
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [userAlias, setUserAlias] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('busquest_user_logged_in') === 'true';
    setIsLoggedIn(loggedIn);

    const alias = localStorage.getItem('busquest_user_alias') || 'Khách #1001';
    setUserAlias(alias);

    const savedBadges = localStorage.getItem('busquest_badges');
    if (savedBadges) {
      try {
        setBadges(JSON.parse(savedBadges));
      } catch {
        setBadges([]);
      }
    }

    const savedVouchers = localStorage.getItem('busquest_vouchers');
    if (savedVouchers) {
      try {
        setVouchers(JSON.parse(savedVouchers));
      } catch {
        setVouchers([]);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('busquest_user_logged_in');
    setIsLoggedIn(false);
  };

  const handleLogin = () => {
    localStorage.setItem('busquest_user_logged_in', 'true');
    setIsLoggedIn(true);
  };

  const unusedVouchers = vouchers.filter((v) => !v.used);
  const usedVouchers = vouchers.filter((v) => v.used);

  return (
    <div className="flex flex-col min-h-full bg-slate-50/60 pb-12">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-100 px-5 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900">Ví Của Tôi</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLoggedIn ? `${userAlias} • Avalanche Fuji` : 'Chưa kết nối tài khoản'}
            </p>
          </div>

          <div>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100/80 px-3 py-1.5 rounded-full transition-colors touch-press"
              >
                Đăng xuất
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-3.5 py-1.5 rounded-full shadow-sm transition-colors touch-press"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        {/* Segmented Control Tabs */}
        <div className="mt-4 bg-slate-100 p-1 rounded-xl flex">
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all touch-press flex items-center justify-center gap-1.5 ${
              activeTab === 'badges'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Huy hiệu Soulbound</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {badges.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all touch-press flex items-center justify-center gap-1.5 ${
              activeTab === 'vouchers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Phiếu ưu đãi</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {vouchers.length}
            </span>
          </button>
        </div>
      </header>

      {/* Tab Contents */}
      <div className="p-4 space-y-4">
        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="space-y-3">
            {badges.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200/70 text-center space-y-3 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
                <div className="w-10 h-10 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-800">
                    Chưa có huy hiệu nào
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Hoàn thành 3 trạm trong lộ trình Quận 1 để nhận huy hiệu NFT chứng nhận thành tích.
                  </p>
                </div>
                <Link
                  href="/routes/1"
                  className="inline-block bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors touch-press"
                >
                  Khám phá lộ trình &rarr;
                </Link>
              </div>
            ) : (
              badges.map((b) => (
                <div
                  key={b.id}
                  className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-400">
                        Soulbound Token • Không thể chuyển nhượng
                      </span>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {b.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      ERC-721
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Mạng: {b.network}</span>
                    <span>Cấp ngày: {b.receivedAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Vouchers Tab */}
        {activeTab === 'vouchers' && (
          <div className="space-y-3">
            {vouchers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200/70 text-center space-y-3 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
                <div className="w-10 h-10 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-800">
                    Chưa có phiếu ưu đãi
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Voucher sẽ tự động được phát hành vào ví sau khi bạn hoàn thành toàn bộ lộ trình.
                  </p>
                </div>
                <Link
                  href="/routes/1"
                  className="inline-block bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors touch-press"
                >
                  Bắt đầu tour xe buýt &rarr;
                </Link>
              </div>
            ) : (
              <>
                {/* Unused Vouchers */}
                {unusedVouchers.map((v) => (
                  <div
                    key={v.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-3 relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {v.partnerName}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                          {v.discount}
                        </h4>
                      </div>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        Còn hiệu lực
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Hạn dùng: {v.expiryDate}
                      </span>
                      <Link
                        href={`/wallet/voucher/${v.id}`}
                        className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors touch-press"
                      >
                        <span>Sử dụng</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Used Vouchers */}
                {usedVouchers.map((v) => (
                  <div
                    key={v.id}
                    className="bg-slate-50/80 rounded-2xl border border-slate-200/60 p-4 opacity-60 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 line-through">
                        {v.discount}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        Đã sử dụng
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{v.partnerName}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
