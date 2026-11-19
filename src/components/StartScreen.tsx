import React, { useState } from 'react';
import {
  BookOpen,
  Heart,
  HelpCircle,
  PawPrint,
  Play,
  Settings,
  Sun,
  Sunset,
  Volume2,
  VolumeX,
  Wallet,
} from 'lucide-react';
import { SanctuaryPet, WalletState } from '../types';
import { CroppedPetCutout } from './CroppedPetCutout';
import {
  CrystalMintIcon,
  FarmhouseIllustration,
  PawCoinIcon,
} from './HandDrawnAssets';
import { FlameMiniIcon } from './GameIcons';
import { shortenAddress } from '../services/pawsApi';
import { useShowTextLabels, useSkyTheme } from './SharedHud';
import { playHappySound } from '../utils/appAudio';

interface StartScreenProps {
  keeperName: string;
  level: number;
  coins: number;
  streakDays: number;
  pets: SanctuaryPet[];
  passportsCount: number;
  hasSavedSession: boolean;
  soundEnabled: boolean;
  wallet: WalletState;
  onStartPlay: () => void;
  onOpenGallery: () => void;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onOpenWallet: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  keeperName,
  level,
  coins,
  streakDays,
  pets,
  passportsCount,
  hasSavedSession,
  soundEnabled,
  wallet,
  onStartPlay,
  onOpenGallery,
  onOpenGuide,
  onOpenSettings,
  onToggleSound,
  onOpenWallet,
}) => {
  const showLabels = useShowTextLabels();
  const { skyTheme, toggleSkyTheme } = useSkyTheme();
  const isSunset = skyTheme === 'sunset';
  const [petPopId, setPetPopId] = useState<string | null>(null);
  const hasPets = pets.length > 0;
  const petCount = pets.length;

  const triggerPetHeart = (petId: string) => {
    playHappySound();
    setPetPopId(petId);
    window.setTimeout(() => {
      setPetPopId((cur) => (cur === petId ? null : cur));
    }, 900);
  };

  const getPetSizeClass = (idx: number) => {
    if (petCount <= 3) {
      return petCount === 3 && idx === 1
        ? 'w-[84px] h-[84px]'
        : 'w-[74px] h-[74px]';
    }
    if (petCount === 4) return 'w-[66px] h-[66px]';
    if (petCount <= 6) return 'w-[56px] h-[56px]';
    return 'w-[48px] h-[48px]';
  };

  const petHatSize: 'sm' | 'md' = petCount >= 5 ? 'sm' : 'md';

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none flex flex-col justify-between transition-colors duration-500"
      style={{ backgroundColor: isSunset ? '#C6DD8F' : '#C5EEAA' }}
    >
      {/* SUNLIT / GOLDEN-HOUR STORYBOOK SKY & MEADOW BACKDROP */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-x-0 top-0 h-[44%] transition-all duration-500"
          style={{
            background: isSunset
              ? 'linear-gradient(180deg, #E2C1FF 0%, #FFD0CA 54%, #FFE7B5 100%)'
              : 'linear-gradient(180deg, #C7ECFF 0%, #EAF8FF 62%, #DDF8C8 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 top-[36%] bottom-0 transition-all duration-500"
          style={{
            background: isSunset
              ? 'radial-gradient(circle at 50% 35%, #EAF0B6 0%, #C6DD8F 58%, #A4C777 100%)'
              : 'radial-gradient(circle at 50% 35%, #DCF9BE 0%, #BBEBA0 58%, #A2DF7C 100%)',
          }}
        />

        {/* Smiling Pastel Sun & Drifting Fluffy Clouds */}
        <svg
          viewBox="0 0 400 150"
          className="absolute top-4 left-0 w-full h-32 opacity-95"
          fill="none"
          aria-hidden="true"
        >
          {/* Twinkling Dusk Stars in Sunset Mode */}
          {isSunset && (
            <g className="animate-petal-twinkle">
              <circle cx="96" cy="22" r="2.2" fill="#FFF8DC" />
              <circle cx="144" cy="14" r="1.6" fill="#FFFDF9" />
              <circle cx="268" cy="18" r="2.1" fill="#FFF8DC" />
              <circle cx="322" cy="26" r="1.6" fill="#FFFDF9" />
            </g>
          )}
          {/* Warm Sun Glow + Smiling Sun */}
          <g transform={isSunset ? 'translate(200, 56)' : 'translate(200, 44)'}>
            <circle
              cx="0"
              cy="0"
              r={isSunset ? 34 : 28}
              fill={isSunset ? '#FFD7B5' : '#FFF5C2'}
              opacity={isSunset ? '0.62' : '0.55'}
            />
            <circle
              cx="0"
              cy="0"
              r="18"
              fill={isSunset ? '#FFBC91' : '#FFE794'}
              stroke={isSunset ? '#E0866B' : '#E5B95C'}
              strokeWidth="1.8"
            />
            <circle cx="-5.5" cy="-1.5" r="1.6" fill="#6E5448" />
            <circle cx="5.5" cy="-1.5" r="1.6" fill="#6E5448" />
            <ellipse cx="-8.5" cy="2" rx="2.4" ry="1.3" fill="#FF8DB4" opacity="0.85" />
            <ellipse cx="8.5" cy="2" rx="2.4" ry="1.3" fill="#FF8DB4" opacity="0.85" />
            <path d="M-2.8 2.5C-1.2 4.5 1.2 4.5 2.8 2.5" stroke="#6E5448" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <g className="animate-cloud-drift">
            <path
              d="M34 66C26 66 20 60 20 52C20 45 25 39 32 38C36 28 47 23 58 26C65 20 78 22 83 31C91 31 98 38 98 46C98 57 89 66 78 66H34Z"
              fill={isSunset ? '#FFF1E8' : '#FFFDF9'}
            />
            <path
              d="M286 56C279 56 274 51 274 45C274 39 278 34 284 33C288 24 299 21 308 25C315 19 327 21 332 30C339 31 345 37 345 44C345 51 339 56 332 56H286Z"
              fill={isSunset ? '#FFF1E8' : '#FFFDF9'}
            />
          </g>
        </svg>

        {/* Sunlit Meadow Path, 5-Petal Daisies & Grass Tufts */}
        <svg
          viewBox="0 0 390 660"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <ellipse
            cx="195"
            cy="365"
            rx="168"
            ry="128"
            fill={isSunset ? '#FFF3CC' : '#F0FFDA'}
            opacity="0.55"
          />
          {[
            { x: 46, y: 344, c: '#FFFDF9' },
            { x: 64, y: 360, c: '#FFB3CF' },
            { x: 334, y: 338, c: '#FFE48C' },
            { x: 320, y: 412, c: '#FFFDF9' },
            { x: 70, y: 428, c: '#FFB3CF' },
            { x: 348, y: 378, c: '#C7E9FF' },
          ].map((f, idx) => (
            <g key={idx} transform={`translate(${f.x}, ${f.y})`}>
              <circle cx="0" cy="-4.2" r="3.1" fill={f.c} />
              <circle cx="4" cy="-1.3" r="3.1" fill={f.c} />
              <circle cx="2.5" cy="3.4" r="3.1" fill={f.c} />
              <circle cx="-2.5" cy="3.4" r="3.1" fill={f.c} />
              <circle cx="-4" cy="-1.3" r="3.1" fill={f.c} />
              <circle cx="0" cy="0" r="2.2" fill="#FFD45E" />
            </g>
          ))}
          {[
            { x: 96, y: 336 },
            { x: 294, y: 344 },
            { x: 42, y: 400 },
            { x: 344, y: 442 },
          ].map((g, i) => (
            <path
              key={i}
              d={`M${g.x - 4} ${g.y}Q${g.x - 2} ${g.y - 7} ${g.x - 6} ${g.y - 8}M${g.x} ${g.y}V${g.y - 8}M${g.x + 4} ${g.y}Q${g.x + 2} ${g.y - 7} ${g.x + 6} ${g.y - 8}`}
              stroke={isSunset ? '#86B463' : '#7EC667'}
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.7"
            />
          ))}
        </svg>
      </div>

      {/* TOP UTILITY STRIP (Sound + Sky Theme on left, Wallet + Top-Right Settings on right) */}
      <header className="relative z-20 px-4 pt-3.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="cream-pill rounded-full w-10 h-10 flex items-center justify-center text-[#4B3C46] active:scale-95 transition-transform cursor-pointer"
            title={soundEnabled ? 'Sound On' : 'Sound Muted'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4.5 h-4.5 stroke-[2.3]" />
            ) : (
              <VolumeX className="w-4.5 h-4.5 stroke-[2.3] text-[#8A747E]" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleSkyTheme}
            aria-label={
              isSunset
                ? 'Switch to Sunny Morning sky'
                : 'Switch to Golden Hour Sunset sky'
            }
            title={isSunset ? 'Golden Sunset (tap for Morning)' : 'Sunny Morning (tap for Sunset)'}
            className={`cream-pill rounded-full ${
              showLabels ? 'px-3' : 'w-10 justify-center'
            } h-10 flex items-center gap-1.5 font-display text-[12px] font-extrabold active:scale-95 transition-transform cursor-pointer whitespace-nowrap ${
              isSunset
                ? 'bg-[#FFE7D6] text-[#C95E45]'
                : 'bg-[#FFF8D8] text-[#C88A1E]'
            }`}
          >
            {isSunset ? (
              <Sunset className="w-4.5 h-4.5 stroke-[2.3]" />
            ) : (
              <Sun className="w-4.5 h-4.5 stroke-[2.3]" />
            )}
            {showLabels && <span>{isSunset ? 'Sunset' : 'Morning'}</span>}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenWallet}
            aria-label="Connect Core Wallet"
            title="Core Wallet"
            className={`cream-pill rounded-full ${
              showLabels || wallet.connected ? 'px-3' : 'w-10 justify-center'
            } h-10 flex items-center gap-1.5 font-display text-[12px] font-extrabold active:scale-95 transition-transform cursor-pointer whitespace-nowrap ${
              wallet.connected
                ? 'bg-[#E8F8EC] text-[#3F7B52]'
                : 'bg-[#FFFDF9] text-[#4B3C46]'
            }`}
          >
            <Wallet className="w-4 h-4 stroke-[2.3]" />
            {(showLabels || wallet.connected) && (
              <span className="tabular-nums">
                {wallet.connected ? shortenAddress(wallet.address) : 'Wallet'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open Settings"
            title="Settings & Guide"
            className="cream-pill rounded-full w-10 h-10 flex items-center justify-center text-[#4B3C46] active:scale-95 transition-transform cursor-pointer"
          >
            <Settings className="w-4.5 h-4.5 stroke-[2.3]" />
          </button>
        </div>
      </header>

      {/* CENTER HERO + ELEVATED ONE-HANDED ACTION DECK */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center px-5 pb-14 sm:pb-10 text-center gap-4">
        {/* Title Lockup with Tiny Pastel Blossoms */}
        <div className="space-y-0.5">
          <div className="inline-flex items-center justify-center gap-2">
            <svg viewBox="0 0 22 22" className="w-4.5 h-4.5 animate-petal-twinkle shrink-0" fill="none" aria-hidden="true">
              <circle cx="11" cy="6" r="3.4" fill="#FFA6C9" />
              <circle cx="15.8" cy="9.5" r="3.4" fill="#FFA6C9" />
              <circle cx="14" cy="15" r="3.4" fill="#FFA6C9" />
              <circle cx="8" cy="15" r="3.4" fill="#FFA6C9" />
              <circle cx="6.2" cy="9.5" r="3.4" fill="#FFA6C9" />
              <circle cx="11" cy="11" r="2.6" fill="#FFE07D" />
            </svg>
            <h1
              className="font-display text-[32px] sm:text-[35px] font-extrabold text-[#4B3C46] leading-tight tracking-tight"
              style={{
                textWrap: 'balance',
                textShadow: '0 2.5px 0 rgba(255, 253, 249, 0.96), 0 4px 12px rgba(255, 166, 201, 0.25)',
              }}
            >
              Paws &amp; Picket
            </h1>
            <svg viewBox="0 0 22 22" className="w-4.5 h-4.5 animate-petal-twinkle shrink-0" style={{ animationDelay: '1.1s' }} fill="none" aria-hidden="true">
              <circle cx="11" cy="6" r="3.4" fill="#FFE07D" />
              <circle cx="15.8" cy="9.5" r="3.4" fill="#FFE07D" />
              <circle cx="14" cy="15" r="3.4" fill="#FFE07D" />
              <circle cx="8" cy="15" r="3.4" fill="#FFE07D" />
              <circle cx="6.2" cy="9.5" r="3.4" fill="#FFE07D" />
              <circle cx="11" cy="11" r="2.6" fill="#FFFDF9" />
            </svg>
          </div>
          {showLabels && (
            <p className="text-[12.5px] font-bold text-[#6E5C66]">
              Pet Sanctuary · Crop Farm · On-Chain Passports
            </p>
          )}
        </div>

        {/* Storybook Gate Scene: All Sanctuary Pets OR Centered Farmhouse */}
        <div className="relative w-full max-w-[336px] min-h-[172px] flex items-end justify-center">
          {/* Background Farmhouse when pets are shown; Centered Hero Farmhouse when no pets */}
          {hasPets ? (
            <div className="absolute left-3 top-0 w-[100px] h-[84px] opacity-95 pointer-events-none">
              <FarmhouseIllustration className="w-full h-full" />
            </div>
          ) : (
            <div className="relative z-10 mb-5 w-[168px] h-[142px] pointer-events-none">
              <FarmhouseIllustration className="w-full h-full" />
            </div>
          )}

          {/* Lucky Butterfly */}
          <div className="absolute right-7 top-2 animate-butterfly pointer-events-none">
            <svg viewBox="0 0 28 24" className="w-7 h-7" fill="none" aria-hidden="true">
              <path d="M14 12C9 4 2 6 4 13C5 16 10 15 14 12Z" fill="#FFE07D" stroke="#A6826E" strokeWidth="1.8" />
              <path d="M14 12C19 4 26 6 24 13C23 16 18 15 14 12Z" fill="#FFE07D" stroke="#A6826E" strokeWidth="1.8" />
              <line x1="14" y1="8" x2="14" y2="18" stroke="#4B3C46" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>

          {/* White Painted Picket Fence with Tiny Flower Accents */}
          <div className="absolute inset-x-2 bottom-7 h-7 flex items-end justify-between pointer-events-none">
            <div className="absolute inset-x-1 bottom-2 h-2.5 bg-[#F6ECE3] border-2 border-[#D4B8A5] rounded-full" />
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="relative w-3.5 h-7 bg-[#FFFDF9] border-2 border-[#D4B8A5] rounded-t-full shadow-[inset_0_-2px_0_#F2E6DC]"
              />
            ))}
          </div>

          {/* All Sanctuary Pets Showcase (Tappable for cute hearts!) */}
          {hasPets && (
            <div
              className={`relative z-10 flex flex-wrap items-end justify-center pb-0.5 ${
                petCount <= 3
                  ? 'gap-2'
                  : petCount === 4
                  ? 'gap-1'
                  : 'gap-x-0.5 gap-y-0'
              }`}
            >
              {pets.map((pet, idx) => {
                const isPopping = petPopId === pet.id;
                return (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => triggerPetHeart(pet.id)}
                    aria-label={`Say hi to ${pet.name}`}
                    className={`relative flex flex-col items-center cursor-pointer focus:outline-none active:scale-110 transition-transform ${
                      isPopping ? 'animate-pet-happy' : 'animate-pet-hop'
                    }`}
                    style={{ animationDelay: isPopping ? '0s' : `${(idx % 6) * 0.28}s` }}
                  >
                    {isPopping && (
                      <div className="pointer-events-none absolute -top-2 left-1/2 z-30 animate-heart-float flex items-center gap-0.5">
                        <Heart className="w-4 h-4 fill-[#FF85A1] text-[#FF85A1] drop-shadow-xs" />
                        <Heart className="w-3 h-3 fill-[#FFE07D] text-[#E5B95C] -mt-2" />
                      </div>
                    )}
                    <CroppedPetCutout
                      photoUrl={pet.photoUrl}
                      alt={pet.name}
                      mode={pet.cutoutMode ?? 'auto'}
                      accessory={pet.accessory}
                      hatTransform={pet.hatTransform}
                      hatSize={petHatSize}
                      flip={idx % 2 === 1 && petCount > 1 && idx === petCount - 1}
                      className={getPetSizeClass(idx)}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ELEVATED ONE-HANDED ACTION DECK (Thumb Sweet Spot) */}
        <div className="w-full max-w-[348px] flex flex-col gap-2.5 text-left">
          {/* Keeper Save Summary Card */}
          <div className="cream-card px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-display text-[14px] font-extrabold text-[#4B3C46] truncate">
                {showLabels
                  ? `${keeperName}’s Sanctuary · Lv.${level}`
                  : `${keeperName} · Lv.${level}`}
              </div>
              <div className="text-[11.5px] font-bold text-[#8A747E] tabular-nums truncate">
                {showLabels ? (
                  `${pets.length} Pets · ${passportsCount} Passports · ${streakDays}d Streak`
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-0.5">
                      <PawPrint className="w-3.5 h-3.5 text-[#C99D66] shrink-0" />
                      {pets.length}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <CrystalMintIcon className="w-3.5 h-3.5 shrink-0" />
                      {passportsCount}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <FlameMiniIcon className="w-3.5 h-3.5 shrink-0" />
                      {streakDays}d
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <PawCoinIcon className="w-5 h-5" />
              <span className="font-display text-[14px] font-extrabold text-[#4B3C46] tabular-nums">
                {coins.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={onStartPlay}
            aria-label={hasSavedSession ? 'Continue Sanctuary' : 'Start Playing'}
            className="buttercup-cta w-full rounded-full min-h-[56px] px-6 font-display text-[16px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play
              className={`${
                showLabels ? 'w-4.5 h-4.5' : 'w-7 h-7'
              } fill-[#4B3C46]`}
            />
            {showLabels && (
              <span>
                {hasSavedSession ? 'Continue Sanctuary' : 'Start Playing'}
              </span>
            )}
          </button>

          {/* Secondary Navigation Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onOpenGallery}
              aria-label="Passports"
              title="Passports"
              className="cream-btn rounded-2xl min-h-[50px] px-3 flex items-center justify-center gap-1.5 font-display text-[12.5px] font-extrabold text-[#4B3C46] cursor-pointer whitespace-nowrap"
            >
              <BookOpen
                className={`${showLabels ? 'w-4 h-4' : 'w-5 h-5'} shrink-0`}
              />
              {showLabels && <span>Passports</span>}
            </button>

            <button
              type="button"
              onClick={onOpenGuide}
              aria-label="How to Play"
              title="How to Play"
              className="cream-btn rounded-2xl min-h-[50px] px-3 flex items-center justify-center gap-1.5 font-display text-[12.5px] font-extrabold text-[#4B3C46] cursor-pointer whitespace-nowrap"
            >
              <HelpCircle
                className={`${showLabels ? 'w-4 h-4' : 'w-5 h-5'} shrink-0`}
              />
              {showLabels && <span>How to Play</span>}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
