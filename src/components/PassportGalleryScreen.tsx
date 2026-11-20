import React, { useState } from 'react';
import {
  ExternalLink,
  FileJson,
  RefreshCw,
  Search,
} from 'lucide-react';
import { MintedPassportRecord } from '../types';
import { SanctuaryModalType } from './SanctuaryScreen';
import {
  SharedBottomDock,
  SharedTopHud,
  useShowTextLabels,
} from './SharedHud';
import { CrystalMintIcon } from './HandDrawnAssets';
import { resolveAssetUrl } from '../assets/petImages';
import { shortenAddress } from '../services/pawsApi';

interface PassportGalleryScreenProps {
  coins: number;
  energy: number;
  maxEnergy: number;
  level: number;
  expPercent: number;
  readyFarmCount: number;
  luredCount: number;
  passports: MintedPassportRecord[];
  walletAddress: string | null;
  onSelectYard: () => void;
  onSelectFarm: () => void;
  onSelectVisit: () => void;
  onOpenModal: (modal: SanctuaryModalType) => void;
  onQuickCoins: () => void;
  onQuickEnergy: () => void;
  onOpenMintModal: () => void;
  onRefreshGallery: () => void;
  onOpenSettings?: () => void;
}

export const PassportGalleryScreen: React.FC<PassportGalleryScreenProps> = ({
  coins,
  energy,
  maxEnergy,
  level,
  expPercent,
  readyFarmCount,
  luredCount,
  passports,
  walletAddress,
  onSelectYard,
  onSelectFarm,
  onSelectVisit,
  onOpenModal,
  onQuickCoins,
  onQuickEnergy,
  onOpenMintModal,
  onRefreshGallery,
  onOpenSettings,
}) => {
  const showLabels = useShowTextLabels();
  const [filter, setFilter] = useState<'all' | 'mine' | 'dog' | 'cat' | 'bunny'>('all');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = passports.filter((p) => {
    if (filter === 'mine') {
      if (!walletAddress) return false;
      if (p.ownerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return false;
      }
    } else if (filter !== 'all') {
      const sp = p.species.toLowerCase();
      if (filter === 'dog' && !sp.includes('dog') && !sp.includes('corgi') && !sp.includes('shiba') && !sp.includes('samoyed')) {
        return false;
      }
      if (filter === 'cat' && !sp.includes('cat')) return false;
      if (filter === 'bunny' && !sp.includes('bunny') && !sp.includes('rabbit')) return false;
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return (
        p.petName.toLowerCase().includes(q) ||
        p.tokenId.toLowerCase().includes(q) ||
        p.species.toLowerCase().includes(q) ||
        p.ownerAddress.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRefresh = () => {
    setRefreshing(true);
    onRefreshGallery();
    window.setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <div className="relative w-full h-full pastel-scrapbook-bg flex flex-col justify-between overflow-hidden select-none">
      {/* 1. SYNCED TOP HUD */}
      <SharedTopHud
        level={level}
        expPercent={expPercent}
        coins={coins}
        energy={energy}
        maxEnergy={maxEnergy}
        onOpenProfile={() => onOpenModal('profile')}
        onQuickCoins={onQuickCoins}
        onQuickEnergy={onQuickEnergy}
        onOpenSettings={onOpenSettings}
        subRow={
          <div className="bg-[#FFFDF9] border-2 border-[#DFCBBF] rounded-full px-3 py-0.5 shadow-[0_2px_8px_rgba(138,116,126,0.08)] flex items-center gap-1.5 text-[11.5px] font-extrabold text-[#4B3C46] whitespace-nowrap tabular-nums">
            <CrystalMintIcon className="w-3.5 h-3.5" />
            <span>
              {showLabels
                ? `Public Passports · ${passports.length}`
                : passports.length}
            </span>
          </div>
        }
      />

      {/* 2. FILTERABLE ON-CHAIN PASSPORT GALLERY (Scrollable feed above thumb-zone filters) */}
      <main className="relative z-10 flex-1 min-h-0 px-3 py-1 flex flex-col gap-2">
        {/* Scrollable Minted NFT Passport 2-Column Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
          {filtered.length === 0 ? (
            <div className="bg-[#FFFDF9] border-2 border-[#DFCBBF] rounded-3xl p-5 text-center space-y-2">
              <CrystalMintIcon className="w-7 h-7 mx-auto" />
              <div className="font-display text-[14px] font-extrabold text-[#4B3C46]">
                No Passports Match
              </div>
              <p className="text-[11.5px] font-medium text-[#8A747E]">
                {filter === 'mine' && !walletAddress
                  ? 'Connect your Core Wallet or mint a pet passport to see your collection here.'
                  : 'Try clearing the filter or mint a new Pet Passport!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((item) => {
                const isExpanded = expandedId === item.tokenId;
                return (
                  <article
                    key={`${item.tokenId}-${item.petId}`}
                    className={`bg-[#FFFDF9] border-2 border-[#DFCBBF] rounded-[22px] p-2 shadow-[0_6px_16px_rgba(138,116,126,0.1)] flex flex-col gap-1.5 ${
                      isExpanded ? 'col-span-2' : ''
                    }`}
                  >
                    <div
                      className={
                        isExpanded
                          ? 'flex items-center gap-2.5'
                          : 'flex flex-col gap-1.5'
                      }
                    >
                      <div
                        className={`relative rounded-2xl border-2 border-[#DFCBBF] overflow-hidden bg-[#FFF6FA] shrink-0 ${
                          isExpanded ? 'w-16 h-16' : 'aspect-square w-full'
                        }`}
                      >
                        <img
                          src={resolveAssetUrl(item.imageUrl)}
                          alt={`${item.petName} passport`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1.5 right-1.5 bg-[#FFFDF9]/95 border border-[#DFCBBF] rounded-full px-1.5 py-0.5 text-[9.5px] font-mono font-extrabold text-[#4F7EA6] tabular-nums">
                          {item.tokenId}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 px-0.5">
                        <h4 className="font-display text-[13.5px] font-extrabold text-[#4B3C46] truncate leading-tight">
                          {item.petName}
                        </h4>

                        <div className="text-[10.5px] font-bold text-[#8A747E] capitalize truncate">
                          {item.species} · Lv.{item.bondLevel}
                        </div>

                        <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-extrabold">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : item.tokenId)
                            }
                            aria-label={isExpanded ? 'Hide IPFS' : 'View IPFS'}
                            title="IPFS Metadata"
                            className="text-[#7B6670] hover:text-[#4B3C46] flex items-center gap-1 min-h-[28px] cursor-pointer"
                          >
                            <FileJson className="w-3.5 h-3.5" />
                            {showLabels && (
                              <span>{isExpanded ? 'Hide' : 'IPFS'}</span>
                            )}
                          </button>

                          <a
                            href={item.snowtraceUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open on Snowtrace"
                            title="Snowtrace Explorer"
                            className="text-[#4F7EA6] hover:underline flex items-center gap-0.5 min-h-[28px]"
                          >
                            {showLabels && <span>Snowtrace</span>}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-xl p-2 text-[10px] font-mono text-[#4B3C46] space-y-0.5 break-all">
                        <div>
                          <strong>Owner:</strong>{' '}
                          {shortenAddress(item.ownerAddress)}
                        </div>
                        <div>
                          <strong>CID:</strong> {item.ipfsCid}
                        </div>
                        <div>
                          <strong>Token URI:</strong> {item.ipfsUri}
                        </div>
                        <div>
                          <strong>TX Hash:</strong> {item.txHash}
                        </div>
                        <div>
                          <strong>Bond XP:</strong> {item.bondXp} ·{' '}
                          <strong>Minted:</strong> {item.mintedAt}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Thumb-Zone Search + Refresh + Filter Bar (One-hand reachable) */}
        <div className="space-y-1.5 shrink-0 pt-0.5">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 bg-[#FFFDF9] border-2 border-[#DFCBBF] rounded-full px-3 min-h-[42px] flex items-center gap-2">
              <Search className="w-4 h-4 text-[#8A747E] shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, #token, wallet..."
                aria-label="Search minted passports"
                className="w-full text-[12px] font-bold text-[#4B3C46] bg-transparent focus:outline-none placeholder:text-[#A9959F]"
              />
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Refresh on-chain gallery"
              title="Refresh"
              className="bg-[#FFFDF9] border-2 border-[#DFCBBF] rounded-full w-10.5 h-10.5 flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer shrink-0"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: 'all', label: 'All', icon: '✨' },
              { id: 'mine', label: 'Mine', icon: '👤' },
              { id: 'dog', label: 'Dogs', icon: '🐶' },
              { id: 'cat', label: 'Cats', icon: '🐱' },
              { id: 'bunny', label: 'Bunnies', icon: '🐰' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-label={tab.label}
                title={tab.label}
                onClick={() =>
                  setFilter(
                    tab.id as 'all' | 'mine' | 'dog' | 'cat' | 'bunny'
                  )
                }
                className={`rounded-full min-h-[42px] ${
                  showLabels ? 'px-3.5 text-[11.5px]' : 'px-4 text-[16px]'
                } font-extrabold border cursor-pointer whitespace-nowrap transition-colors ${
                  filter === tab.id
                    ? 'bg-[#FFE07D] border-[#C99D66] text-[#4B3C46]'
                    : 'bg-[#FFFDF9] border-[#DFCBBF] text-[#8A747E]'
                }`}
              >
                {showLabels ? tab.label : tab.icon}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* 3. SYNCED BOTTOM DOCK */}
      <SharedBottomDock
        activeTab="gallery"
        readyFarmCount={readyFarmCount}
        luredCount={luredCount}
        onSelectYard={onSelectYard}
        onSelectFarm={onSelectFarm}
        onSelectVisit={onSelectVisit}
        onSelectBag={() => onOpenModal('bag')}
        onSelectAlbum={() => onOpenModal('album')}
        primaryCta={
          <button
            type="button"
            onClick={onOpenMintModal}
            aria-label="Mint Pet Passport"
            title="Mint Pet Passport"
            className={`buttercup-cta rounded-full font-display font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
              showLabels ? 'px-6 min-h-[48px] text-[14px]' : 'w-16 h-16'
            }`}
          >
            <CrystalMintIcon className={showLabels ? 'w-4.5 h-4.5' : 'w-7 h-7'} />
            {showLabels && <span>Mint Pet Passport</span>}
          </button>
        }
      />
    </div>
  );
};
