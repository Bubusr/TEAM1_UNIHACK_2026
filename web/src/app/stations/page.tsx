'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { Station } from '@/lib/types';
import { SoundEngine } from '@/lib/sound-engine';
import { Coffee, MapPin, CheckCircle2, Ticket, ShieldCheck, Sparkles, Gift, BookOpen, HeartHandshake, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [donatedAmount, setDonatedAmount] = useState<number>(350);
  const [claimedVouchers, setClaimedVouchers] = useState<Record<string, boolean>>({});

  const handleClaimReward = (rewardId: string, title: string) => {
    SoundEngine.playBlessingChime();
    setClaimedVouchers((prev) => ({ ...prev, [rewardId]: true }));
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#CFA85B', '#D48C7F', '#7E9A85'],
    });
  };

  const handleDonateScholarship = () => {
    SoundEngine.playBlessingChime();
    setDonatedAmount((prev) => prev + 10);
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#CFA85B', '#5C4D43', '#5A6544'],
    });
  };

  useEffect(() => {
    setStations(StorageService.getStations());
  }, []);

  /** Haversine distance in meters between two GPS points */
  function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const handleCheckin = (stationId: string) => {
    SoundEngine.playBambooKnock();
    setCheckingInId(stationId);
    setGpsError(null);

    const station = stations.find((s) => s.id === stationId);
    if (!station) {
      setCheckingInId(null);
      return;
    }

    if (!navigator.geolocation) {
      setGpsError('Browser does not support GPS location.');
      setCheckingInId(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const dist = haversineMeters(
          position.coords.latitude,
          position.coords.longitude,
          station.lat,
          station.lng
        );

        // Allow up to 300m radius for indoor student cafe GPS drift
        const MAX_RADIUS_METERS = 300;

        if (dist <= MAX_RADIUS_METERS) {
          const claimed = StorageService.checkinStation(stationId);
          if (claimed) {
            SoundEngine.playBlessingChime();
            setStations(StorageService.getStations());
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#CFA85B', '#5C4D43', '#7E9A85', '#A84D3D'],
            });
          }
        } else {
          setGpsError(
            `You are approximately ${Math.round(dist)}m away. Move closer (within ${MAX_RADIUS_METERS}m) to check in.`
          );
        }
        setCheckingInId(null);
      },
      (error) => {
        setCheckingInId(null);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('Location permission required for station check-in. Please check your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('GPS signal unavailable. Please try again with clearer signal.');
            break;
          case error.TIMEOUT:
            setGpsError('GPS request timed out. Please try again.');
            break;
          default:
            setGpsError('GPS verification error. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col text-dongho-paper">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-bamboo-mid/30">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏮</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-warm-glow">Study Stations (Partner Hubs)</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-forest-deep border border-bamboo-soft text-warm-amber font-semibold">
              Study Sanctuaries &amp; Perks
            </span>
          </div>
          <p className="text-xs sm:text-sm text-dongho-paper/70 mt-1 italic">
            Partner student cafes and campus study hubs. Gentle GPS check-in unlocks study perks and companion reflections.
          </p>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 p-4 rounded-2xl bg-forest-deep border border-bamboo-mid/40 flex items-start gap-3 text-xs text-dongho-paper/80">
        <ShieldCheck className="w-5 h-5 text-warm-amber flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-warm-glow">Privacy-first verification:</strong> Check-in verifies relative coordinates at partner hubs to prevent double-spending vouchers — zero tracking of personal routes or GPS history on-chain.
        </div>
      </div>

      {/* GPS Error Banner */}
      {gpsError && (
        <div className="mt-4 p-3.5 rounded-2xl bg-dongho-red/15 border border-dongho-red/40 text-xs text-dongho-paper/90 flex items-start gap-2">
          <MapPin className="w-4 h-4 text-dongho-red flex-shrink-0 mt-0.5" />
          <div>
            <span>{gpsError}</span>
            <button
              onClick={() => setGpsError(null)}
              className="ml-2 text-warm-amber underline hover:text-warm-glow"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Stations List */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stations.map((st) => (
          <div
            key={st.id}
            className={`p-6 rounded-3xl border-2 flex flex-col justify-between transition-all ${
              st.claimed
                ? 'bg-forest-deep/60 border-bamboo-mid/20 opacity-80'
                : 'bg-forest-deep/90 border-bamboo-mid/50 hover:border-warm-glow shadow-2xl'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-forest-darker border border-bamboo-soft text-warm-glow flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 text-warm-amber" />
                  Study Station
                </span>
                {st.claimed && (
                  <span className="text-xs font-bold text-warm-glow flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-warm-glow" /> Voucher Claimed
                  </span>
                )}
              </div>

              <h3 className="font-bold text-base text-dongho-paper">{st.name}</h3>
              <p className="text-xs text-dongho-paper/60 flex items-start gap-1.5 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-bamboo-soft flex-shrink-0 mt-0.5" />
                <span>{st.address}</span>
              </p>

              <p className="text-xs text-dongho-paper/75 mt-3 leading-relaxed">
                {st.description}
              </p>

              {/* Voucher Card */}
              <div className="mt-4 p-3.5 rounded-2xl bg-forest-darker/90 border border-warm-amber/30 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-forest-deep text-warm-glow">
                  <Ticket className="w-5 h-5 text-warm-amber" />
                </div>
                <div>
                  <div className="text-[11px] text-warm-amber font-semibold">Partner Study Perk:</div>
                  <div className="text-xs font-bold text-dongho-paper mt-0.5">{st.voucherReward}</div>
                </div>
              </div>
            </div>

            {/* Checkin Button or Code display */}
            <div className="mt-6 pt-4 border-t border-bamboo-mid/20">
              {st.claimed ? (
                <div className="flex items-center justify-between text-xs font-mono bg-forest-darker px-3.5 py-2 rounded-xl border border-bamboo-mid/30">
                  <span className="text-dongho-paper/60">Voucher code:</span>
                  <span className="text-warm-glow font-bold">{st.voucherCode}</span>
                </div>
              ) : (
                <button
                  onClick={() => handleCheckin(st.id)}
                  disabled={checkingInId === st.id}
                  className="w-full py-2.5 rounded-xl bg-warm-amber hover:bg-warm-glow text-forest-abyss font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <MapPin className="w-4 h-4 text-forest-abyss" />
                  {checkingInId === st.id ? 'Verifying GPS...' : 'GPS Check-in at Venue'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* STUDENT REWARDS & COMMUNITY SCHOLARSHIP FUND (B2B WIN-WIN-WIN) */}
      <div className="mt-14 pt-8 border-t border-bamboo-mid/30 space-y-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎁</span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-warm-glow">
              Study Perks &amp; Community Scholarship Pool
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-forest-deep border border-warm-amber/40 text-warm-amber font-semibold">
              B2B Sponsor Pool
            </span>
          </div>
          <p className="text-xs sm:text-sm text-dongho-paper/70 mt-1 italic">
            Channel your quiet focus hours into partner perks and community scholarships recorded on Avalanche.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: F&B Voucher */}
          <div className="p-6 rounded-3xl bg-forest-deep/90 border border-warm-amber/40 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-forest-darker text-warm-amber flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 text-warm-amber" />
                  Cafe Study Perk
                </span>
                <span className="text-xs font-mono font-bold text-warm-glow">10 Mam Luc</span>
              </div>
              <h3 className="font-bold text-base text-dongho-paper">20% Off Highlands &amp; The Coffee House</h3>
              <p className="text-xs text-dongho-paper/70 mt-2 leading-relaxed">
                Valid at all partner cafes near university campuses during study sessions and deadline marathons.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-bamboo-mid/20">
              {claimedVouchers['fb-voucher'] ? (
                <div className="p-2.5 rounded-xl bg-forest-darker border border-bamboo-soft/40 text-center font-mono text-xs text-warm-glow font-bold">
                  Code: MN-STUDY-FNB20
                </div>
              ) : (
                <button
                  onClick={() => handleClaimReward('fb-voucher', 'Cafe Voucher')}
                  className="w-full py-2.5 rounded-xl bg-warm-amber hover:bg-warm-glow text-forest-abyss font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                >
                  <Gift className="w-4 h-4" />
                  <span>Claim Study Voucher</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Book / Stationery */}
          <div className="p-6 rounded-3xl bg-forest-deep/90 border border-warm-amber/40 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-forest-darker text-bamboo-soft flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-bamboo-soft" />
                  Books &amp; Courses
                </span>
                <span className="text-xs font-mono font-bold text-warm-glow">25 Mam Luc</span>
              </div>
              <h3 className="font-bold text-base text-dongho-paper">Curated Book &amp; Course Pack (Fahasa / Coursera)</h3>
              <p className="text-xs text-dongho-paper/70 mt-2 leading-relaxed">
                Sponsored by education partners for dedicated learners with verified quiet study hours.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-bamboo-mid/20">
              {claimedVouchers['book-voucher'] ? (
                <div className="p-2.5 rounded-xl bg-forest-darker border border-bamboo-soft/40 text-center font-mono text-xs text-bamboo-soft font-bold">
                  Code: MN-FAHASA-EDU50
                </div>
              ) : (
                <button
                  onClick={() => handleClaimReward('book-voucher', 'Fahasa Book Pack')}
                  className="w-full py-2.5 rounded-xl bg-forest-darker hover:bg-forest-mist border border-warm-amber/50 text-warm-glow font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                >
                  <Award className="w-4 h-4 text-warm-amber" />
                  <span>Claim Learning Pack</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Community Scholarship Fund */}
          <div className="p-6 rounded-3xl bg-forest-deep/90 border border-bamboo-soft/50 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-bamboo-soft/20 text-bamboo-soft flex items-center gap-1">
                  <HeartHandshake className="w-3.5 h-3.5 text-bamboo-soft" />
                  Scholarship Pool
                </span>
                <span className="text-xs font-mono font-bold text-warm-glow">{donatedAmount} Mam Luc</span>
              </div>
              <h3 className="font-bold text-base text-dongho-paper">Phù Đổng Student Scholarship Pool</h3>
              <p className="text-xs text-dongho-paper/70 mt-2 leading-relaxed">
                Every 10 Mam Luc donated is matched by corporate CSR sponsors to fund direct student aid for underprivileged scholars.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-bamboo-mid/20">
              <button
                onClick={handleDonateScholarship}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-bamboo-deep to-forest-darker hover:brightness-110 border border-bamboo-soft/50 text-warm-glow font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-warm-amber" />
                <span>Donate +10 Mam Luc</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
