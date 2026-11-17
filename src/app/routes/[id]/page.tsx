'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import TransitMap from '@/components/TransitMap';
import TransitGuide from '@/components/TransitGuide';

interface Stop {
  id: string;
  orderIndex: number;
  name: string;
  description: string;
  qrCode: string;
}

interface RouteDetail {
  id: string;
  name: string;
  description: string;
  estimatedTime: number;
  stops: Stop[];
}

export default function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const routeId = resolvedParams.id;

  const [activeView, setActiveView] = useState<'missions' | 'transit'>('missions');
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [checkedInStops, setCheckedInStops] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/routes')
      .then((res) => res.json())
      .then((data) => {
        const found = (data.routes || []).find((r: RouteDetail) => r.id === routeId);
        if (found) setRoute(found);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    const saved = localStorage.getItem(`busquest_progress_${routeId}`);
    if (saved) {
      try {
        setCheckedInStops(JSON.parse(saved));
      } catch {
        setCheckedInStops([]);
      }
    }

    const claimed = localStorage.getItem(`busquest_claimed_${routeId}`);
    if (claimed === 'true') setClaimSuccess(true);
  }, [routeId]);

  const totalStops = route?.stops?.length || 3;
  const completedCount = checkedInStops.length;
  const isAllCompleted = completedCount >= totalStops;
  const progressPct = Math.round((completedCount / totalStops) * 100);

  const handleClaimReward = async () => {
    setClaiming(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: routeId,
          playerAddress: '0x1111111111111111111111111111111111111111',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể xác nhận hoàn thành');

      const existingVouchers = JSON.parse(localStorage.getItem('busquest_vouchers') || '[]');
      const newVoucher = {
        id: `VC-${Date.now()}`,
        routeId,
        partnerName: 'Quán Cà Phê Bưu Điện Xưa',
        discount: 'Giảm 20.000đ khi dùng tại quán',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
        used: false,
      };
      localStorage.setItem('busquest_vouchers', JSON.stringify([...existingVouchers, newVoucher]));

      const existingBadges = JSON.parse(localStorage.getItem('busquest_badges') || '[]');
      const newBadge = {
        id: `NFT-${Date.now()}`,
        routeId,
        title: 'Nhà Khám Phá Tuyến 1',
        network: 'Avalanche Fuji',
        receivedAt: new Date().toLocaleDateString('vi-VN'),
      };
      localStorage.setItem('busquest_badges', JSON.stringify([...existingBadges, newBadge]));
      localStorage.setItem(`busquest_claimed_${routeId}`, 'true');

      setClaimSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#047857', '#10b981', '#34d399', '#0f172a'],
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 py-24 text-slate-400">
        <div className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs">Đang tải thông tin...</span>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-xs text-slate-500">Không tìm thấy lộ trình.</p>
        <Link href="/" className="inline-block text-xs font-semibold text-emerald-700">
          &larr; Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50/60 pb-12">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between">
        <Link
          href="/"
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors touch-press"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Tuyến #{routeId} • Trung tâm Quận 1
        </span>
        <span className="w-8"></span>
      </header>

      {/* Route Quick Summary */}
      <div className="p-4 pb-0">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-3">
          <div className="space-y-1">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              {route.name}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {route.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-600">Tiến độ hoàn thành</span>
              <span className="font-semibold text-slate-900">
                {completedCount}/{totalStops} trạm ({progressPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-700 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* View Switcher: Missions vs Transit Map & Bus */}
        <div className="mt-3 bg-slate-100 p-1 rounded-xl flex">
          <button
            onClick={() => setActiveView('missions')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all touch-press flex items-center justify-center gap-1.5 ${
              activeView === 'missions'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Nhiệm vụ Check-in</span>
          </button>
          <button
            onClick={() => setActiveView('transit')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all touch-press flex items-center justify-center gap-1.5 ${
              activeView === 'transit'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <span>Bản đồ & Xe buýt</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 space-y-4">
        {activeView === 'transit' ? (
          /* TAB 2: TRANSIT ROUTE MAP & BUS LINES */
          <div className="space-y-4">
            <TransitMap />
            <TransitGuide />
          </div>
        ) : (
          /* TAB 1: MISSIONS & CHECK-IN LIST */
          <div className="space-y-4">
            {/* Vertical Timeline Stops */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Các trạm dừng cần check-in
                </h2>
                <button
                  onClick={() => setActiveView('transit')}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 touch-press"
                >
                  Xem tuyến xe buýt &rarr;
                </button>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[1.5px] before:bg-slate-200">
                {route.stops.map((stop, idx) => {
                  const isChecked = checkedInStops.includes(stop.qrCode) || checkedInStops.includes(stop.id);
                  const isNext = !isChecked && idx === checkedInStops.length;

                  return (
                    <div key={stop.id || idx} className="relative">
                      {/* Status Indicator Dot */}
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                          isChecked
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : isNext
                            ? 'bg-white text-emerald-800 border-emerald-700 ring-2 ring-emerald-100'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {isChecked ? '✓' : idx + 1}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs font-bold text-slate-900">
                            {stop.name}
                          </h3>
                          {isChecked ? (
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              Đã ghé
                            </span>
                          ) : isNext ? (
                            <span className="text-[10px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                              Kế tiếp
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Chưa ghé
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {stop.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Panel */}
            <div className="space-y-3 pt-1">
              {claimSuccess ? (
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 text-center space-y-3 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 mx-auto flex items-center justify-center font-bold text-lg">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      Hoàn thành xuất sắc lộ trình
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Huy hiệu Soulbound NFT và voucher giảm giá 20.000đ đã được chuyển vào ví của bạn.
                    </p>
                  </div>
                  <Link
                    href="/wallet"
                    className="inline-flex items-center justify-center w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors touch-press"
                  >
                    Mở ví nhận thưởng &rarr;
                  </Link>
                </div>
              ) : isAllCompleted ? (
                <button
                  onClick={handleClaimReward}
                  disabled={claiming}
                  className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 touch-press disabled:opacity-50"
                >
                  {claiming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang tạo giao dịch on-chain...</span>
                    </>
                  ) : (
                    <span>Xác nhận hoàn thành & Nhận phần thưởng</span>
                  )}
                </button>
              ) : (
                <Link
                  href="/checkin"
                  className="w-full py-3.5 px-4 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 touch-press"
                >
                  <span>Quét mã trạm kế tiếp</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              )}

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
