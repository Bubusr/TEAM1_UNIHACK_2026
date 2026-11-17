'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface StopInfo {
  name: string;
  qrCode: string;
}

const DEMO_STOPS: StopInfo[] = [
  { name: 'Nhà thờ Đức Bà', qrCode: 'BUSQUEST-STOP-NHATHODUCBA-001' },
  { name: 'Bưu điện Trung tâm', qrCode: 'BUSQUEST-STOP-BUUDIEN-002' },
  { name: 'Dinh Độc Lập', qrCode: 'BUSQUEST-STOP-DINHDOCLAP-003' },
];

const COORDS: Record<string, { lat: number; lng: number }> = {
  'BUSQUEST-STOP-NHATHODUCBA-001': { lat: 10.7797, lng: 106.6990 },
  'BUSQUEST-STOP-BUUDIEN-002': { lat: 10.7793, lng: 106.6998 },
  'BUSQUEST-STOP-DINHDOCLAP-003': { lat: 10.7769, lng: 106.6953 },
};

export default function CheckInPage() {
  const [inputQr, setInputQr] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [checkedList, setCheckedList] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('busquest_progress_1');
    if (saved) {
      try {
        setCheckedList(JSON.parse(saved));
      } catch {
        setCheckedList([]);
      }
    }
  }, []);

  const handleCheckIn = async (qrToSubmit: string) => {
    if (!qrToSubmit.trim()) return;
    setProcessing(qrToSubmit);
    setResultMessage(null);

    try {
      const coords = COORDS[qrToSubmit.trim()] || { lat: 10.7798, lng: 106.6990 };
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: '1',
          qrCode: qrToSubmit.trim(),
          latitude: coords.lat,
          longitude: coords.lng,
          userId: 'demo-user-id',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check-in thất bại');

      const updated = Array.from(new Set([...checkedList, qrToSubmit.trim()]));
      setCheckedList(updated);
      localStorage.setItem('busquest_progress_1', JSON.stringify(updated));

      setResultMessage({
        type: 'success',
        text: `Đã xác nhận ghé thăm ${data.stopName || 'điểm dừng'}. Tiến độ hiện tại: ${updated.length}/3 trạm.`,
      });
      setInputQr('');
    } catch (err: unknown) {
      setResultMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Có lỗi xảy ra khi xác thực check-in',
      });
    } finally {
      setProcessing(null);
    }
  };

  const allDone = checkedList.length >= 3;

  return (
    <div className="flex flex-col min-h-full bg-slate-50/60 pb-10">
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
        <div className="text-center">
          <h1 className="text-sm font-bold text-slate-900">Quét Mã Check-in</h1>
          <p className="text-[11px] text-slate-400">Tuyến số 1 • Trung tâm Quận 1</p>
        </div>
        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
          {checkedList.length}/3
        </span>
      </header>

      <div className="p-4 space-y-4">
        {/* Minimal Viewfinder */}
        <div className="relative aspect-square max-w-[260px] mx-auto w-full bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-800 flex flex-col items-center justify-center">
          {/* Subtle Viewfinder Frame */}
          <div className="absolute inset-8 pointer-events-none">
            <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-emerald-400/80 rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-emerald-400/80 rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-emerald-400/80 rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-emerald-400/80 rounded-br-sm" />
            <div
              className="absolute left-0 right-0 h-[1.5px] bg-emerald-400/70 animate-pulse top-1/2"
              style={{ animationDuration: '2s' }}
            />
          </div>

          <div className="space-y-2 text-center px-4 relative z-10">
            <svg
              className="w-8 h-8 text-slate-500 mx-auto stroke-[1.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
              />
            </svg>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Hướng camera về phía mã QR gắn tại điểm dừng
            </p>
          </div>
        </div>

        {/* Message Banner */}
        {resultMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-medium border flex items-start gap-2.5 ${
              resultMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                : 'bg-rose-50 text-rose-800 border-rose-100'
            }`}
          >
            <span className="font-bold text-sm shrink-0">
              {resultMessage.type === 'success' ? '✓' : '!'}
            </span>
            <span className="leading-relaxed">{resultMessage.text}</span>
          </div>
        )}

        {/* Completed Journey Prompt */}
        {allDone && (
          <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-2 text-center">
            <div className="text-xs font-bold text-emerald-900">
              Đã hoàn thành toàn bộ 3 điểm dừng
            </div>
            <p className="text-[11px] text-slate-500">
              Bạn đủ điều kiện để nhận huy hiệu NFT và mã ưu đãi đối tác.
            </p>
            <Link
              href="/routes/1"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors touch-press"
            >
              Xem kết quả & Nhận thưởng &rarr;
            </Link>
          </div>
        )}

        {/* Fast Test Section (Demo / Judges) */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Chế độ thử nghiệm nhanh
            </span>
            <span className="text-[10px] text-slate-400">Dành cho Giám khảo</span>
          </div>

          <div className="space-y-2">
            {DEMO_STOPS.map((stop, idx) => {
              const isChecked = checkedList.includes(stop.qrCode);
              const isLoading = processing === stop.qrCode;

              return (
                <button
                  key={stop.qrCode}
                  onClick={() => handleCheckIn(stop.qrCode)}
                  disabled={!!processing || isChecked}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all touch-press ${
                    isChecked
                      ? 'bg-slate-50/60 border-slate-200/60 text-slate-400'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        isChecked
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isChecked ? '✓' : idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        {stop.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {stop.qrCode}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
                    ) : isChecked ? (
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Đã ghi nhận
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-500">
                        Quét &rarr;
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Input */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-4 space-y-2 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
          <label className="text-xs font-semibold text-slate-700 block">
            Hoặc nhập mã trạm dừng thủ công
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="BUSQUEST-STOP-..."
              value={inputQr}
              onChange={(e) => setInputQr(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckIn(inputQr)}
              className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-700 font-mono transition-colors"
            />
            <button
              onClick={() => handleCheckIn(inputQr)}
              disabled={!!processing || !inputQr.trim()}
              className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 touch-press"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
