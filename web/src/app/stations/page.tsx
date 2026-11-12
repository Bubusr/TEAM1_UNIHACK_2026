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
      colors: ['#FFD166', '#E8837A', '#6B8F71'],
    });
  };

  const handleDonateScholarship = () => {
    SoundEngine.playBlessingChime();
    setDonatedAmount((prev) => prev + 10);
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#FFD166', '#F4A259', '#34A853'],
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
      setGpsError('Trình duyệt không hỗ trợ định vị GPS.');
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

        // Cho phép sai số trong bán kính 300m (tùy điều kiện GPS trong nhà)
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
              colors: ['#FFD166', '#F4A259', '#6B8F71', '#E63946'],
            });
          }
        } else {
          setGpsError(
            `Cậu đang cách trạm khoảng ${Math.round(dist)}m. Cần đến gần trạm hơn (≤${MAX_RADIUS_METERS}m) để check-in nhé.`
          );
        }
        setCheckingInId(null);
      },
      (error) => {
        setCheckingInId(null);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('Cậu cần cho phép truy cập vị trí để check-in. Kiểm tra cài đặt trình duyệt nhé.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('Không xác định được vị trí. Thử lại ở nơi có tín hiệu GPS tốt hơn nhé.');
            break;
          case error.TIMEOUT:
            setGpsError('Hết thời gian chờ GPS. Cậu thử lại nhé.');
            break;
          default:
            setGpsError('Lỗi GPS không xác định. Cậu thử lại nhé.');
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-warm-glow">Trạm Tre (Đối Tác Đời Thực)</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-forest-deep border border-bamboo-soft text-warm-amber font-semibold">
              Không gian học tập &amp; Ưu đãi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-dongho-paper/70 mt-1 italic">
            Quán cà phê và trung tâm giáo dục đối tác. Check-in GPS nhẹ nhàng để nhận ưu đãi thực tế và kích hoạt phản ứng từ Măng Non.
          </p>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 p-4 rounded-2xl bg-forest-deep border border-bamboo-mid/40 flex items-start gap-3 text-xs text-dongho-paper/80">
        <ShieldCheck className="w-5 h-5 text-warm-amber flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-warm-glow">Tôn trọng quyền riêng tư (Privacy-first):</strong> Cơ chế check-in chỉ xác thực toạ độ tương đối tại trạm đối tác để chống gian lận voucher — tuyệt đối không theo dõi hành trình di chuyển hay lưu GPS cá nhân lên blockchain.
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
              Đóng
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
                  Trạm Tre
                </span>
                {st.claimed && (
                  <span className="text-xs font-bold text-warm-glow flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-warm-glow" /> Đã nhận ưu đãi
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
                  <div className="text-[11px] text-warm-amber font-semibold">Ưu đãi đối tác:</div>
                  <div className="text-xs font-bold text-dongho-paper mt-0.5">{st.voucherReward}</div>
                </div>
              </div>
            </div>

            {/* Checkin Button or Code display */}
            <div className="mt-6 pt-4 border-t border-bamboo-mid/20">
              {st.claimed ? (
                <div className="flex items-center justify-between text-xs font-mono bg-forest-darker px-3.5 py-2 rounded-xl border border-bamboo-mid/30">
                  <span className="text-dongho-paper/60">Mã voucher:</span>
                  <span className="text-warm-glow font-bold">{st.voucherCode}</span>
                </div>
              ) : (
                <button
                  onClick={() => handleCheckin(st.id)}
                  disabled={checkingInId === st.id}
                  className="w-full py-2.5 rounded-xl bg-warm-amber hover:bg-warm-glow text-forest-abyss font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <MapPin className="w-4 h-4 text-forest-abyss" />
                  {checkingInId === st.id ? 'Đang xác thực GPS...' : 'Check-in GPS tại quán'}
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
              Gian Đổi Quà Học Tập &amp; Quỹ Khuyến Học Sinh Viên
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-forest-deep border border-warm-amber/40 text-warm-amber font-semibold">
              B2B Sponsor Pool
            </span>
          </div>
          <p className="text-xs sm:text-sm text-dongho-paper/70 mt-1 italic">
            Quy đổi thành quả giờ học tập trung thành ưu đãi thực tế và đóng góp trực tiếp vào quỹ học bổng cộng đồng trên Avalanche.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: F&B Voucher */}
          <div className="p-6 rounded-3xl bg-forest-deep/90 border border-warm-amber/40 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-forest-darker text-warm-amber flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 text-warm-amber" />
                  Voucher Cà Phê
                </span>
                <span className="text-xs font-mono font-bold text-warm-glow">10 Mầm Lực</span>
              </div>
              <h3 className="font-bold text-base text-dongho-paper">Giảm 20% Highlands &amp; The Coffee House</h3>
              <p className="text-xs text-dongho-paper/70 mt-2 leading-relaxed">
                Áp dụng tại mọi chi nhánh quanh các trường đại học khi chạy deadline hoặc học nhóm.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-bamboo-mid/20">
              {claimedVouchers['fb-voucher'] ? (
                <div className="p-2.5 rounded-xl bg-forest-darker border border-bamboo-soft/40 text-center font-mono text-xs text-warm-glow font-bold">
                  Mã: MN-STUDY-FNB20
                </div>
              ) : (
                <button
                  onClick={() => handleClaimReward('fb-voucher', 'Voucher Cà Phê')}
                  className="w-full py-2.5 rounded-xl bg-warm-amber hover:bg-warm-glow text-forest-abyss font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                >
                  <Gift className="w-4 h-4" />
                  <span>Đổi Voucher Ưu Đãi</span>
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
                  Sách &amp; Giáo Trình
                </span>
                <span className="text-xs font-mono font-bold text-warm-glow">25 Mầm Lực</span>
              </div>
              <h3 className="font-bold text-base text-dongho-paper">Bộ Sách &amp; Học Liệu Fahasa / Coursera</h3>
              <p className="text-xs text-dongho-paper/70 mt-2 leading-relaxed">
                Tài trợ từ đối tác giáo dục dành cho những bạn có ít nhất 10 giờ học tập trung được xác thực.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-bamboo-mid/20">
              {claimedVouchers['book-voucher'] ? (
                <div className="p-2.5 rounded-xl bg-forest-darker border border-bamboo-soft/40 text-center font-mono text-xs text-bamboo-soft font-bold">
                  Mã: MN-FAHASA-EDU50
                </div>
              ) : (
                <button
                  onClick={() => handleClaimReward('book-voucher', 'Bộ Sách Fahasa')}
                  className="w-full py-2.5 rounded-xl bg-forest-darker hover:bg-forest-mist border border-warm-amber/50 text-warm-glow font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                >
                  <Award className="w-4 h-4 text-warm-amber" />
                  <span>Nhận Học Liệu Tài Trợ</span>
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
                  Quỹ Khuyến Học
                </span>
                <span className="text-xs font-mono font-bold text-warm-glow">{donatedAmount} Mầm Lực</span>
              </div>
              <h3 className="font-bold text-base text-dongho-paper">Góp Quỹ Khuyến Học Làng Phù Đổng</h3>
              <p className="text-xs text-dongho-paper/70 mt-2 leading-relaxed">
                Mỗi 10 Mầm Lực đóng góp được doanh nghiệp bảo trợ quy đổi thành 50.000đ tài trợ học bổng vượt khó cho sinh viên nghèo.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-bamboo-mid/20">
              <button
                onClick={handleDonateScholarship}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-bamboo-deep to-forest-darker hover:brightness-110 border border-bamboo-soft/50 text-warm-glow font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-warm-amber" />
                <span>Quyên Góp +10 Mầm Lực</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
