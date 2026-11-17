'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';

interface VoucherDetail {
  id: string;
  routeId: string;
  partnerName: string;
  discount: string;
  expiryDate: string;
  used: boolean;
}

export default function VoucherQRPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const voucherId = resolvedParams.id;

  const [voucher, setVoucher] = useState<VoucherDetail | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(30);

  useEffect(() => {
    const saved = localStorage.getItem('busquest_vouchers');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        const found = list.find((v: VoucherDetail) => v.id === voucherId);
        if (found) setVoucher(found);
      } catch (e) {
        console.error(e);
      }
    }
  }, [voucherId]);

  useEffect(() => {
    if (!voucher || voucher.used) return;

    const generateDynamicQR = async () => {
      const expiryTimestamp = Math.floor(Date.now() / 1000) + 30;
      const payload = {
        type: 'BUSQUEST_VOUCHER_REDEEM',
        voucherId: voucher.id,
        routeId: voucher.routeId,
        partner: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        expiry: expiryTimestamp,
        signature: '0xmock_eip712_user_redeem_signature_for_testnet_demo',
      };
      try {
        const url = await QRCode.toDataURL(JSON.stringify(payload), {
          width: 260,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
        });
        setQrDataUrl(url);
        setCountdown(30);
      } catch (err) {
        console.error('Lỗi tạo mã QR:', err);
      }
    };

    generateDynamicQR();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          generateDynamicQR();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [voucher]);

  if (!voucher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-3 p-8 text-center text-slate-400">
        <p className="text-xs">Không tìm thấy voucher.</p>
        <Link href="/wallet" className="text-xs font-semibold text-emerald-700">
          &larr; Về Ví cá nhân
        </Link>
      </div>
    );
  }

  if (voucher.used) {
    return (
      <div className="flex flex-col min-h-full bg-slate-50/60 pb-10">
        <header className="bg-white border-b border-slate-100 px-4 py-3.5 flex items-center gap-3">
          <Link href="/wallet" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 touch-press">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-sm font-bold text-slate-900">Chi tiết Voucher</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-lg mx-auto">
            ✓
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800">
              Voucher đã được đổi
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              {voucher.discount} tại {voucher.partnerName}. Phiếu này chỉ có giá trị sử dụng một lần.
            </p>
          </div>
          <Link
            href="/wallet"
            className="inline-block bg-slate-900 hover:bg-black text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors touch-press mt-2"
          >
            Quay lại Ví
          </Link>
        </div>
      </div>
    );
  }

  const progressPct = (countdown / 30) * 100;

  return (
    <div className="flex flex-col min-h-full bg-slate-50/60 pb-10">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between">
        <Link
          href="/wallet"
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors touch-press"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-xs font-semibold text-slate-700">Mã Xác Thực Ưu Đãi</span>
        <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
          Dùng 1 lần
        </span>
      </header>

      <div className="p-4 space-y-4">
        {/* Voucher Info Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-1 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {voucher.partnerName}
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {voucher.discount}
          </h2>
          <div className="text-xs text-slate-400 pt-1">
            Hạn áp dụng đến: {voucher.expiryDate}
          </div>
        </div>

        {/* Dynamic QR Presentation Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col items-center space-y-4">
          <div className="p-2 border border-slate-100 rounded-2xl bg-white shadow-xs">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Mã QR Voucher" className="w-52 h-52 rounded-xl" />
            ) : (
              <div className="w-52 h-52 bg-slate-50 rounded-xl flex items-center justify-center text-xs text-slate-400">
                Đang tạo mã an toàn...
              </div>
            )}
          </div>

          {/* Countdown timer */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Tự động làm mới</span>
              <span className="font-mono font-semibold text-slate-800 tabular-nums">
                {countdown}s
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-700 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Mã QR chứa chữ ký EIP-712 giới hạn 30 giây để chống gian lận chia sẻ ảnh chụp màn hình. Xuất trình trực tiếp cho nhân viên quán.
          </p>
        </div>

        {/* Fast Switch to Merchant Screen */}
        <div className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-700">Dành cho nhân viên quán</div>
            <div className="text-[11px] text-slate-400">Chuyển sang màn hình quét xác nhận</div>
          </div>
          <Link
            href="/merchant"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 touch-press"
          >
            Quét đổi &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
