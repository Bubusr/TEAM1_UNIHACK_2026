'use client';

import React, { useState } from 'react';
import InteractiveVillageCanvas from '@/components/InteractiveVillageCanvas';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import {
  Landmark,
  Sparkles,
  RefreshCw,
  MapPin,
  Coffee,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Heart,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  checkInStationOnChain,
  contributeVillageTreeOnChain,
} from '@/lib/avalanche-contracts';

interface S12PhuDongVillageProps {
  leaves: number;
  threshold: number;
  lastBloomedAt?: string;
  onTriggerBloom: () => void;
  onContributeLeaves?: (amount: number) => void;
}

interface StationItem {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  voucher: string;
  description: string;
  checkedIn: boolean;
  txHash?: string;
}

const INITIAL_STATIONS: StationItem[] = [
  {
    id: 1,
    name: 'Trạm Học Tre — The Workshop Coffee',
    address: '27 Ngô Đức Kế, P. Bến Nghé, Quận 1, TP.HCM',
    lat: 10.7725,
    lng: 106.7042,
    voucher: 'Giảm 20% Cà phê Thủ công khi học tập',
    description: 'Không gian tĩnh lặng cạnh vườn trúc mini, thích hợp đọc sách và viết bài.',
    checkedIn: false,
  },
  {
    id: 2,
    name: 'Trạm Tri Thức — Hiệu Sách Cá Chép',
    address: '211 Võ Văn Tần, Phường 5, Quận 3, TP.HCM',
    lat: 10.7742,
    lng: 106.6888,
    voucher: 'Tặng Voucher 50.000đ mua sách học thuật',
    description: 'Nơi hội tụ hàng nghìn đầu sách hỗ trợ các hành trình tự học và nghiên cứu.',
    checkedIn: false,
  },
  {
    id: 3,
    name: 'Trạm Tĩnh Tại — Thư Viện Khoa Học Tổng Hợp',
    address: '69 Lý Tự Trọng, Bến Thành, Quận 1, TP.HCM',
    lat: 10.7766,
    lng: 106.6998,
    voucher: 'Thẻ đọc đặc quyền & Vé gửi xe miễn phí',
    description: 'Không gian học tập chuẩn mực giữa trung tâm thành phố rợp bóng cây cổ thụ.',
    checkedIn: false,
  },
];

