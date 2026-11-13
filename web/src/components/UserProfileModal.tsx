'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Wallet,
  Copy,
  Check,
  LogOut,
  X,
  Sparkles,
  ExternalLink,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { SoundEngine } from '@/lib/sound-engine';
import {
  getFujiProvider,
  connectInjectedWallet,
  getOrCreateEmbeddedWallet,
} from '@/lib/avalanche-contracts';
import { ethers } from 'ethers';

export interface UserAccount {
  email: string;
  name: string;
  avatarUrl?: string;
  embeddedAddress: string;
  walletType?: 'embedded' | 'injected';
  provider: 'google' | 'guest' | 'injected' | 'embedded';
  connectedAt: string;
  isStudent?: boolean;
  studentEmail?: string;
  studentBoost?: number;
  shieldsCount?: number;
  dewdrops: number; // 💧 Giọt Sương credits (mặc định 100)
}

const STORAGE_KEY_USER = 'mangnon_user_account';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChange?: (user: UserAccount | null) => void;
  villageLeaves?: number;
  dewdrops?: number;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  onUserChange,
  villageLeaves = 310,
  dewdrops = 100,
}: UserProfileModalProps) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [copied, setCopied] = useState(false);
  const [avaxBalance, setAvaxBalance] = useState<string>('0.000');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isSwitchingWallet, setIsSwitchingWallet] = useState(false);
  const [studentEduEmail, setStudentEduEmail] = useState('');
  const [isVerifyingStudent, setIsVerifyingStudent] = useState(false);

  // Load user from localStorage
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

  // Fetch real Fuji AVAX balance
  useEffect(() => {
    if (!currentUser?.embeddedAddress) return;
    let isCancelled = false;

    const fetchBalance = async () => {
      setIsLoadingBalance(true);
      try {
        const provider = getFujiProvider();
        const bal = await provider.getBalance(currentUser.embeddedAddress);
        if (!isCancelled) {
          const formatted = parseFloat(ethers.formatEther(bal)).toFixed(4);
          setAvaxBalance(formatted);
        }
      } catch (e) {
        console.warn('Failed to fetch Fuji balance:', e);
        if (!isCancelled) setAvaxBalance('0.000');
      } finally {
        if (!isCancelled) setIsLoadingBalance(false);
      }
    };

    fetchBalance();
    return () => {
      isCancelled = true;
    };
  }, [currentUser?.embeddedAddress]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopied(true);
      SoundEngine.playBambooKnock();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    SoundEngine.playBambooKnock();
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem('mangnon_wallet_type');
    setCurrentUser(null);
    if (onUserChange) onUserChange(null);
    onClose();
  };

  const handleSwitchToInjected = async () => {
    setIsSwitchingWallet(true);
    SoundEngine.playBambooKnock();
    try {
      const session = await connectInjectedWallet();
      localStorage.setItem('mangnon_wallet_type', 'injected');
      const updatedUser: UserAccount = {
        ...(currentUser || {
          email: 'user@avax.fuji',
          name: 'Avalanche Scholar',
          connectedAt: new Date().toISOString(),
          dewdrops: 100,
          provider: 'injected',
        }),
        embeddedAddress: session.address,
        walletType: 'injected',
        provider: 'injected',
      };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      if (onUserChange) onUserChange(updatedUser);
      SoundEngine.playBlessingChime();
    } catch (err: any) {
      alert(err.message || 'Không thể kết nối Ví Web3.');
    } finally {
      setIsSwitchingWallet(false);
    }
  };

  const handleSwitchToEmbedded = () => {
    setIsSwitchingWallet(true);
    SoundEngine.playBambooKnock();
    try {
      const { wallet } = getOrCreateEmbeddedWallet();
      localStorage.setItem('mangnon_wallet_type', 'embedded');
      const updatedUser: UserAccount = {
        ...(currentUser || {
          email: 'hoc.gia@mangnon.vn',
          name: 'Học Giả Măng Non',
          connectedAt: new Date().toISOString(),
          dewdrops: 100,
          provider: 'embedded',
        }),
        embeddedAddress: wallet.address,
        walletType: 'embedded',
        provider: 'embedded',
      };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      if (onUserChange) onUserChange(updatedUser);
      SoundEngine.playBlessingChime();
    } catch (err: any) {
      alert('Lỗi tạo ví ẩn.');
    } finally {
      setIsSwitchingWallet(false);
    }
  };

  const handleVerifyStudent = () => {
    if (!currentUser) return;
    setIsVerifyingStudent(true);
    SoundEngine.playBambooKnock();

    setTimeout(() => {
      const email = studentEduEmail.trim() || 'hoc.vien@daihoc.edu.vn';
      const updatedUser: UserAccount = {
        ...currentUser,
        isStudent: true,
        studentEmail: email,
        studentBoost: 1.5,
      };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      if (onUserChange) onUserChange(updatedUser);
      setIsVerifyingStudent(false);
      SoundEngine.playBlessingChime();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191B1D]/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#F4EEDD] border-[3px] border-[#26292B] shadow-[5px_5px_0px_#26292B] rounded-2xl p-5 text-[#26292B]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#26292B]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎋</span>
            <div>
              <h3 className="text-sm font-black text-[#26292B] uppercase tracking-wide">
                Túi Gấm Học Giả
              </h3>
              <p className="text-[10px] text-[#5C4D43]">Hồ sơ định danh &amp; Ví Avalanche Fuji</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border-2 border-[#26292B] bg-[#CFA85B] hover:bg-[#b8954f] text-[#26292B] shadow-[2px_2px_0px_#26292B] transition active:translate-x-[1px] active:translate-y-[1px]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {currentUser ? (
          <div className="mt-3.5 space-y-3">
            {/* Identity badge */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#EDE5D2] border-2 border-[#26292B] shadow-[2px_2px_0px_#26292B]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=mangnon'}
                alt={currentUser.name}
                className="w-11 h-11 rounded-full border-2 border-[#26292B] bg-[#CFA85B] p-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs text-[#26292B] truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-black border border-[#26292B] bg-[#CFA85B] text-[#26292B]">
                    {currentUser.walletType === 'injected' ? '🦊 Core/MetaMask' : '🌱 Ví Ẩn AES'}
                  </span>
                </div>
                <div className="text-[10px] text-[#5C4D43] truncate mt-0.5">
                  {currentUser.email}
                </div>
              </div>
            </div>

            {/* Wallet on Avalanche Fuji */}
            <div className="p-3 rounded-xl bg-[#EDE5D2] border-2 border-[#26292B] shadow-[2px_2px_0px_#26292B] space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black">
                <span className="flex items-center gap-1 text-[#26292B]">
                  <Wallet className="w-3.5 h-3.5 text-[#A84D3D]" />
                  <span>VÍ AVALANCHE FUJI (C-CHAIN)</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#F4EEDD] border border-[#26292B] text-[#A84D3D] font-mono">
                  {isLoadingBalance ? '...' : `${avaxBalance} AVAX`}
                </span>
              </div>

              {/* Address bar */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F4EEDD] border border-[#26292B] text-[10px] font-mono">
                <span className="truncate mr-2 text-[#26292B] select-all">
                  {currentUser.embeddedAddress}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(currentUser.embeddedAddress)}
                    className="p-1 rounded bg-[#EDE5D2] border border-[#26292B] text-[#26292B] hover:bg-[#CFA85B]"
                    title="Sao chép địa chỉ ví"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#5A6544]" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <a
                    href={`https://testnet.snowtrace.io/address/${currentUser.embeddedAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded bg-[#EDE5D2] border border-[#26292B] text-[#26292B] hover:bg-[#CFA85B]"
                    title="Tra cứu trên Snowtrace Testnet"
                  >
                    <ExternalLink className="w-3 h-3 text-[#26292B]" />
                  </a>
                </div>
              </div>
            </div>

            {/* In-game Tokens Grid */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-xl bg-[#EDE5D2] border-2 border-[#26292B] shadow-[2px_2px_0px_#26292B]">
                <div className="text-[10px] font-bold text-[#5C4D43] flex items-center justify-center gap-1">
                  <span>💧</span>
                  <span>Giọt Sương</span>
                </div>
                <div className="text-base font-black text-[#26292B] mt-0.5">
                  {currentUser.dewdrops ?? dewdrops} 💧
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[#EDE5D2] border-2 border-[#26292B] shadow-[2px_2px_0px_#26292B]">
                <div className="text-[10px] font-bold text-[#5C4D43] flex items-center justify-center gap-1">
                  <span>🍃</span>
                  <span>Mầm Lực</span>
                </div>
                <div className="text-base font-black text-[#5A6544] mt-0.5">
                  {villageLeaves} 🍃
                </div>
              </div>
            </div>

            {/* Switch Wallet Mode Button */}
            <div className="pt-1">
              {currentUser.walletType === 'embedded' ? (
                <button
                  onClick={handleSwitchToInjected}
                  disabled={isSwitchingWallet}
                  className="w-full py-2 px-3 rounded-xl bg-[#A84D3D] hover:bg-[#934233] text-white font-black text-[11px] border-2 border-[#26292B] shadow-[2px_2px_0px_#26292B] flex items-center justify-center gap-1.5 transition"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Chuyển sang Kết Nối Ví Core / MetaMask</span>
                </button>
              ) : (
                <button
                  onClick={handleSwitchToEmbedded}
                  disabled={isSwitchingWallet}
                  className="w-full py-2 px-3 rounded-xl bg-[#5A6544] hover:bg-[#4C563A] text-[#F4EEDD] font-black text-[11px] border-2 border-[#26292B] shadow-[2px_2px_0px_#26292B] flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Chuyển sang Dùng Ví Ẩn Nội Bộ (AES-CTR)</span>
                </button>
              )}
            </div>

            {/* Student Verification */}
            {!currentUser.isStudent ? (
              <div className="p-2.5 rounded-xl bg-[#DCE5DC] border border-[#5A6544]/40 text-[10px] space-y-1.5">
                <div className="flex items-center gap-1 font-black text-[#5A6544]">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Xác nhận Học Giả Sinh Viên (+50% Mầm Lực)</span>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    value={studentEduEmail}
                    onChange={(e) => setStudentEduEmail(e.target.value)}
                    placeholder="email@truong.edu.vn"
                    className="flex-1 px-2 py-1 text-[10px] rounded border border-[#26292B] bg-[#F4EEDD] outline-none"
                  />
                  <button
                    onClick={handleVerifyStudent}
                    disabled={isVerifyingStudent}
                    className="px-2 py-1 rounded bg-[#5A6544] text-[#F4EEDD] font-bold text-[9px] border border-[#26292B]"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-[#DCE5DC] border border-[#5A6544] text-[10px] text-[#5A6544] font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Đã kích hoạt Đặc quyền Học Giả Sinh Viên (1.5x)</span>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full py-2 rounded-xl bg-transparent hover:bg-[#A84D3D]/10 text-[#A84D3D] font-black text-xs border border-[#A84D3D]/40 flex items-center justify-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất / Ngắt kết nối</span>
            </button>
          </div>
        ) : (
          <div className="py-6 text-center space-y-3">
            <p className="text-xs text-[#5C4D43]">Chưa kết nối Túi Gấm Học Giả.</p>
            <button
              onClick={onClose}
              className="btn-woodblock px-4 py-2 text-xs font-black"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
