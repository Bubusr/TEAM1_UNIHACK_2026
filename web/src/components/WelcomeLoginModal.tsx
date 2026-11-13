'use client';

import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Wallet, ChevronRight } from 'lucide-react';
import { SoundEngine } from '@/lib/sound-engine';
import { UserAccount } from '@/components/UserProfileModal';
import {
  getOrCreateEmbeddedWallet,
  connectInjectedWallet,
} from '@/lib/avalanche-contracts';

interface WelcomeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserAccount) => void;
}

export default function WelcomeLoginModal({
  isOpen,
  onClose,
  onLogin,
}: WelcomeLoginModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Embedded Wallet (Túi Gấm Ẩn mã hóa AES)
  const handleEmbeddedWalletSignIn = (isGuest = false) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    SoundEngine.playBambooKnock();

    try {
      const { wallet } = getOrCreateEmbeddedWallet();
      const address = wallet.address;
      localStorage.setItem('mangnon_wallet_type', 'embedded');

      const email = isGuest ? 'hoc.gia.khach@mangnon.vn' : 'ban.dong.hanh@mangnon.vn';
      const name = isGuest ? 'Học Giả Măng Non' : `Học Giả ${address.slice(2, 6).toUpperCase()}`;

      const newUser: UserAccount = {
        email,
        name,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(address)}`,
        embeddedAddress: address,
        walletType: 'embedded',
        provider: 'embedded',
        connectedAt: new Date().toISOString(),
        dewdrops: 100, // Tặng 100 Giọt Sương tân thủ
        isStudent: false,
      };

      localStorage.setItem('mangnon_user_account', JSON.stringify(newUser));
      SoundEngine.playBlessingChime();
      setIsSubmitting(false);
      onLogin(newUser);
      onClose();
    } catch (err: any) {
      console.error('Embedded wallet error:', err);
      setErrorMsg('Không thể khởi tạo ví ẩn. Vui lòng thử lại!');
      setIsSubmitting(false);
    }
  };

  // 2. Injected Wallet (Core Wallet / MetaMask trên Avalanche Fuji)
  const handleInjectedWalletSignIn = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    SoundEngine.playBambooKnock();

    try {
      const session = await connectInjectedWallet();
      localStorage.setItem('mangnon_wallet_type', 'injected');

      const address = session.address;
      const newUser: UserAccount = {
        email: `${address.slice(0, 6)}...${address.slice(-4)}@avax.fuji`,
        name: `Avalanche ${address.slice(2, 6).toUpperCase()}`,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(address)}`,
        embeddedAddress: address,
        walletType: 'injected',
        provider: 'injected',
        connectedAt: new Date().toISOString(),
        dewdrops: 100, // Tặng 100 Giọt Sương tân thủ
        isStudent: false,
      };

      localStorage.setItem('mangnon_user_account', JSON.stringify(newUser));
      SoundEngine.playBlessingChime();
      setIsSubmitting(false);
      onLogin(newUser);
      onClose();
    } catch (err: any) {
      console.error('Injected wallet error:', err);
      setErrorMsg(err.message || 'Không thể kết nối Ví Web3. Vui lòng kiểm tra Core/MetaMask!');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191B1D]/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#F4EEDD] border-[3px] border-[#26292B] shadow-[5px_5px_0px_#26292B] rounded-2xl p-5 text-[#26292B] flex flex-col items-center">
        {/* Folk Badge */}
        <div className="w-12 h-12 rounded-2xl bg-[#CFA85B] border-[2.5px] border-[#26292B] shadow-[2.5px_2.5px_0px_#26292B] flex items-center justify-center text-2xl -mt-2 mb-2 animate-bounce">
          🎋
        </div>

        {/* Title */}
        <h2 className="text-base font-black text-[#26292B] text-center tracking-tight uppercase">
          Khởi Hành Cùng Măng Non
        </h2>
        <p className="text-[11px] text-[#5C4D43] text-center mt-1 leading-snug">
          Đồng hành học tập tĩnh tại &amp; ghi dấu mộc bản trên mạng Avalanche Fuji
        </p>

        {/* Gift Banner */}
        <div className="w-full mt-3 p-3 rounded-xl bg-[#EDE5D2] border-[2px] border-[#26292B] shadow-[2px_2px_0px_#26292B] text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#A84D3D]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TẶNG 100 GIỌT SƯƠNG 💧 TÂN THỦ</span>
          </div>
          <p className="text-[10px] text-[#26292B] mt-1 leading-tight font-medium">
            Tặng ngay <strong>100 💧 Giọt Sương</strong> vào túi hành trang để mở khoá mầm măng và sáng tạo bạn đồng hành!
          </p>
        </div>

        {errorMsg && (
          <div className="w-full mt-2.5 p-2 rounded-lg bg-[#F4E8E5] border border-[#A84D3D] text-[10px] text-[#A84D3D] font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Currency guide */}
        <div className="w-full mt-2.5 p-2.5 rounded-xl bg-[#26292B]/5 border border-[#26292B]/20 text-[10px] space-y-1.5 text-[#5C4D43]">
          <div className="flex items-start gap-1.5">
            <span className="text-xs">💧</span>
            <div>
              <strong className="text-[#26292B]">Giọt Sương (Dewdrops):</strong> Dùng mở khoá mầm măng (-20 💧) và vào Studio tạo hình.
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-xs">🍃</span>
            <div>
              <strong className="text-[#26292B]">Mầm Lực (Leaves):</strong> Tích luỹ sau các phiên tập trung, dâng Cây Đa Làng Phù Đổng.
            </div>
          </div>
        </div>

        {/* Dual Login Options */}
        <div className="w-full mt-4 space-y-2.5">
          {/* Option 1: Embedded Wallet (Mã hoá AES) */}
          <button
            onClick={() => handleEmbeddedWalletSignIn(false)}
            disabled={isSubmitting}
            className="w-full py-3 px-3.5 rounded-xl bg-[#5A6544] hover:bg-[#4C563A] text-[#F4EEDD] font-black text-xs border-[2.5px] border-[#26292B] shadow-[3px_3px_0px_#26292B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#26292B] flex items-center justify-between transition"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🌱</span>
              <div className="text-left">
                <div className="font-black leading-none">Khởi Tạo Túi Gấm Ẩn (Nhanh)</div>
                <div className="text-[9px] text-[#D5DECE] mt-0.5 font-normal">Tự sinh ví Fuji, mã hoá AES-CTR (+100 💧)</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 text-[#CFA85B]" />
          </button>

          {/* Option 2: Core Wallet / MetaMask (Web3 Native) */}
          <button
            onClick={handleInjectedWalletSignIn}
            disabled={isSubmitting}
            className="w-full py-3 px-3.5 rounded-xl bg-[#A84D3D] hover:bg-[#934233] text-white font-black text-xs border-[2.5px] border-[#26292B] shadow-[3px_3px_0px_#26292B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#26292B] flex items-center justify-between transition"
          >
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-white shrink-0" />
              <div className="text-left">
                <div className="font-black leading-none">Kết Nối Ví Core / MetaMask</div>
                <div className="text-[9px] text-white/80 mt-0.5 font-normal">Avalanche Fuji C-Chain (43113) (+100 💧)</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 text-[#CFA85B]" />
          </button>

          {/* Option 3: Guest Trial */}
          <button
            onClick={() => handleEmbeddedWalletSignIn(true)}
            disabled={isSubmitting}
            className="w-full py-2.5 px-3 rounded-xl bg-transparent hover:bg-[#26292B]/5 text-[#5C4D43] font-bold text-[11px] border border-[#26292B]/30 flex items-center justify-center gap-1.5 transition"
          >
            <span>Trải nghiệm Khách Học Giả (Nhận 100 💧)</span>
          </button>
        </div>

        {/* Footnote */}
        <div className="mt-3.5 flex items-center gap-1 text-[9px] text-[#5C4D43]/80">
          <ShieldCheck className="w-3.5 h-3.5 text-[#5A6544]" />
          <span>Bảo mật chuẩn Avalanche Fuji · Zero-penalty · Tự do an yên</span>
        </div>
      </div>
    </div>
  );
}
