'use client';

import React, { useState } from 'react';
import { Mangnon, AppSettings } from '@/lib/app-state';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Bell,
  Sparkles,
  Trash2,
  Check,
  Edit2,
  Info,
  ShieldAlert,
  PlaySquare,
  User,
} from 'lucide-react';
import UserProfileModal, { UserAccount } from '@/components/UserProfileModal';

interface S13SettingsProps {
  mangnon: Mangnon | null;
  settings: AppSettings;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  onRenameMangnon: (newName: string) => void;
  onResetAllData: () => void;
  onBack: () => void;
}

export default function S13Settings({
  mangnon,
  settings,
  onUpdateSettings,
  onRenameMangnon,
  onResetAllData,
  onBack,
}: S13SettingsProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(mangnon?.name || 'Măng');
  const [showLore, setShowLore] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('mangnon_user_account');
    if (stored) {
      try {
        setUserAccount(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Two-step reset state
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [confirmNameInput, setConfirmNameInput] = useState('');

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    SoundEngine.playBambooKnock();
    onRenameMangnon(nameInput.trim());
    setIsRenaming(false);
  };

  const handleToggleSound = () => {
    const nextSound = !settings.soundOn;
    SoundEngine.setMuted(!nextSound);
    if (nextSound) SoundEngine.playBambooKnock();
    onUpdateSettings((prev) => ({ ...prev, soundOn: nextSound }));
  };

  const handleToggleReminder = () => {
    SoundEngine.playBambooKnock();
    onUpdateSettings((prev) => ({ ...prev, reminderOn: !prev.reminderOn }));
  };

  const handleToggleReducedMotion = () => {
    SoundEngine.playBambooKnock();
    onUpdateSettings((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const handleToggleDemoMode = () => {
    SoundEngine.playBambooKnock();
    onUpdateSettings((prev) => ({ ...prev, demoMode: !prev.demoMode }));
  };

  const handleExecuteReset = () => {
    SoundEngine.playWaterSplash();
    onResetAllData();
  };

  return (
    <div className="relative w-full h-full bg-[#1B2A2F] text-dongho-paper flex flex-col justify-between overflow-hidden select-none">
      {/* Top Header */}
      <div className="pt-10 pb-3 px-4 flex items-center justify-between border-b border-bamboo-mid/25 bg-forest-darker/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Quay lại"
            className="p-1.5 rounded-xl text-dongho-paper/70 hover:text-warm-glow hover:bg-forest-deep transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-bold text-warm-glow">
            {content.s13_settings.title}
          </h2>
        </div>
      </div>

      {/* Main Settings List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
        {/* Google User Profile Card */}
        <div className="p-4 rounded-2xl bg-forest-darker/90 border border-warm-amber/40 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {userAccount ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={userAccount.avatarUrl}
                  alt={userAccount.name}
                  className="w-10 h-10 rounded-full border border-warm-amber bg-forest-deep p-0.5"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-forest-deep border border-bamboo-soft/40 flex items-center justify-center text-lg">
                  👤
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-warm-glow block">
                  {userAccount ? userAccount.name : 'Tài khoản Google'}
                </span>
                <span className="text-[10px] text-dongho-paper/60 block">
                  {userAccount ? userAccount.email : 'Chưa liên kết Gmail'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowUserModal(true)}
              className="px-3 py-1.5 rounded-xl bg-forest-deep hover:bg-forest-mist border border-warm-amber/40 text-warm-glow text-xs font-semibold transition"
            >
              {userAccount ? 'Quản lý' : 'Đăng nhập'}
            </button>
          </div>
        </div>

        {/* Rename section */}
        {mangnon && (
          <div className="p-4 rounded-2xl bg-forest-darker/90 border border-bamboo-soft/30">
            <span className="text-[11px] font-semibold text-dongho-paper/70 block mb-2">
              {content.s13_settings.rename}
            </span>
            {isRenaming ? (
              <form onSubmit={handleSaveName} className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-forest-abyss border border-warm-amber text-warm-glow outline-none text-xs"
                />
                <button
                  type="submit"
                  className="px-3 rounded-xl bg-warm-amber text-forest-abyss font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-bold text-warm-glow text-sm">{mangnon.name}</span>
                <button
                  onClick={() => setIsRenaming(true)}
                  className="p-1 text-dongho-paper/60 hover:text-warm-amber transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Toggles */}
        <div className="p-4 rounded-2xl bg-forest-darker/90 border border-bamboo-soft/30 space-y-3.5">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {settings.soundOn ? (
                <Volume2 className="w-4 h-4 text-warm-glow" />
              ) : (
                <VolumeX className="w-4 h-4 text-dongho-paper/40" />
              )}
              <span>{content.s13_settings.sound}</span>
            </div>
            <button
              onClick={handleToggleSound}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.soundOn ? 'bg-warm-amber' : 'bg-forest-deep'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.soundOn ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Gentle Reminder Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-warm-amber" />
              <div>
                <span>{content.s13_settings.reminder}</span>
                <p className="text-[10px] text-dongho-paper/50">Mặc định tắt, tối đa 1 lần/ngày</p>
              </div>
            </div>
            <button
              onClick={handleToggleReminder}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.reminderOn ? 'bg-warm-amber' : 'bg-forest-deep'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.reminderOn ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-bamboo-soft" />
              <span>{content.s13_settings.reducedMotion}</span>
            </div>
            <button
              onClick={handleToggleReducedMotion}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.reducedMotion ? 'bg-warm-amber' : 'bg-forest-deep'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Demo Mode Toggle */}
          <div className="flex items-center justify-between pt-1 border-t border-bamboo-mid/20">
            <div className="flex items-center gap-2.5">
              <PlaySquare className="w-4 h-4 text-warm-amber" />
              <div>
                <span>{content.s13_settings.demoModeToggle}</span>
                <p className="text-[10px] text-dongho-paper/50">Hiện nút tròn S14 ở góc</p>
              </div>
            </div>
            <button
              onClick={handleToggleDemoMode}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.demoMode ? 'bg-warm-amber' : 'bg-forest-deep'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.demoMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Lore Intro Button */}
        <button
          onClick={() => setShowLore(true)}
          className="w-full p-3.5 rounded-2xl bg-forest-darker/90 border border-bamboo-soft/30 hover:border-warm-amber flex items-center justify-between transition text-left"
        >
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-warm-glow" />
            <span className="font-semibold text-dongho-paper">
              {content.s13_settings.loreIntro}
            </span>
          </div>
          <span className="text-[11px] text-warm-amber">Đọc</span>
        </button>

        {/* Clear All Data Button */}
        <div className="pt-4">
          <button
            onClick={() => setResetStep(1)}
            className="w-full py-3 rounded-2xl bg-forest-darker border border-dongho-red/40 hover:border-dongho-red text-dongho-pink text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>{content.s13_settings.clearData}</span>
          </button>
        </div>
      </div>

      {/* Lore Introduction Modal */}
      {showLore && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-forest-abyss/85 backdrop-blur-md">
          <div className="w-full max-w-xs bg-forest-deep border-2 border-warm-amber/60 rounded-3xl p-6 text-dongho-paper shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-warm-glow flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-warm-amber" />
              Thế Giới Măng Non
            </h3>
            <p className="text-xs text-dongho-paper/85 leading-relaxed">
              {content.common.loreQuote}
            </p>
            <p className="text-[11px] text-dongho-paper/70 leading-relaxed">
              Măng Non là nơi cậu trú ngụ tâm hồn, không chấm điểm, không thúc ép. Mọi điều cậu kể đều nuôi lớn sinh linh và cùng thắp sáng Cây Đa Làng Phù Đổng.
            </p>
            <button
              onClick={() => setShowLore(false)}
              className="w-full py-2.5 rounded-xl bg-warm-amber text-forest-abyss font-bold text-xs"
            >
              {content.common.close}
            </button>
          </div>
        </div>
      )}

      {/* TWO-STEP RESET CONFIRMATION MODAL */}
      {resetStep === 1 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-forest-abyss/85 backdrop-blur-md">
          <div className="w-full max-w-xs bg-forest-deep border-2 border-dongho-red/70 rounded-3xl p-6 text-dongho-paper shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-dongho-pink">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="text-xs font-bold">Xác nhận bước 1</h4>
            </div>
            <p className="text-xs text-dongho-paper/90 leading-relaxed">
              {content.s13_settings.clearDataConfirm1}
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setResetStep(0)}
                className="flex-1 py-2.5 rounded-xl bg-forest-darker border border-bamboo-soft/40 text-xs text-dongho-paper/70 hover:text-dongho-paper"
              >
                {content.common.cancel}
              </button>
              <button
                onClick={() => setResetStep(2)}
                className="flex-1 py-2.5 rounded-xl bg-dongho-red hover:bg-dongho-red/90 text-white font-bold text-xs shadow"
              >
                {content.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {resetStep === 2 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-forest-abyss/85 backdrop-blur-md">
          <div className="w-full max-w-xs bg-forest-deep border-2 border-dongho-red rounded-3xl p-6 text-dongho-paper shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-dongho-pink">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="text-xs font-bold">Xác nhận bước 2</h4>
            </div>
            <p className="text-xs text-dongho-paper/90 leading-relaxed">
              {content.s13_settings.clearDataConfirm2} <strong className="text-warm-glow">{mangnon?.name || 'Măng'}</strong>
            </p>
            <input
              type="text"
              value={confirmNameInput}
              onChange={(e) => setConfirmNameInput(e.target.value)}
              placeholder="Gõ tên để xác nhận"
              className="w-full py-2 px-3 rounded-xl bg-forest-darker border border-dongho-red text-xs text-dongho-paper outline-none"
            />
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  setResetStep(0);
                  setConfirmNameInput('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-forest-darker border border-bamboo-soft/40 text-xs text-dongho-paper/70 hover:text-dongho-paper"
              >
                {content.common.cancel}
              </button>
              <button
                disabled={confirmNameInput.trim().toLowerCase() !== (mangnon?.name || 'măng').toLowerCase()}
                onClick={handleExecuteReset}
                className="flex-1 py-2.5 rounded-xl bg-dongho-red disabled:opacity-40 hover:bg-dongho-red/90 text-white font-bold text-xs shadow"
              >
                Xoá hết
              </button>
            </div>
          </div>
        </div>
      )}
      {/* User Profile / Google Modal */}
      <UserProfileModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onUserChange={(u) => setUserAccount(u)}
      />
    </div>
  );
}

