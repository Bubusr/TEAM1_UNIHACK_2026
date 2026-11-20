import React, { useEffect, useState } from 'react';
import { Droplets, Minus, Plus, Store, X } from 'lucide-react';
import {
  CropPlot,
  CropType,
  FoodItemType,
  MarketListing,
  OrchardTree,
} from '../types';
import { SanctuaryModalType } from './SanctuaryScreen';
import { PawCoinIcon } from './HandDrawnAssets';
import { BasketMiniIcon, CropFoodIcon } from './GameIcons';
import {
  SharedBottomDock,
  SharedTopHud,
  useShowTextLabels,
  useSkyTheme,
} from './SharedHud';

export const FOOD_META: Record<
  FoodItemType,
  {
    icon: string;
    name: string;
    seedCost?: number;
    growMs?: number;
    sellPrice: number;
  }
> = {
  wheat: { icon: '🌾', name: 'Wheat', seedCost: 10, growMs: 8000, sellPrice: 24 },
  carrot: { icon: '🥕', name: 'Carrot', seedCost: 15, growMs: 10000, sellPrice: 36 },
  berry: { icon: '🍓', name: 'Berry', seedCost: 25, growMs: 14000, sellPrice: 55 },
  catnip: { icon: '🌿', name: 'Catnip', seedCost: 35, growMs: 18000, sellPrice: 75 },
  apple: { icon: '🍎', name: 'Apple', sellPrice: 45 },
  peach: { icon: '🍑', name: 'Peach', sellPrice: 52 },
};

const SEED_LIST: CropType[] = ['wheat', 'carrot', 'berry', 'catnip'];
const MAX_STALL_CRATES = 6;

interface FarmScreenProps {
  coins: number;
  energy: number;
  maxEnergy: number;
  level: number;
  expPercent: number;
  waterCharges: number;
  maxWater: number;
  cropPlots: CropPlot[];
  trees: OrchardTree[];
  seedInventory: Record<CropType, number>;
  foodInventory: Record<FoodItemType, number>;
  marketListings: MarketListing[];
  readyFarmCount: number;
  luredCount: number;
  onSelectYard: () => void;
  onOpenModal: (modal: SanctuaryModalType) => void;
  onQuickCoins: () => void;
  onRefillWater: () => string;
  onTapPlot: (plotId: string, activeSeed: CropType | null) => string | void;
  onTapTree: (treeId: string) => string;
  onBuySeed: (crop: CropType) => string;
  onListOnMarket: (item: FoodItemType, qty: number, price: number) => string;
  onCancelMarketListing: (listingId: string) => string;
  onCollectMarketSale: (listingId: string) => string;
  onOpenSettings?: () => void;
}

