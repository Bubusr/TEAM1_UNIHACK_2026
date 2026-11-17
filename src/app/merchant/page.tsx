'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface VoucherItem {
  id: string;
  routeId: string;
  partnerName: string;
  discount: string;
  expiryDate: string;
  used: boolean;
}

export default function MerchantPage() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [redeeming, setRedeeming] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('busquest_vouchers');
    if (saved) {
      try {
        setVouchers(JSON.parse(saved));
      } catch {
        setVouchers([]);
      }
    }
  }, []);

  const handleRedeem = (voucherId: string) => {
    setRedeeming(true);
    setScanResult(null);

    setTimeout(() => {
      const saved = localStorage.getItem('busquest_vouchers');
      const list: VoucherItem[] = saved ? JSON.parse(saved) : [];
      const target = list.find((v) => v.id === voucherId);

      if (!target) {
        setScanResult({
          status: 'error',
          title: 'Voucher không tồn tại',
          message: 'Không tìm thấy thông tin trên hợp đồng VoucherManager.',
        });
        setRedeeming(false);
        return;
      }

      if (target.used) {
        setScanResult({
          status: 'error',
          title: 'Từ chối: Voucher đã qua sử dụng',
          message: 'Hợp đồng thông minh đã ghi nhận voucher này được đổi trước đó. Giao dịch bị hủy bỏ.',
        });
        setRedeeming(false);
        return;
      }

      const updatedList = list.map((v) =>
        v.id === voucherId ? { ...v, used: true } : v
      );
      localStorage.setItem('busquest_vouchers', JSON.stringify(updatedList));
      setVouchers(updatedList);

      setScanResult({
        status: 'success',
        title: 'Xác thực thành công',
        message: `Đã áp dụng "${target.discount}". Hợp đồng thông minh trên Fuji đã cập nhật trạng thái.`,
      });
      setRedeeming(false);
    }, 600);
  };

  const unusedVouchers = vouchers.filter((v) => !v.used);
  const usedVouchers = vouchers.filter((v) => v.used);

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
          <h1 className="text-sm font-bold text-slate-900">Quán Cà Phê Bưu Điện Xưa</h1>
          <p className="text-[11px] text-slate-400">Đối tác chấp nhận đổi thưởng</p>
        </div>
        <span className="w-8"></span>
      </header>

      <div className="p-4 space-y-4">
        {/* Verification Result Banner */}
        {scanResult && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1 ${
              scanResult.status === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="font-bold text-sm">{scanResult.title}</div>
            <div className="leading-relaxed opacity-90">{scanResult.message}</div>
          </div>
        )}

        {/* Minimal Camera Scanner Mock */}
        <div className="relative aspect-video max-w-sm mx-auto w-full bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-800 flex flex-col items-center justify-center">
          <div className="absolute inset-6 pointer-events-none">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-slate-400/80 rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-slate-400/80 rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-slate-400/80 rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-slate-400/80 rounded-br-sm" />
          </div>

          <div className="space-y-1.5 text-center px-4 relative z-10">
            <div className="text-xs font-medium text-slate-300">
              Máy quét mã khách hàng
            </div>
            <p className="text-[11px] text-slate-500">
              Hướng camera vào mã QR voucher trên điện thoại của khách
            </p>
          </div>
        </div>

        {/* List of Vouchers presented by customers */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-4 space-y-3 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800">
              Voucher đang trình diện ({vouchers.length})
            </h2>
            <span className="text-[11px] text-slate-400">Chạm để duyệt</span>
          </div>

          {vouchers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <p>Chưa có voucher nào được lưu trên máy khách.</p>
              <Link href="/routes/1" className="text-emerald-700 font-semibold hover:underline">
                Hoàn thành tuyến Quận 1 để nhận voucher mẫu &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {unusedVouchers.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">
                      {v.discount}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {v.id} • Còn hiệu lực
                    </div>
                  </div>
                  <button
                    onClick={() => handleRedeem(v.id)}
                    disabled={redeeming}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-colors touch-press shrink-0"
                  >
                    {redeeming ? '...' : 'Xác nhận'}
                  </button>
                </div>
              ))}

              {usedVouchers.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl border border-slate-200/60 bg-slate-50/70 opacity-70 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-slate-500 line-through">
                      {v.discount}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Đã sử dụng
                    </div>
                  </div>
                  <button
                    onClick={() => handleRedeem(v.id)}
                    disabled={redeeming}
                    className="bg-slate-200 hover:bg-rose-100 hover:text-rose-800 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors touch-press shrink-0"
                    title="Bấm để kiểm tra phản hồi từ chối"
                  >
                    Quét lại (Thử lỗi)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-[11px] text-slate-400 pt-1">
          Chỉ tài khoản đối tác được phân quyền mới có thể gọi hàm <code>redeem()</code>
        </div>
      </div>
    </div>
  );
}