export default function S12PhuDongVillage({
  leaves,
  threshold,
  lastBloomedAt,
  onTriggerBloom,
  onContributeLeaves,
}: S12PhuDongVillageProps) {
  const [activeTab, setActiveTab] = useState<'tree' | 'stations'>('tree');
  const [showRewatchCard, setShowRewatchCard] = useState(Boolean(lastBloomedAt));
  const [isBlooming, setIsBlooming] = useState(false);
  const [stations, setStations] = useState<StationItem[]>(INITIAL_STATIONS);
  const [checkingInId, setCheckingInId] = useState<number | null>(null);
  const [statusToast, setStatusToast] = useState<{ msg: string; link?: string } | null>(null);

  // Kích hoạt bùng nổ hoa gạo & gọi contract VillageTree.sol
  const handleBloom = async () => {
    SoundEngine.playBlessingChime();
    setIsBlooming(true);
    onTriggerBloom();

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#A84D3D', '#CFA85B', '#5A6544'],
    });

    try {
      const result = await contributeVillageTreeOnChain(leaves || 50);
      setStatusToast({
        msg: `🌸 Bùng nổ Hoa Gạo thành công! Ghi nhận VillageTree: ${result.txHash.slice(0, 10)}...`,
        link: result.explorerUrl,
      });
    } catch (e) {
      console.warn('Contribute tree error:', e);
    }

    setTimeout(() => {
      setIsBlooming(false);
    }, 8000);
  };

  // Dâng 5 lá mầm lực nuôi cây
  const handleContributeSmall = async () => {
    if (leaves < 5) {
      setStatusToast({ msg: 'Bạn cần ít nhất 5 🍃 Mầm Lực để dâng Cây Đa!' });
      return;
    }

    SoundEngine.playBambooKnock();
    if (onContributeLeaves) onContributeLeaves(5);

    try {
      const result = await contributeVillageTreeOnChain(5);
      setStatusToast({
        msg: `🍃 Đã dâng 5 Mầm Lực! On-chain Proof: ${result.txHash.slice(0, 10)}...`,
        link: result.explorerUrl,
      });
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch (err: any) {
      setStatusToast({ msg: 'Lỗi dâng lá lên Cây Đa.' });
    }
  };

  // Check-in GPS tại Trạm Học Cà Phê / Thư Viện (TramTreCheckin.sol)
  const handleGpsCheckin = async (station: StationItem) => {
    SoundEngine.playBambooKnock();
    setCheckingInId(station.id);
    setStatusToast({ msg: '📍 Đang định vị GPS & xác thực On-chain TramTreCheckin...' });

    // Simulate GPS verification + contract call
    try {
      const result = await checkInStationOnChain(station.id, station.name);
      setStations((prev) =>
        prev.map((s) => (s.id === station.id ? { ...s, checkedIn: true, txHash: result.txHash } : s))
      );
      SoundEngine.playBlessingChime();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#CFA85B', '#5A6544', '#A84D3D'],
      });
      setStatusToast({
        msg: `✨ Check-in thành công tại ${station.name}! Tx: ${result.txHash.slice(0, 10)}...`,
        link: result.explorerUrl,
      });
    } catch (err: any) {
      setStatusToast({ msg: 'Xác thực Check-in thất bại. Vui lòng thử lại!' });
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#222E30] text-[#F4EEDD] flex flex-col justify-between overflow-hidden select-none">
      {/* Header */}
      <div className="pt-10 px-5 pb-2.5 border-b-2 border-[#26292B] bg-[#141C1E] z-20 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-[#CFA85B]" />
            <h2 className="text-xs font-black text-[#F4EEDD] uppercase tracking-wider">
              {content.s12_villageTree.title}
            </h2>
          </div>
          <p className="text-[10px] text-[#F4EEDD]/70 mt-0.5 font-medium">
            Mạng lưới Mầm Lực &amp; Trạm Học Cộng Đồng Avalanche
          </p>
        </div>

        {/* Leaves Counter Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F4EEDD] text-[#26292B] border-2 border-[#26292B] shadow-[2px_2px_0px_#26292B]">
          <span className="text-xs">🍃</span>
          <span className="text-xs font-black text-[#5A6544]">{leaves}</span>
          <span className="text-[9px] font-bold text-[#5C4D43]">mầm</span>
        </div>
      </div>

      {/* Sub-tabs Selector: Cây Đa vs Trạm Học Tre */}
      <div className="px-5 py-2 bg-[#1A2426] border-b border-[#26292B]/60 z-20 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('tree')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition border-2 ${
            activeTab === 'tree'
              ? 'bg-[#CFA85B] text-[#26292B] border-[#26292B] shadow-[2px_2px_0px_#26292B]'
              : 'bg-transparent text-[#F4EEDD]/60 border-transparent hover:text-[#F4EEDD]'
          }`}
        >
          🌳 Cây Đa Đầu Làng
        </button>

        <button
          onClick={() => setActiveTab('stations')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition border-2 ${
            activeTab === 'stations'
              ? 'bg-[#CFA85B] text-[#26292B] border-[#26292B] shadow-[2px_2px_0px_#26292B]'
              : 'bg-transparent text-[#F4EEDD]/60 border-transparent hover:text-[#F4EEDD]'
          }`}
        >
          ☕ Trạm Học GPS ({stations.filter((s) => s.checkedIn).length}/{stations.length})
        </button>
      </div>

      {/* Status Toast Alert */}
      {statusToast && (
        <div className="mx-4 mt-2 p-2.5 rounded-xl bg-[#F4EEDD] text-[#26292B] border-2 border-[#26292B] shadow-[3px_3px_0px_#26292B] z-30 text-[10px] flex items-center justify-between animate-fade-in">
          <div className="flex-1 font-bold truncate mr-2">{statusToast.msg}</div>
          <div className="flex items-center gap-1 shrink-0">
            {statusToast.link && (
              <a
                href={statusToast.link}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded bg-[#CFA85B] border border-[#26292B] text-[#26292B] hover:underline flex items-center gap-0.5 text-[9px] font-black"
              >
                <span>Snowtrace</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
            <button
              onClick={() => setStatusToast(null)}
              className="text-[#26292B] font-black text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="relative flex-1 w-full overflow-y-auto z-10 p-4">
        {activeTab === 'tree' ? (
          /* TAB 1: SACRED BANYAN TREE */
          <div className="flex flex-col items-center">
            {/* Interactive Canvas Container */}
            <div className="relative w-full rounded-2xl overflow-hidden border-2 border-[#26292B] shadow-[4px_4px_0px_#191B1D]">
              <InteractiveVillageCanvas
                currentEnergy={leaves}
                threshold={threshold}
                cycle={1}
                isBlessed={isBlooming}
                onTriggerBlessing={handleBloom}
              />
            </div>

            {/* Tree Action Controls */}
            <div className="w-full mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={handleContributeSmall}
                className="py-2.5 px-3 rounded-xl bg-[#F4EEDD] hover:bg-[#EDE5D2] text-[#26292B] font-black text-xs border-2 border-[#26292B] shadow-[2px_2px_0px_#26292B] flex items-center justify-center gap-1.5 transition active:translate-x-[1px] active:translate-y-[1px]"
              >
                <span>🍃</span>
                <span>Dâng 5 Mầm Lực</span>
              </button>

              <button
                onClick={handleBloom}
                className="py-2.5 px-3 rounded-xl bg-[#A84D3D] hover:bg-[#934233] text-white font-black text-xs border-2 border-[#26292B] shadow-[2px_2px_0px_#26292B] flex items-center justify-center gap-1.5 transition active:translate-x-[1px] active:translate-y-[1px]"
              >
                <span>🌸</span>
                <span>Bùng Nổ Hoa Gạo!</span>
              </button>
            </div>

            {/* Rewatch Card */}
            {showRewatchCard && !isBlooming && (
              <div className="w-full mt-3 p-3 rounded-xl bg-[#F4EEDD] text-[#26292B] border-2 border-[#26292B] shadow-[3px_3px_0px_#191B1D] flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌺</span>
                  <div>
                    <h4 className="text-xs font-black text-[#26292B]">
                      {content.s12_villageTree.afterBloomText}
                    </h4>
                    <p className="text-[10px] text-[#5C4D43]">
                      {content.s12_villageTree.newSeasonText}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRewatchCard(false);
                    handleBloom();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#CFA85B] text-[#26292B] font-black text-[10px] border border-[#26292B]"
                >
                  {content.s12_villageTree.btnRewatch}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: STATIONS LIST (TramTreCheckin.sol) */
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#F4EEDD] text-[#26292B] border-2 border-[#26292B] shadow-[2px_2px_0px_#26292B]">
              <div className="flex items-center gap-1.5 font-black text-xs text-[#5A6544]">
                <MapPin className="w-4 h-4 text-[#A84D3D]" />
                <span>TRẠM HỌC TRE GPS (TRAMTRECHECKIN.SOL)</span>
              </div>
              <p className="text-[10px] text-[#5C4D43] mt-1 leading-snug">
                Check-in học tập cùng bạn bè tại các quán cà phê &amp; thư viện đối tác để nhận ưu đãi và xác thực Proof-of-Presence trên Avalanche Fuji!
              </p>
            </div>

            {stations.map((st) => (
              <div
                key={st.id}
                className="p-3.5 rounded-2xl bg-[#F4EEDD] text-[#26292B] border-[2.5px] border-[#26292B] shadow-[3px_3px_0px_#191B1D] space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-[#26292B] flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 text-[#A84D3D]" />
                      <span>{st.name}</span>
                    </h4>
                    <p className="text-[10px] text-[#5C4D43] mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#5A6544] shrink-0" />
                      <span>{st.address}</span>
                    </p>
                  </div>

                  {st.checkedIn && (
                    <span className="px-2 py-0.5 rounded-full bg-[#DCE5DC] border border-[#5A6544] text-[#5A6544] font-black text-[9px] shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Đã Check-in</span>
                    </span>
                  )}
                </div>

                <div className="p-2 rounded-xl bg-[#EDE5D2] border border-[#26292B] text-[10px] font-bold text-[#A84D3D] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Ưu đãi: {st.voucher}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] text-[#5C4D43]/80">
                    Bán kính GPS hợp lệ: 300m
                  </span>

                  <div className="flex items-center gap-2">
                    {st.txHash && (
                      <a
                        href={`https://testnet.snowtrace.io/address/0xAe9E327A569146e2d59F2Fa4b4749f3060591Da1`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] text-[#5A6544] underline font-bold flex items-center gap-0.5"
                      >
                        <span>Snowtrace</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}

                    <button
                      onClick={() => handleGpsCheckin(st)}
                      disabled={checkingInId === st.id || st.checkedIn}
                      className={`px-3 py-1.5 rounded-xl font-black text-[11px] border-2 border-[#26292B] shadow-[2px_2px_0px_#26292B] transition ${
                        st.checkedIn
                          ? 'bg-[#DCE5DC] text-[#5A6544] cursor-default'
                          : 'bg-[#CFA85B] hover:bg-[#DFC07A] text-[#26292B] active:translate-x-[1px] active:translate-y-[1px]'
                      }`}
                    >
                      {checkingInId === st.id
                        ? 'Đang Check-in...'
                        : st.checkedIn
                        ? 'Đã Nhận Ưu Đãi'
                        : '📍 Check-in GPS'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Information */}
      <div className="pb-20 pt-2 px-5 text-center z-20">
        <p className="text-[10px] text-[#F4EEDD]/60 italic leading-relaxed">
          Mỗi hành trình hoàn tất là một chiếc lá sáng nuôi dưỡng Cây Đa Làng Phù Đổng. Năng lượng gắn kết nở hoa trên chuỗi Avalanche Fuji.
        </p>
      </div>
    </div>
  );
}