export const FarmScreen: React.FC<FarmScreenProps> = ({
  coins,
  energy,
  maxEnergy,
  level,
  expPercent,
  waterCharges,
  maxWater,
  cropPlots,
  trees,
  seedInventory,
  foodInventory,
  marketListings,
  readyFarmCount,
  luredCount,
  onSelectYard,
  onOpenModal,
  onQuickCoins,
  onRefillWater,
  onTapPlot,
  onTapTree,
  onBuySeed,
  onListOnMarket,
  onCancelMarketListing,
  onCollectMarketSale,
  onOpenSettings,
}) => {
  const showLabels = useShowTextLabels();
  const { palette } = useSkyTheme();
  const [selectedSeed, setSelectedSeed] = useState<CropType>('carrot');
  const [marketOpen, setMarketOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [toast, setToast] = useState<string | null>(null);

  // Hay Day style roadside shop composer state
  const [draftItem, setDraftItem] = useState<FoodItemType | null>(null);
  const [draftQty, setDraftQty] = useState(1);
  const [draftPrice, setDraftPrice] = useState(36);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  const showToast = (msg: string | void) => {
    if (!msg) return;
    setToast(msg);
    window.setTimeout(() => {
      setToast((cur) => (cur === msg ? null : cur));
    }, 1100);
  };

  const soldCount = marketListings.filter((l) => l.sold).length;
  const totalFood = (Object.keys(foodInventory) as FoodItemType[]).reduce(
    (sum, k) => sum + foodInventory[k],
    0
  );

  const openDraftForItem = (item: FoodItemType) => {
    if (foodInventory[item] <= 0) return;
    if (marketListings.length >= MAX_STALL_CRATES) {
      showToast('Stall Full (6/6)');
      return;
    }
    const qty = 1;
    setDraftItem(item);
    setDraftQty(qty);
    setDraftPrice(FOOD_META[item].sellPrice * qty);
  };

  const getPriceBounds = (item: FoodItemType, qty: number) => {
    const baseTotal = FOOD_META[item].sellPrice * qty;
    const minPrice = Math.max(1, Math.round(baseTotal * 0.4));
    const maxPrice = Math.max(minPrice + 10, Math.round(baseTotal * 2.5));
    return { minPrice, baseTotal, maxPrice };
  };

  const handleChangeDraftQty = (nextQty: number) => {
    if (!draftItem) return;
    const owned = foodInventory[draftItem];
    const clampedQty = Math.max(1, Math.min(Math.min(10, owned), nextQty));
    const { minPrice, baseTotal, maxPrice } = getPriceBounds(
      draftItem,
      clampedQty
    );
    const ratio =
      draftQty > 0
        ? draftPrice / (FOOD_META[draftItem].sellPrice * draftQty)
        : 1;
    const scaled = Math.round(baseTotal * ratio);
    setDraftQty(clampedQty);
    setDraftPrice(Math.max(minPrice, Math.min(maxPrice, scaled)));
  };

  const handleConfirmListing = () => {
    if (!draftItem) return;
    const { minPrice, maxPrice } = getPriceBounds(draftItem, draftQty);
    const finalPrice = Math.max(minPrice, Math.min(maxPrice, Math.round(draftPrice) || minPrice));
    const msg = onListOnMarket(draftItem, draftQty, finalPrice);
    showToast(msg);
    setDraftItem(null);
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none flex flex-col justify-between transition-colors duration-700"
      style={{ backgroundColor: palette.farmBaseBg }}
    >
      {/* TIME-OF-DAY PASTEL ORCHARD & WATER STREAM BACKDROP */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-x-0 top-0 h-[22%] transition-all duration-700"
          style={{
            background: palette.farmSkyGradient,
          }}
        />
        <div
          className="absolute inset-x-0 top-[16%] bottom-0 transition-all duration-700"
          style={{
            background: palette.farmMeadowGradient,
          }}
        />

        {/* Pastel Brook & Farm Paths */}
        <svg
          viewBox="0 0 390 660"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M345 110 C315 170 365 245 335 320 C310 385 365 445 350 530"
            stroke={palette.brookStroke}
            strokeWidth="34"
            strokeLinecap="round"
          />
          <path
            d="M345 110 C315 170 365 245 335 320 C310 385 365 445 350 530"
            stroke={palette.brookHighlight}
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.72"
          />
          <path
            d="M195 145 L195 540"
            stroke="#FFF4E3"
            strokeWidth="26"
            strokeLinecap="round"
            opacity="0.7"
          />
          {[
            { x: 44, y: 270, c: '#FFFDF9' },
            { x: 60, y: 288, c: '#FFB3CF' },
            { x: 318, y: 245, c: '#FFE48C' },
            { x: 52, y: 455, c: '#FFE48C' },
            { x: 308, y: 468, c: '#FFB3CF' },
          ].map((f, idx) => (
            <g key={idx} transform={`translate(${f.x}, ${f.y})`}>
              <circle cx="0" cy="-3.8" r="2.8" fill={f.c} />
              <circle cx="3.6" cy="-1.2" r="2.8" fill={f.c} />
              <circle cx="2.2" cy="3" r="2.8" fill={f.c} />
              <circle cx="-2.2" cy="3" r="2.8" fill={f.c} />
              <circle cx="-3.6" cy="-1.2" r="2.8" fill={f.c} />
              <circle cx="0" cy="0" r="2" fill="#FFD45E" />
            </g>
          ))}
        </svg>
      </div>

      {/* 1. SYNCED TOP HUD */}
      <SharedTopHud
        level={level}
        expPercent={expPercent}
        coins={coins}
        energy={energy}
        maxEnergy={maxEnergy}
        onOpenProfile={() => onOpenModal('profile')}
        onQuickCoins={onQuickCoins}
        onQuickEnergy={() => showToast(onRefillWater())}
        onOpenSettings={onOpenSettings}
        rightBadge={
          <div className="relative flex items-center">
            <div className="w-6 h-6 rounded-full bg-[#DFF3FF] border-2 border-[#8DC3E8] flex items-center justify-center relative z-10 -mr-2 shadow-xs">
              <Droplets className="w-3.5 h-3.5 fill-[#7CCBFF] text-[#499AD3]" />
            </div>
            <button
              type="button"
              onClick={() => showToast(onRefillWater())}
              aria-label="Refill Water"
              className="cream-pill rounded-full pl-3 pr-2 py-0.5 flex items-center gap-1 min-h-[32px] active:scale-95 transition-transform cursor-pointer"
              title="Tap to refill watering can"
            >
              <span className="font-display text-[12px] font-extrabold text-[#4B3C46] tabular-nums whitespace-nowrap">
                {waterCharges}/{maxWater}
              </span>
            </button>
          </div>
        }
        subRow={
          <div className="flex items-center justify-center gap-1.5">
            {showLabels && (
              <div className="bg-[#FFFDF9]/95 border-2 border-[#D9C3B4] rounded-full px-3 py-0.5 shadow-[0_2px_8px_rgba(138,116,126,0.1)] flex items-center gap-1.5 text-[11.5px] font-bold text-[#4B3C46] whitespace-nowrap">
                <span>🌾 Crop Farm</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setMarketOpen(true)}
              aria-label="Open Roadside Market"
              className="bg-[#FFFDF9]/95 border-2 border-[#D9C3B4] rounded-full px-2.5 py-0.5 shadow-[0_2px_8px_rgba(138,116,126,0.1)] text-[11.5px] font-extrabold text-[#4B3C46] tabular-nums active:scale-95 transition-transform cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
            >
              <BasketMiniIcon className="w-4 h-4" />
              <span>{totalFood}</span>
            </button>
          </div>
        }
      />

      {/* 2. TOP-DOWN FARM WORLD (Lowered into comfortable one-hand thumb arc) */}
      <main className="relative z-20 flex-1 min-h-0 px-3.5 py-1 flex flex-col justify-end gap-2.5">
        {/* Top Row: Orchard Fruit Trees + Stone Water Well */}
        <div className="flex items-end justify-between gap-2 pt-0.5">
          <div className="flex items-end gap-2">
            {trees.map((tree) => {
              const meta = FOOD_META[tree.fruit];
              const isReady = nowMs >= tree.readyAt;
              const secsLeft = Math.max(
                1,
                Math.ceil((tree.readyAt - nowMs) / 1000)
              );

              return (
                <button
                  key={tree.id}
                  type="button"
                  onClick={() => showToast(onTapTree(tree.id))}
                  aria-label={`${meta.name} tree`}
                  className="relative flex flex-col items-center cursor-pointer active:scale-95 transition-transform group"
                >
                  <div className="relative w-16 h-16 rounded-full bg-[#92DC7E] border-2 border-[#75BD63] shadow-[inset_0_-4px_0_#7AC768,0_4px_10px_rgba(75,60,70,0.12)] flex items-center justify-center">
                    <div className="absolute top-1.5 left-2.5 w-6 h-3.5 rounded-full bg-[#B4EC9F]/70" />
                    {isReady ? (
                      <div className="grid grid-cols-2 gap-0.5 animate-bounce">
                        <CropFoodIcon item={tree.fruit} className="w-4.5 h-4.5" />
                        <CropFoodIcon item={tree.fruit} className="w-4.5 h-4.5" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-0.5 opacity-80">
                          <CropFoodIcon item={tree.fruit} className="w-3.5 h-3.5" />
                          <CropFoodIcon item={tree.fruit} className="w-3.5 h-3.5" />
                        </div>
                        <span className="bg-[#FFFDF9]/92 border border-[#D9C3B4] rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-[#4B3C46] tabular-nums leading-none">
                          {secsLeft}s
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-3.5 h-3.5 bg-[#E6B88A] border-2 border-[#B38964] -mt-1 rounded-b-md" />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => showToast(onRefillWater())}
            aria-label="Water Well"
            className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform mr-1"
          >
            <div className="relative w-13 h-5 bg-[#FF9AA2] border-2 border-[#A6826E] rounded-t-2xl overflow-hidden flex items-end justify-around px-0.5">
              <span className="w-2.5 h-1.5 rounded-t-full bg-[#FFFDF9]/90" />
              <span className="w-2.5 h-1.5 rounded-t-full bg-[#FFFDF9]/90" />
              <span className="w-2.5 h-1.5 rounded-t-full bg-[#FFFDF9]/90" />
            </div>
            <div className="w-10 h-6.5 bg-[#FFFDF9] border-x-2 border-b-2 border-[#C8B2A4] rounded-b-xl flex items-center justify-center shadow-[inset_0_-2px_0_#F3EAE2]">
              <Droplets className="w-4 h-4 fill-[#7CCBFF] text-[#59A7DB]" />
            </div>
          </button>
        </div>

        {/* Center: 3x2 Hay-Day Style Farm Plots Grid */}
        <div className="bg-[#FFFDF9]/55 border-2 border-[#E2D2C5] rounded-[24px] p-2.5 shadow-[0_8px_20px_rgba(138,116,126,0.12)] w-full max-w-[320px] mx-auto">
          <div className="grid grid-cols-3 gap-2">
            {cropPlots.map((plot) => {
              const meta = plot.crop ? FOOD_META[plot.crop] : null;
              const effectiveMs = plot.watered
                ? plot.durationMs * 0.55
                : plot.durationMs;
              const elapsed = plot.plantedAt ? nowMs - plot.plantedAt : 0;
              const progress = plot.crop
                ? Math.min(1, elapsed / effectiveMs)
                : 0;
              const isReady = Boolean(plot.crop && progress >= 1);

              return (
                <button
                  key={plot.id}
                  type="button"
                  onClick={() => showToast(onTapPlot(plot.id, selectedSeed))}
                  className={`aspect-[1.06/1] rounded-[18px] border-2 flex flex-col items-center justify-center relative transition-transform active:scale-92 cursor-pointer ${
                    isReady
                      ? 'bg-[#FFF3BF] border-[#D4A64F] shadow-[0_4px_10px_rgba(226,174,72,0.25)]'
                      : plot.crop
                      ? 'bg-[#EAD2BA] border-[#C9A686]'
                      : 'bg-[#F5E4D3] border-[#D6B89C] hover:bg-[#F9EBDC]'
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-3 bottom-2 h-1 rounded-full bg-[#CFAF95]/50"
                  />

                  {!plot.crop && (
                    <span className="inline-flex items-center gap-0.5 text-[14px] font-extrabold text-[#A6826E]">
                      <span>+</span>
                      <CropFoodIcon item={selectedSeed} className="w-4.5 h-4.5 opacity-80" />
                    </span>
                  )}

                  {plot.crop && !isReady && (
                    <>
                      <div className="relative flex items-end justify-center h-6">
                        {progress < 0.5 ? (
                          <>
                            <CropFoodIcon item="sprout" className="w-5.5 h-5.5" />
                            <span className="absolute -top-1.5 -right-2.5 opacity-90">
                              <CropFoodIcon item={plot.crop} className="w-3.5 h-3.5" />
                            </span>
                          </>
                        ) : (
                          <div className="flex items-end gap-0.5">
                            <CropFoodIcon item="sprout" className="w-3.5 h-3.5" />
                            <CropFoodIcon item={plot.crop} className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <span className="mt-1 bg-[#FFFDF9]/90 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-[#4B3C46] tabular-nums">
                        {plot.watered ? '💧 ' : ''}
                        {Math.max(
                          1,
                          Math.ceil((effectiveMs - elapsed) / 1000)
                        )}
                        s
                      </span>
                    </>
                  )}

                  {plot.crop && isReady && (
                    <span className="animate-bounce">
                      <CropFoodIcon item={plot.crop} className="w-7 h-7" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toast Feedback */}
        <div className="min-h-[24px] flex items-center justify-center">
          {toast && (
            <div className="bg-[#FFFDF9] border-2 border-[#D9C3B4] rounded-full px-3 py-0.5 text-[11.5px] font-extrabold text-[#4B3C46] shadow-sm animate-bounce">
              {toast}
            </div>
          )}
        </div>

        {/* Quick Seed Selector Tray */}
        <div className="bg-[#FFFDF9] border-2 border-[#DFCBBF] rounded-2xl p-1 grid grid-cols-4 gap-1 shadow-xs mb-0.5">
          {SEED_LIST.map((cropKey) => {
            const meta = FOOD_META[cropKey];
            const count = seedInventory[cropKey];
            const isSelected = selectedSeed === cropKey;
            return (
              <button
                key={cropKey}
                type="button"
                onClick={() => {
                  setSelectedSeed(cropKey);
                  if (count === 0) {
                    showToast(onBuySeed(cropKey));
                  }
                }}
                className={`rounded-xl min-h-[44px] py-1 px-1 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#FFE07D] border border-[#C99D66]'
                    : 'bg-[#FFF9F2] border border-transparent hover:bg-[#FFF3E5]'
                }`}
              >
                <CropFoodIcon item={cropKey} className="w-5 h-5" />
                <span className="mt-0.5 text-[10px] font-extrabold text-[#4B3C46] tabular-nums whitespace-nowrap inline-flex items-center gap-0.5">
                  {count > 0 ? (
                    `x${count}`
                  ) : (
                    <>
                      <span>{meta.seedCost}</span>
                      <PawCoinIcon className="w-3 h-3" />
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </main>

      {/* 3. SYNCED BOTTOM DOCK */}
      <SharedBottomDock
        activeTab="farm"
        readyFarmCount={readyFarmCount}
        luredCount={luredCount}
        onSelectYard={onSelectYard}
        onSelectFarm={() => {}}
        onSelectVisit={() => onOpenModal('visit')}
        onSelectBag={() => onOpenModal('bag')}
        onSelectAlbum={() => onOpenModal('album')}
        primaryCta={
          <div className="w-full flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => showToast(onRefillWater())}
              aria-label="Refill Water"
              title="Refill Water"
              className="cream-pill rounded-full h-12 px-3.5 bg-[#EFF8FF] flex items-center justify-center gap-1.5 text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
            >
              <Droplets className="w-5 h-5 fill-[#7CCBFF] text-[#499AD3]" />
              <span className="font-display text-[12px] font-extrabold tabular-nums">
                {waterCharges}/{maxWater}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDraftItem(null);
                setMarketOpen(true);
              }}
              aria-label="Roadside Market"
              title="Roadside Market"
              className={`buttercup-cta relative rounded-full font-display font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                showLabels ? 'px-5 min-h-[48px] text-[14px]' : 'w-16 h-16'
              }`}
            >
              <Store
                className={
                  showLabels
                    ? 'w-4.5 h-4.5 stroke-[2.4]'
                    : 'w-7 h-7 stroke-[2.3]'
                }
              />
              {showLabels && (
                <span>
                  Roadside Market {soldCount > 0 ? `(${soldCount} Sold!)` : ''}
                </span>
              )}
              {!showLabels && soldCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF85A1] border-2 border-[#FFFDF9] text-[#FFFDF9] text-[10px] font-extrabold flex items-center justify-center tabular-nums">
                  {soldCount}
                </span>
              )}
            </button>
          </div>
        }
      />

      {/* HAY-DAY STYLE ROADSIDE MARKET STALL SHEET WITH MANUAL PRICING */}
      {marketOpen && (
        <div
          onClick={() => {
            setDraftItem(null);
            setMarketOpen(false);
          }}
          className="absolute inset-0 z-40 bg-[#4B3C46]/25 backdrop-blur-xs flex items-end justify-center p-3 pb-7 sm:pb-3"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="cream-card w-full max-h-[84%] flex flex-col overflow-hidden"
          >
            <div className="pt-2 pb-0.5 flex justify-center bg-[#FFFDF9] sm:hidden">
              <span className="w-10 h-1 rounded-full bg-[#E5D3CA]" />
            </div>
            <div className="px-4 py-2.5 border-b border-[#F2E6DC] flex items-center justify-between bg-[#FFFDF9]">
              <h3 className="font-display text-[16px] font-extrabold text-[#4B3C46]">
                {draftItem
                  ? `🏷️ Price ${FOOD_META[draftItem].name}`
                  : '🏪 Roadside Market'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setDraftItem(null);
                  setMarketOpen(false);
                }}
                aria-label="Close Market"
                className="w-10 h-10 rounded-full bg-[#FFF5F8] border border-[#E5D3CA] flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="p-3.5 overflow-y-auto flex-1 space-y-3 bg-[#FFFDF9]">
              {draftItem ? (
                /* HAY DAY ORDER & MANUAL PRICE COMPOSER */
                (() => {
                  const meta = FOOD_META[draftItem];
                  const owned = foodInventory[draftItem];
                  const maxQty = Math.min(10, owned);
                  const { minPrice, baseTotal, maxPrice } = getPriceBounds(
                    draftItem,
                    draftQty
                  );
                  const clampedPrice = Math.max(
                    minPrice,
                    Math.min(maxPrice, Math.round(draftPrice) || minPrice)
                  );
                  const demandTag =
                    clampedPrice <= baseTotal
                      ? { label: '⚡ Fast Sale', bg: 'bg-[#E8F8EC] text-[#3F7B52]' }
                      : clampedPrice <= Math.round(baseTotal * 1.45)
                      ? { label: '👍 Fair Price', bg: 'bg-[#FFF8DC] text-[#8B682E]' }
                      : { label: '💎 High Price', bg: 'bg-[#FFF0F5] text-[#9A4E6D]' };

                  return (
                    <div className="space-y-3">
                      <div className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-3xl">{meta.icon}</span>
                          <div>
                            <div className="font-display text-[15px] font-extrabold text-[#4B3C46]">
                              {meta.name}
                            </div>
                            <div className="text-[11px] font-bold text-[#8A747E]">
                              In Basket: {owned}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${demandTag.bg}`}
                        >
                          {demandTag.label}
                        </span>
                      </div>

                      {/* Quantity Selector */}
                      <div className="bg-[#F6FBF7] border border-[#D4EBD8] rounded-2xl p-2.5 flex items-center justify-between">
                        <span className="font-display text-[13px] font-extrabold text-[#4B3C46]">
                          Quantity
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={draftQty <= 1}
                            onClick={() => handleChangeDraftQty(draftQty - 1)}
                            className="w-10 h-10 rounded-full bg-[#FFFDF9] border border-[#D9C3B4] flex items-center justify-center text-[#4B3C46] disabled:opacity-40 cursor-pointer active:scale-95"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4 stroke-[2.6]" />
                          </button>
                          <span className="w-10 text-center font-display text-[15px] font-extrabold text-[#4B3C46] tabular-nums">
                            x{draftQty}
                          </span>
                          <button
                            type="button"
                            disabled={draftQty >= maxQty}
                            onClick={() => handleChangeDraftQty(draftQty + 1)}
                            className="w-10 h-10 rounded-full bg-[#FFFDF9] border border-[#D9C3B4] flex items-center justify-center text-[#4B3C46] disabled:opacity-40 cursor-pointer active:scale-95"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4 stroke-[2.6]" />
                          </button>
                        </div>
                      </div>

                      {/* Manual Price Editor (Hay Day style) */}
                      <div className="bg-[#FFF8DC] border border-[#EFE0A8] rounded-2xl p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-[13px] font-extrabold text-[#4B3C46]">
                            Set Price
                          </span>
                          <span className="text-[11px] font-bold text-[#8A747E] tabular-nums">
                            {minPrice}–{maxPrice} 🪙
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setDraftPrice(Math.max(minPrice, clampedPrice - 5))
                            }
                            className="w-11 h-11 rounded-full bg-[#FFFDF9] border-2 border-[#D9C3B4] flex items-center justify-center font-display text-[13px] font-extrabold text-[#4B3C46] cursor-pointer active:scale-95"
                            aria-label="Decrease price"
                          >
                            -5
                          </button>

                          <div className="flex-1 bg-[#FFFDF9] border-2 border-[#D9C3B4] rounded-full px-3 min-h-[44px] flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min={minPrice}
                              max={maxPrice}
                              value={draftPrice}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setDraftPrice(Number.isNaN(val) ? minPrice : val);
                              }}
                              onBlur={() => setDraftPrice(clampedPrice)}
                              aria-label="Custom selling price"
                              className="w-16 text-center font-display text-[17px] font-extrabold text-[#4B3C46] bg-transparent focus:outline-none tabular-nums"
                            />
                            <PawCoinIcon className="w-4.5 h-4.5" />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setDraftPrice(Math.min(maxPrice, clampedPrice + 5))
                            }
                            className="w-11 h-11 rounded-full bg-[#FFFDF9] border-2 border-[#D9C3B4] flex items-center justify-center font-display text-[13px] font-extrabold text-[#4B3C46] cursor-pointer active:scale-95"
                            aria-label="Increase price"
                          >
                            +5
                          </button>
                        </div>

                        <input
                          type="range"
                          min={minPrice}
                          max={maxPrice}
                          value={clampedPrice}
                          onChange={(e) => setDraftPrice(Number(e.target.value))}
                          aria-label="Price slider"
                          className="w-full h-6 accent-[#C99D66] cursor-pointer"
                        />

                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { label: 'Min', val: minPrice },
                            { label: 'Base', val: baseTotal },
                            { label: 'Max', val: maxPrice },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setDraftPrice(preset.val)}
                              className="rounded-full min-h-[38px] bg-[#FFFDF9] border border-[#E2CFA0] text-[11px] font-extrabold text-[#4B3C46] cursor-pointer active:scale-95 tabular-nums"
                            >
                              {preset.label} {preset.val}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setDraftItem(null)}
                          className="cream-btn rounded-full min-h-[46px] font-display text-[13px] font-extrabold text-[#4B3C46] cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmListing}
                          className="col-span-2 buttercup-cta rounded-full min-h-[46px] font-display text-[13.5px] font-extrabold text-[#4B3C46] cursor-pointer inline-flex items-center justify-center gap-1"
                        >
                          <span>Put on Sale · {clampedPrice}</span>
                          <PawCoinIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <>
                  {/* 6-Crate Roadside Stall Grid */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11.5px] font-extrabold text-[#8A747E]">
                      <span>Stall Crates ({marketListings.length}/6)</span>
                      <span>Tap sold to collect</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: MAX_STALL_CRATES }).map((_, idx) => {
                        const listing = marketListings[idx];
                        if (!listing) {
                          const firstAvailable = (
                            Object.keys(FOOD_META) as FoodItemType[]
                          ).find((k) => foodInventory[k] > 0);
                          return (
                            <button
                              key={`empty-${idx}`}
                              type="button"
                              disabled={!firstAvailable}
                              onClick={() =>
                                firstAvailable && openDraftForItem(firstAvailable)
                              }
                              className="rounded-2xl p-2.5 border border-dashed border-[#DCC9BA] bg-[#FFFDF9] flex items-center justify-center text-[11.5px] font-extrabold text-[#A6826E] disabled:opacity-50 cursor-pointer hover:bg-[#FFF8EF]"
                            >
                              + Empty Crate
                            </button>
                          );
                        }

                        const meta = FOOD_META[listing.item];
                        return (
                          <div
                            key={listing.id}
                            className={`rounded-2xl p-2 border flex items-center justify-between gap-1 ${
                              listing.sold
                                ? 'bg-[#FFF3BF] border-[#D4A64F]'
                                : 'bg-[#F8F6FB] border-[#E4DDF0]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (listing.sold) {
                                  showToast(onCollectMarketSale(listing.id));
                                }
                              }}
                              className={`flex items-center gap-1.5 flex-1 text-left ${
                                listing.sold ? 'cursor-pointer' : 'cursor-default'
                              }`}
                            >
                              <CropFoodIcon item={listing.item} className="w-6 h-6" />
                              <div>
                                <div className="text-[11.5px] font-extrabold text-[#4B3C46]">
                                  {listing.sold
                                    ? 'Sold!'
                                    : `${meta.name} x${listing.qty}`}
                                </div>
                                <div className="text-[10.5px] font-bold text-[#8A747E] tabular-nums inline-flex items-center gap-0.5">
                                  <span>
                                    {listing.sold
                                      ? `${listing.buyerName} · +${listing.price}`
                                      : `${listing.price}`}
                                  </span>
                                  <PawCoinIcon className="w-3 h-3" />
                                </div>
                              </div>
                            </button>

                            {!listing.sold && (
                              <button
                                type="button"
                                onClick={() =>
                                  showToast(onCancelMarketListing(listing.id))
                                }
                                title="Return to basket"
                                aria-label={`Cancel ${meta.name} listing`}
                                className="w-9 h-9 rounded-full bg-[#FFFDF9] border border-[#DDD0E8] flex items-center justify-center text-[#8A747E] hover:text-[#4B3C46] active:scale-90 cursor-pointer shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Harvest Basket (Tap item to set Qty & Price) */}
                  <div className="space-y-1.5">
                    <div className="text-[11.5px] font-extrabold text-[#8A747E]">
                      Tap Crop to Set Qty &amp; Price
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(FOOD_META) as FoodItemType[]).map(
                        (itemKey) => {
                          const meta = FOOD_META[itemKey];
                          const count = foodInventory[itemKey];
                          return (
                            <button
                              key={itemKey}
                              type="button"
                              disabled={count === 0}
                              onClick={() => openDraftForItem(itemKey)}
                              className="bg-[#F0FAF2] border border-[#CFEBD5] rounded-2xl p-2.5 min-h-[52px] flex items-center justify-between disabled:opacity-45 cursor-pointer active:scale-95 transition-transform"
                            >
                              <div className="flex items-center gap-1.5">
                                <CropFoodIcon item={itemKey} className="w-5.5 h-5.5" />
                                <div className="text-left">
                                  <div className="text-[12px] font-extrabold text-[#4B3C46]">
                                    {meta.name} ({count})
                                  </div>
                                  <div className="text-[10px] font-bold text-[#6E8B74] tabular-nums inline-flex items-center gap-0.5">
                                    <span>Base {meta.sellPrice}</span>
                                    <PawCoinIcon className="w-3 h-3" />
                                  </div>
                                </div>
                              </div>
                              <span className="text-[11px] font-extrabold text-[#4B3C46] bg-[#FFFDF9] border border-[#CFEBD5] rounded-full px-2 py-0.5">
                                Price
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
