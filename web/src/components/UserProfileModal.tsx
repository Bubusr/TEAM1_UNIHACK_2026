'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, ShieldCheck, Wallet, Copy, Check, LogOut, X, Sparkles, GraduationCap, Zap, Shield } from 'lucide-react';
import { SoundEngine } from '@/lib/sound-engine';

export interface UserAccount {
  email: string;
  name: string;
  avatarUrl?: string;
  embeddedAddress: string;
  provider: 'google';
  connectedAt: string;
  isStudent?: boolean;
  studentEmail?: string;
  studentBoost?: number;
  shieldsCount?: number;
}

const STORAGE_KEY_USER = 'mangnon_user_account';

/** Helper to generate a deterministic Avalanche Fuji address from an email */
function generateEmbeddedAddress(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  const hexPart = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x7E34${hexPart}8BF5B3c3a2D267df6a22f87E3F9ebb0AA`.slice(0, 42);
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChange?: (user: UserAccount | null) => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  onUserChange,
}: UserProfileModalProps) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [studentEduEmail, setStudentEduEmail] = useState('');
  const [isVerifyingStudent, setIsVerifyingStudent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleVerifyStudent = (sampleEdu?: string) => {
    if (!currentUser) return;
    setIsVerifyingStudent(true);
    SoundEngine.playBambooKnock();

    setTimeout(() => {
      const email =
        sampleEdu || studentEduEmail.trim() || `${currentUser.email.split('@')[0]}@hcmut.edu.vn`;
      const updatedUser: UserAccount = {
        ...currentUser,
        isStudent: true,
        studentEmail: email,
        studentBoost: 1.5,
        shieldsCount: 3,
      };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      if (onUserChange) onUserChange(updatedUser);
      setIsVerifyingStudent(false);
      SoundEngine.playBlessingChime();
    }, 500);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        if (onUserChange) onUserChange(parsed);
      } catch {}
    }
  }, [onUserChange]);

  if (!isOpen) return null;

  const handleGoogleLogin = (emailChoice?: string) => {
    setIsLoggingIn(true);
    SoundEngine.playBambooKnock();

    setTimeout(() => {
      const email = emailChoice || customEmail.trim() || 'ban.dong.hanh@gmail.com';
      const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const embeddedAddress = generateEmbeddedAddress(email);

      const newUser: UserAccount = {
        email,
        name,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        embeddedAddress,
        provider: 'google',
        connectedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      setCurrentUser(newUser);
      if (onUserChange) onUserChange(newUser);
      setIsLoggingIn(false);
      SoundEngine.playBlessingChime();
    }, 600);
  };

  const handleLogout = () => {
    SoundEngine.playBambooKnock();
    localStorage.removeItem(STORAGE_KEY_USER);
    setCurrentUser(null);
    if (onUserChange) onUserChange(null);
  };

  const handleCopy = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-abyss/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-forest-deep border-2 border-warm-amber/60 rounded-3xl p-5 text-dongho-paper shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-bamboo-mid/30">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <h3 className="text-sm font-bold text-warm-glow">
              Hồ Sơ Người Bạn Rừng
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-dongho-paper/60 hover:text-dongho-paper hover:bg-forest-darker transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          {currentUser ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-forest-darker/90 border border-warm-amber/40 shadow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full border-2 border-warm-amber bg-forest-deep p-1 shadow"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-warm-glow truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-bamboo-soft/20 text-bamboo-soft font-semibold">
                      Google
                    </span>
                  </div>
                  <p className="text-[11px] text-dongho-paper/70 truncate flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-warm-amber/80" />
                    <span>{currentUser.email}</span>
                  </p>
                </div>
              </div>

              {/* Embedded Avalanche Wallet */}
              <div className="p-3.5 rounded-2xl bg-forest-darker/70 border border-bamboo-mid/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-warm-amber flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-warm-amber" />
                    <span>Ví Nhúng Avalanche (Fuji)</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-warm-amber/20 text-warm-amber font-mono font-bold">
                    0.50 AVAX
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-forest-deep border border-bamboo-mid/20 text-[10px] font-mono">
                  <span className="truncate mr-2 text-dongho-paper/80">
                    {currentUser.embeddedAddress}
                  </span>
                  <button
                    onClick={() => handleCopy(currentUser.embeddedAddress)}
                    className="p-1 rounded text-warm-amber hover:text-warm-glow shrink-0"
                    title="Sao chép địa chỉ ví"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-bamboo-soft" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[9px] text-dongho-paper/50 italic">
                  ☁️ Dữ liệu và Mầm Lực tự động lưu trữ và đồng bộ cùng Gmail của bạn.
                </p>
              </div>

              {/* Student Verification (.edu.vn) & Privileges */}
              <div className="p-3.5 rounded-2xl bg-forest-darker/90 border border-warm-amber/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-warm-glow flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-warm-amber" />
                    <span>Xác Thực Sinh Viên (.edu.vn)</span>
                  </span>
                  {currentUser.isStudent ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-bamboo-soft/20 text-bamboo-soft font-bold flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      <span>Đã xác thực</span>
                    </span>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-warm-amber/20 text-warm-amber font-medium">
                      Chưa kích hoạt
                    </span>
                  )}
                </div>

                {currentUser.isStudent ? (
                  <div className="space-y-2 pt-1">
                    <div className="p-2 rounded-xl bg-forest-deep border border-bamboo-mid/30 flex items-center justify-between text-[11px]">
                      <span className="text-dongho-paper/80 font-mono text-[10px] truncate">
                        🎓 {currentUser.studentEmail}
                      </span>
                      <span className="text-[9px] text-warm-amber font-bold shrink-0">Verified</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className="p-2 rounded-xl bg-forest-deep border border-warm-amber/30 text-warm-glow flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-warm-amber" />
                        <div>
                          <span className="font-bold block">Student Boost</span>
                          <span className="text-[9px] text-dongho-paper/60">x1.5 Mầm Lực</span>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-forest-deep border border-bamboo-soft/30 text-bamboo-soft flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-bamboo-soft" />
                        <div>
                          <span className="font-bold block">Khiên Mùa Thi</span>
                          <span className="text-[9px] text-dongho-paper/60">3 Khiên/Tháng</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 text-[11px]">
                    <p className="text-[10px] text-dongho-paper/70 leading-relaxed">
                      Nhận hệ số nhân x1.5 Mầm Lực và ưu đãi giảm 20% tại các quán cà phê Trạm Tre.
                    </p>
                    <div className="flex gap-1.5">
                      <input
                        type="email"
                        value={studentEduEmail}
                        onChange={(e) => setStudentEduEmail(e.target.value)}
                        placeholder="masv@hcmut.edu.vn"
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-forest-deep border border-bamboo-mid/40 text-[11px] text-dongho-paper placeholder:text-dongho-paper/40 focus:outline-none focus:border-warm-amber"
                      />
                      <button
                        onClick={() => handleVerifyStudent(studentEduEmail)}
                        disabled={isVerifyingStudent}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-[10px] transition shrink-0"
                      >
                        {isVerifyingStudent ? '...' : 'Xác thực'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-forest-darker hover:bg-forest-mist border border-dongho-red/40 text-dongho-paper/80 hover:text-dongho-red text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-3.5 h-3.5 text-dongho-red" />
                <span>Đăng xuất tài khoản Gmail</span>
              </button>
            </div>
          ) : (
            /* Log in state */
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-warm-amber to-warm-glow flex items-center justify-center text-2xl shadow-lg mb-2">
                  🎋
                </div>
                <h4 className="text-xs font-bold text-warm-glow">
                  Đăng nhập để giữ trọn vẹn kỷ niệm
                </h4>
                <p className="text-[11px] text-dongho-paper/70 mt-1 leading-relaxed">
                  Liên kết tài khoản Google giúp đồng bộ Măng Non của bạn trên mọi thiết bị và tự động mở ví Avalanche.
                </p>
              </div>

              {/* Primary Google Login Button */}
              <button
                onClick={() => handleGoogleLogin('nguyen.an@gmail.com')}
                disabled={isLoggingIn}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs shadow-xl flex items-center justify-center gap-2.5 transition active:scale-95"
              >
                {/* Google Multi-color G Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{isLoggingIn ? 'Đang kết nối Google...' : 'Tiếp tục với Google'}</span>
              </button>

              {/* Or enter personal Gmail */}
              <div className="pt-2">
                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-bamboo-mid/20 w-full" />
                  <span className="bg-forest-deep px-2 text-[10px] text-dongho-paper/50 uppercase tracking-wider">
                    hoặc nhập Gmail của bạn
                  </span>
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="tenban@gmail.com"
                    className="flex-1 px-3 py-2 rounded-xl bg-forest-darker border border-bamboo-mid/40 text-xs text-dongho-paper placeholder:text-dongho-paper/40 focus:outline-none focus:border-warm-amber"
                  />
                  <button
                    onClick={() => handleGoogleLogin(customEmail)}
                    disabled={!customEmail.trim() || isLoggingIn}
                    className="px-3.5 py-2 rounded-xl bg-warm-amber hover:bg-warm-glow text-forest-abyss font-bold text-xs transition disabled:opacity-40"
                  >
                    Vào
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-forest-darker/50 border border-bamboo-soft/20 text-[10px] text-dongho-paper/60 space-y-1">
                <p className="flex items-center gap-1 text-warm-amber font-semibold">
                  <ShieldCheck className="w-3 h-3 text-warm-amber" />
                  <span>An toàn &amp; Không áp lực</span>
                </p>
                <p>Măng Non không bao giờ gửi email làm phiền hay nhắc nhở streak.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

