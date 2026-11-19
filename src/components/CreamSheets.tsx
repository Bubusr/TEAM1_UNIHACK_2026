import React, { useState } from 'react';
import {
  Camera,
  Check,
  Heart,
  Lock,
  Move,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import {
  DailyLimits,
  FoodItemType,
  GardenToy,
  JudgeReport,
  NeighborGarden,
  SanctuaryPet,
  ShopItem,
} from '../types';
import {
  CrystalMintIcon,
  LightningEnergyIcon,
  PawCoinIcon,
} from './HandDrawnAssets';
import {
  BaitStickerIcon,
  FlameMiniIcon,
  HatStickerIcon,
  ShieldMiniIcon,
  ToyStickerIcon,
  TrophyMiniIcon,
} from './GameIcons';
import { PET_IMAGES, resolveAssetUrl } from '../assets/petImages';
import { CroppedPetCutout, HAT_STICKER_MAP } from './CroppedPetCutout';
import { FOOD_META } from './FarmScreen';
import { SanctuaryModalType } from './SanctuaryScreen';
import { useShowTextLabels } from './SharedHud';

interface CreamSheetsProps {
  modal: SanctuaryModalType;
  onClose: () => void;
  coins: number;
  energy: number;
  maxEnergy: number;
  level: number;
  streakDays: number;
  fenceHours: number;
  theme: string;
  pets: SanctuaryPet[];
  shopItems: ShopItem[];
  toys: GardenToy[];
  foodInventory: Record<FoodItemType, number>;
  limits: DailyLimits;
  neighbors: NeighborGarden[];
  visitingNeighbor: NeighborGarden | null;
  album: JudgeReport[];
  luredRescued: boolean;
  activeBait: string | null;
  onBuyItem: (item: ShopItem) => void;
  onBuyToy: (toy: GardenToy) => void;
  onFeedPet: (food: FoodItemType) => void;
  onVisitNeighbor: (neighborId: string) => void;
  onBuyFromNeighborMarket: (neighborId: string, listingId: string) => void;
  onEquipAccessory: (petId: string, accessoryId: string | null) => void;
  onBuyAndEquipHat?: (petId: string, item: ShopItem) => boolean;
  onCarePet: (petId: string) => void;
  onUseSampleSnap: () => void;
  onRescueStray: () => void;
  onPlaceBait: (baitName: string) => void;
  onOpenAlbumItem: (report: JudgeReport) => void;
  onOpenPetProfile?: (petId: string) => void;
  onOpenMintPassport?: (petId: string) => void;
  onOpenGallery?: () => void;
  onOpenWallet?: () => void;
  onOpenQuest?: () => void;
  walletLabel?: string;
  keeperName?: string;
}

export const CreamSheets: React.FC<CreamSheetsProps> = ({
  modal,
  onClose,
  coins,
  energy,
  maxEnergy,
  level,
  streakDays,
  fenceHours,
  theme,
  pets,
  shopItems,
  toys,
  foodInventory,
  limits,
  neighbors,
  visitingNeighbor,
  album,
  luredRescued,
  activeBait,
  onBuyItem,
  onBuyToy,
  onFeedPet,
  onVisitNeighbor,
  onBuyFromNeighborMarket,
  onEquipAccessory,
  onBuyAndEquipHat,
  onCarePet,
  onUseSampleSnap,
  onRescueStray,
  onPlaceBait,
  onOpenAlbumItem,
  onOpenPetProfile,
  onOpenMintPassport,
  onOpenGallery,
  onOpenWallet,
  onOpenQuest,
  walletLabel,
  keeperName = 'Keeper',
}) => {
  const showLabels = useShowTextLabels();
  const [shopTab, setShopTab] = useState<'toys' | 'hats'>('toys');
  const [bagTab, setBagTab] = useState<'bait' | 'rescue'>('bait');
  const [hatPickerPetId, setHatPickerPetId] = useState<string | null>(null);

  if (!modal) return null;

  const allHats = shopItems.filter((item) => item.kind === 'accessory');
  const energyItems = shopItems.filter((item) => item.kind !== 'accessory');

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-40 bg-[#4B3C46]/25 backdrop-blur-xs flex items-end justify-center p-3 pb-7 sm:pb-3"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cream-card w-full max-h-[82%] flex flex-col overflow-hidden"
      >
        <div className="pt-2 pb-0.5 flex justify-center bg-[#FFFDF9] sm:hidden">
          <span className="w-10 h-1 rounded-full bg-[#E5D3CA]" />
        </div>
        <div className="px-4 py-2.5 border-b border-[#F2E6DC] flex items-center justify-between bg-[#FFFDF9]">
          <h3 className="font-display text-[16px] font-extrabold text-[#4B3C46]">
            {modal === 'farmhouse' && '🏡 Pets'}
            {modal === 'shop' && '🛍️ Shop'}
            {modal === 'visit' && '🏘️ Neighbors'}
            {modal === 'neighborMarket' &&
              `🏪 ${visitingNeighbor?.ownerName ?? 'Neighbor'}’s Market`}
            {modal === 'bag' && '🐟 Bait & Rescue'}
            {modal === 'snap' && '📷 Snap'}
            {modal === 'rescue' && '🐾 Rescue'}
            {modal === 'album' && '📖 Album'}
            {modal === 'profile' && `🐱 Lv.${level}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-[#FFF5F8] border border-[#E5D3CA] flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-3.5 overflow-y-auto flex-1 space-y-2.5 bg-[#FFFDF9]">
          {/* FARMHOUSE PETS + PER-PET HAT WARDROBE */}
          {modal === 'farmhouse' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-extrabold text-[#4B3C46]">
                <div className="bg-[#FFEBF2] rounded-xl py-1 tabular-nums">
                  ❤️ {limits.petCoinsUsed}/{limits.petCoinsMax}
                </div>
                <div className="bg-[#E8F8EC] rounded-xl py-1 tabular-nums">
                  🥕 {limits.feedCoinsUsed}/{limits.feedCoinsMax}
                </div>
                <div className="bg-[#E7F5FF] rounded-xl py-1 tabular-nums">
                  🎾 {limits.playCoinsUsed}/{limits.playCoinsMax}
                </div>
              </div>

              <div className="space-y-2">
                {pets.map((pet) => {
                  const isHatOpen = hatPickerPetId === pet.id;
                  const currentHatIcon = pet.accessory
                    ? HAT_STICKER_MAP[pet.accessory]?.icon ?? '👒'
                    : '👒';
                  return (
                    <div
                      key={pet.id}
                      className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-2 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenPetProfile?.(pet.id)}
                          className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-xl bg-[#E8F8EC] border border-[#CFEBD5] flex items-center justify-center shrink-0 overflow-hidden">
                            <CroppedPetCutout
                              photoUrl={pet.photoUrl}
                              alt={pet.name}
                              mode={pet.cutoutMode ?? 'auto'}
                              accessory={pet.accessory}
                              hatTransform={pet.hatTransform}
                              hatSize="sm"
                              className="w-11 h-11"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-display text-[14px] font-extrabold text-[#4B3C46] flex items-center gap-1">
                              <span className="truncate">{pet.name}</span>
                              {pet.minted && (
                                <CrystalMintIcon className="w-3.5 h-3.5 shrink-0" />
                              )}
                            </div>
                            <div className="text-[10.5px] font-bold text-[#8A747E] tabular-nums truncate">
                              Lv.{pet.bondLevel} · {pet.bondXp} XP
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setHatPickerPetId((cur) =>
                                cur === pet.id ? null : pet.id
                              )
                            }
                            aria-label={`Change hat for ${pet.name}`}
                            title={`Change ${pet.name}'s hat`}
                            className={`rounded-full w-10 h-10 flex items-center justify-center text-[17px] border-2 active:scale-90 transition-transform cursor-pointer ${
                              isHatOpen
                                ? 'bg-[#FFF3BF] border-[#D9AA4C]'
                                : 'bg-[#FFF5F8] border-[#E8D7CE]'
                            }`}
                          >
                            {currentHatIcon}
                          </button>

                          {onOpenMintPassport && (
                            <button
                              type="button"
                              onClick={() => onOpenMintPassport(pet.id)}
                              className="cream-btn rounded-full px-2.5 min-h-[40px] text-[11px] font-extrabold text-[#4F7EA6] bg-[#EFF8FF] flex items-center justify-center gap-1 cursor-pointer"
                              title="Pet Passport"
                            >
                              <CrystalMintIcon className="w-3.5 h-3.5" />
                              {showLabels && (
                                <span>{pet.minted ? 'NFT ✓' : 'Mint'}</span>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onCarePet(pet.id)}
                            aria-label={`Pet ${pet.name}`}
                            className="buttercup-cta rounded-full min-w-[40px] px-2.5 min-h-[40px] text-[11.5px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Heart className="w-4 h-4 fill-[#FF85A1] text-[#FF85A1]" />
                            {showLabels && <span>Pet</span>}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Per-Pet Hat Picker Tray */}
                      {isHatOpen && (
                        <div className="pt-2 border-t border-[#F0E2D6] space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-[10.5px] font-extrabold text-[#8A747E]">
                            <span>
                              {pet.accessory
                                ? HAT_STICKER_MAP[pet.accessory]?.icon ?? '👒'
                                : '✕'}
                              {showLabels && (
                                <span className="ml-1">
                                  {pet.accessory
                                    ? HAT_STICKER_MAP[pet.accessory]?.label ?? ''
                                    : 'None'}
                                </span>
                              )}
                            </span>
                            {pet.accessory && onOpenPetProfile && (
                              <button
                                type="button"
                                onClick={() => onOpenPetProfile(pet.id)}
                                aria-label={`Move hat on ${pet.name}`}
                                className="rounded-full px-2.5 py-0.5 bg-[#FFF3BF] border border-[#D9AA4C] text-[#4B3C46] text-[10.5px] font-extrabold cursor-pointer active:scale-95 transition-transform inline-flex items-center gap-1"
                              >
                                <Move className="w-3 h-3 shrink-0" />
                                {showLabels && <span>Move</span>}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                            <button
                              type="button"
                              onClick={() => onEquipAccessory(pet.id, null)}
                              aria-label={`Remove hat from ${pet.name}`}
                              title="No Hat"
                              className={`relative w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border-2 cursor-pointer active:scale-90 transition-transform ${
                                !pet.accessory
                                  ? 'bg-[#FFF3BF] border-[#D9AA4C]'
                                  : 'bg-[#FFFDF9] border-[#E8D7CE] text-[#8A747E]'
                              }`}
                            >
                              <X className="w-4 h-4 stroke-[2.5]" />
                            </button>

                            {allHats.map((hat) => {
                              const isEquipped = pet.accessory === hat.id;
                              const isLocked = !hat.owned;
                              const canAfford = coins >= hat.cost;
                              return (
                                <button
                                  key={hat.id}
                                  type="button"
                                  disabled={isLocked && !canAfford}
                                  onClick={() => {
                                    if (hat.owned) {
                                      onEquipAccessory(pet.id, hat.id);
                                    } else if (onBuyAndEquipHat) {
                                      onBuyAndEquipHat(pet.id, hat);
                                    }
                                  }}
                                  title={
                                    isLocked
                                      ? `Buy ${hat.name} (${hat.cost} Coins)`
                                      : hat.name
                                  }
                                  className={`relative w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border-2 cursor-pointer active:scale-90 transition-transform disabled:opacity-45 ${
                                    isEquipped
                                      ? 'bg-[#FFF3BF] border-[#D9AA4C]'
                                      : 'bg-[#FFFDF9] border-[#E8D7CE]'
                                  }`}
                                >
                                  <HatStickerIcon hatId={hat.id} className="w-6 h-6" />
                                  {isEquipped && (
                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#FFE07D] border border-[#B88B61] flex items-center justify-center">
                                      <Check className="w-2 h-2 text-[#4B3C46] stroke-[3]" />
                                    </span>
                                  )}
                                  {isLocked && (
                                    <span className="absolute -bottom-1 inset-x-0 rounded-full bg-[#4B3C46] text-[#FFFDF9] text-[8px] font-extrabold leading-tight py-0.5 flex items-center justify-center gap-0.5 tabular-nums">
                                      <Lock className="w-2 h-2 shrink-0" />
                                      {hat.cost}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SHOP: TOYS & HATS */}
          {modal === 'shop' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-[#FFF8DC] border border-[#F0DFA5] rounded-xl px-3 py-1.5 text-[12px] font-extrabold text-[#4B3C46]">
                <span>Coins</span>
                <span className="flex items-center gap-1 tabular-nums">
                  <PawCoinIcon className="w-4 h-4" />
                  {coins.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 bg-[#F7F1EB] rounded-full p-1">
                {[
                  { id: 'toys', label: '🎾 Toys' },
                  { id: 'hats', label: '👒 Hats' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setShopTab(t.id as 'toys' | 'hats')}
                    className={`rounded-full min-h-[40px] text-[12.5px] font-extrabold cursor-pointer ${
                      shopTab === t.id
                        ? 'bg-[#FFFDF9] text-[#4B3C46] shadow-xs'
                        : 'text-[#8A747E]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {shopTab === 'toys' && (
                <div className="space-y-2">
                  {toys.map((toy) => (
                    <div
                      key={toy.id}
                      className="bg-[#F2F8FF] border border-[#D4E7FA] rounded-2xl p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[#FFFDF9] border border-[#D4E7FA] flex items-center justify-center">
                          <ToyStickerIcon toyId={toy.id} name={toy.name} className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-display text-[13.5px] font-extrabold text-[#4B3C46]">
                            {toy.name}
                          </div>
                          <div className="text-[11px] font-bold text-[#8A747E] tabular-nums inline-flex items-center gap-1">
                            <span>{toy.cost}</span>
                            <PawCoinIcon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={toy.owned || coins < toy.cost}
                        onClick={() => onBuyToy(toy)}
                        className={`rounded-full px-4 min-h-[42px] text-[12px] font-extrabold cursor-pointer ${
                          toy.owned
                            ? 'bg-[#EFE7E0] text-[#8A747E]'
                            : 'buttercup-cta text-[#4B3C46] disabled:opacity-50'
                        }`}
                      >
                        {toy.owned ? 'In Yard' : 'Buy'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {shopTab === 'hats' && (
                <div className="space-y-2">
                  {allHats.map((item) => {
                    const canAfford = coins >= item.cost;
                    return (
                      <div
                        key={item.id}
                        className="bg-[#FFF6FA] border border-[#F3DCE6] rounded-2xl p-2.5 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-[#FFFDF9] border border-[#E5D7CE] flex items-center justify-center">
                              <HatStickerIcon hatId={item.id} className="w-7 h-7" />
                            </div>
                            <div>
                              <div className="font-display text-[13.5px] font-extrabold text-[#4B3C46]">
                                {item.name}
                              </div>
                              <div className="text-[11px] font-bold text-[#8A747E] tabular-nums inline-flex items-center gap-1">
                                {item.owned ? (
                                  <span>Owned · Tap a pet to wear</span>
                                ) : (
                                  <>
                                    <span>{item.cost}</span>
                                    <PawCoinIcon className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {!item.owned ? (
                            <button
                              type="button"
                              disabled={!canAfford}
                              onClick={() => onBuyItem(item)}
                              className="buttercup-cta rounded-full px-4 min-h-[40px] text-[12px] font-extrabold text-[#4B3C46] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                            >
                              Buy
                            </button>
                          ) : (
                            <span className="rounded-full px-3 py-1 bg-[#E8F8EC] border border-[#BFE6C9] text-[11px] font-extrabold text-[#3F7E4E]">
                              Owned ✓
                            </span>
                          )}
                        </div>

                        {item.owned && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[#F5E3EB]">
                            {pets.map((pet) => {
                              const wearing = pet.accessory === item.id;
                              return (
                                <button
                                  key={pet.id}
                                  type="button"
                                  onClick={() =>
                                    onEquipAccessory(
                                      pet.id,
                                      wearing ? null : item.id
                                    )
                                  }
                                  className={`rounded-full px-2.5 min-h-[34px] text-[11px] font-extrabold border transition-transform active:scale-95 cursor-pointer flex items-center gap-1 ${
                                    wearing
                                      ? 'bg-[#FFE07D] border-[#C99D66] text-[#4B3C46]'
                                      : 'bg-[#FFFDF9] border-[#E5D3CA] text-[#7D6973]'
                                  }`}
                                >
                                  <span>{pet.name}</span>
                                  {wearing && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {energyItems.map((item) => {
                    const canAfford = coins >= item.cost;
                    return (
                      <div
                        key={item.id}
                        className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-[#FFFDF9] border border-[#E5D7CE] flex items-center justify-center text-lg">
                            {item.icon}
                          </div>
                          <div>
                            <div className="font-display text-[13.5px] font-extrabold text-[#4B3C46]">
                              {item.name}
                            </div>
                            <div className="text-[11px] font-bold text-[#8A747E] tabular-nums">
                              {item.cost} 🪙
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onBuyItem(item)}
                          className="buttercup-cta rounded-full px-4 min-h-[40px] text-[12px] font-extrabold text-[#4B3C46] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                        >
                          Buy
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VISIT NEIGHBORS */}
          {modal === 'visit' && (
            <div className="space-y-2">
              {neighbors.map((n) => (
                <div
                  key={n.id}
                  className="bg-[#F7F3FF] border border-[#DFD2F7] rounded-2xl p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#FFFDF9] border border-[#DFD2F7] overflow-hidden shrink-0">
                      <CroppedPetCutout
                        photoUrl={n.pets[0].photoUrl}
                        alt={n.pets[0].name}
                        mode="studio"
                        className="w-10 h-10"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-[13.5px] font-extrabold text-[#4B3C46] truncate">
                        {n.ownerName}
                      </div>
                      <div className="text-[10.5px] font-bold text-[#8A747E] truncate">
                        {n.gardenName} · 🏪 {n.marketStock.filter((m) => !m.sold).length}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onVisitNeighbor(n.id)}
                    className="buttercup-cta rounded-full px-4 min-h-[42px] text-[12px] font-extrabold text-[#4B3C46] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    🏡 Visit
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* NEIGHBOR ROADSIDE MARKET STALL */}
          {modal === 'neighborMarket' && visitingNeighbor && (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-[#FFF8DC] border border-[#F0DFA5] rounded-xl px-3 py-1.5 text-[12px] font-extrabold text-[#4B3C46]">
                <span>Your Coins</span>
                <span className="tabular-nums">{coins.toLocaleString()} 🪙</span>
              </div>

              {visitingNeighbor.marketStock.map((listing) => {
                const meta = FOOD_META[listing.item];
                return (
                  <div
                    key={listing.id}
                    className="bg-[#F0FAF2] border border-[#CFEBD5] rounded-2xl p-2.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{meta.icon}</span>
                      <div>
                        <div className="font-display text-[14px] font-extrabold text-[#4B3C46]">
                          {meta.name} x{listing.qty}
                        </div>
                        <div className="text-[11px] font-bold text-[#8A747E] tabular-nums">
                          {listing.price} 🪙
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={listing.sold || coins < listing.price}
                      onClick={() =>
                        onBuyFromNeighborMarket(visitingNeighbor.id, listing.id)
                      }
                      className={`rounded-full px-4 min-h-[42px] text-[12px] font-extrabold cursor-pointer ${
                        listing.sold
                          ? 'bg-[#EFE7E0] text-[#8A747E]'
                          : 'buttercup-cta text-[#4B3C46] disabled:opacity-45'
                      }`}
                    >
                      {listing.sold ? 'Bought ✓' : 'Buy'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* BAIT & RESCUE (Separated from Pet-Specific Feeding) */}
          {modal === 'bag' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-1 bg-[#F7F1EB] rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setBagTab('bait')}
                  className={`rounded-full min-h-[40px] text-[12px] font-extrabold cursor-pointer whitespace-nowrap ${
                    bagTab === 'bait'
                      ? 'bg-[#FFFDF9] text-[#4B3C46] shadow-xs'
                      : 'text-[#8A747E]'
                  }`}
                >
                  🐟 Bait
                </button>
                <button
                  type="button"
                  onClick={() => setBagTab('rescue')}
                  className={`rounded-full min-h-[40px] text-[12px] font-extrabold cursor-pointer whitespace-nowrap ${
                    bagTab === 'rescue'
                      ? 'bg-[#FFFDF9] text-[#4B3C46] shadow-xs'
                      : 'text-[#8A747E]'
                  }`}
                >
                  🐾 Rescue{!luredRescued ? ' !' : ''}
                </button>
              </div>

              {bagTab === 'bait' && (
                <div className="space-y-2">
                  {[
                    {
                      name: 'Salmon Pate',
                      icon: '🐟',
                      hint: 'Lures cozy cats',
                      bowlBg: 'bg-[#FFEAF2] border-[#F4C4D8]',
                    },
                    {
                      name: 'Honey Biscuit',
                      icon: '🦴',
                      hint: 'Lures playful pups',
                      bowlBg: 'bg-[#FFF5D6] border-[#F0D994]',
                    },
                    {
                      name: 'Clover Salad',
                      icon: '🥕',
                      hint: 'Lures fluffy bunnies',
                      bowlBg: 'bg-[#E8F8EC] border-[#BFE6C9]',
                    },
                  ].map((b) => {
                    const isActive = activeBait === b.name;
                    return (
                      <div
                        key={b.name}
                        className={`rounded-2xl p-2.5 border flex items-center justify-between gap-2 ${
                          isActive
                            ? 'bg-[#FFF8DC] border-[#E5C97B]'
                            : 'bg-[#FFF9F2] border-[#EFE0D4]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center shrink-0 relative ${b.bowlBg}`}
                          >
                            <BaitStickerIcon baitName={b.name} className="w-6 h-6" />
                            <span className="w-6 h-1.5 rounded-full bg-[#C99D66]/45 mt-0.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-display text-[14px] font-extrabold text-[#4B3C46] truncate">
                              {b.name}
                            </div>
                            <div className="text-[11px] font-bold text-[#8A747E] truncate">
                              {isActive ? 'Placed in yard ✓' : b.hint}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onPlaceBait(b.name)}
                          className={`rounded-full px-4 min-h-[42px] text-[12px] font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-transform active:scale-95 ${
                            isActive
                              ? 'bg-[#E8F8EC] border-2 border-[#9AD6A9] text-[#3B7A4A]'
                              : 'buttercup-cta text-[#4B3C46]'
                          }`}
                        >
                          {isActive ? 'Placed ✓' : 'Set'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {bagTab === 'rescue' && (
                <div>
                  {!luredRescued ? (
                    <div className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-3 flex flex-col items-center text-center gap-2.5">
                      <div className="w-28 h-28 rounded-2xl border-2 border-[#E2CBBF] overflow-hidden bg-[#FFFDF9] -rotate-1">
                        <img
                          src={PET_IMAGES.luredStrayCorgi}
                          alt="Lured Corgi"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="font-display text-[15px] font-extrabold text-[#4B3C46]">
                        Biscuit
                      </div>
                      <button
                        type="button"
                        onClick={onRescueStray}
                        className="buttercup-cta w-full rounded-full py-2.5 px-4 font-display text-[14px] font-extrabold text-[#4B3C46] cursor-pointer"
                      >
                        🐾 Adopt
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#F0FAF2] border border-[#CFEBD5] rounded-2xl p-4 text-center space-y-1">
                      <Sparkles className="w-6 h-6 text-[#F5C34B] mx-auto" />
                      <div className="font-display text-[14px] font-extrabold text-[#4B3C46]">
                        All Rescued ✓
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {modal === 'snap' && (
            <div className="space-y-2.5">
              <div className="bg-[#FFF5F8] border border-[#F3D7E2] rounded-2xl p-2.5 text-center">
                <div className="font-display text-[15px] font-extrabold text-[#4B3C46]">
                  📌 {theme}
                </div>
              </div>

              <button
                type="button"
                onClick={onUseSampleSnap}
                className="buttercup-cta w-full rounded-full min-h-[46px] py-3 px-4 font-display text-[15px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-5 h-5 stroke-[2.4]" />
                <span>Sample Puppy</span>
              </button>
            </div>
          )}

          {modal === 'rescue' && (
            <div>
              {!luredRescued ? (
                <div className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-3 flex flex-col items-center text-center gap-2.5">
                  <div className="w-28 h-28 rounded-2xl border-2 border-[#E2CBBF] overflow-hidden bg-[#FFFDF9] -rotate-1">
                    <img
                      src={PET_IMAGES.luredStrayCorgi}
                      alt="Lured Corgi"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-display text-[15px] font-extrabold text-[#4B3C46]">
                    Biscuit
                  </div>
                  <button
                    type="button"
                    onClick={onRescueStray}
                    className="buttercup-cta w-full rounded-full py-2.5 px-4 font-display text-[14px] font-extrabold text-[#4B3C46] cursor-pointer"
                  >
                    🐾 Adopt
                  </button>
                </div>
              ) : (
                <div className="bg-[#F0FAF2] border border-[#CFEBD5] rounded-2xl p-4 text-center space-y-1">
                  <Sparkles className="w-6 h-6 text-[#F5C34B] mx-auto" />
                  <div className="font-display text-[14px] font-extrabold text-[#4B3C46]">
                    All Rescued ✓
                  </div>
                </div>
              )}
            </div>
          )}

          {modal === 'album' && (
            <div className="space-y-2.5">
              {onOpenGallery && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenGallery();
                  }}
                  className="buttercup-cta w-full rounded-full min-h-[46px] px-4 font-display text-[13.5px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CrystalMintIcon className="w-4 h-4" />
                  <span>Open Public Passport Gallery</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                {album.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onOpenAlbumItem(entry)}
                    className="bg-[#FFF9F5] border border-[#EFE0D4] rounded-2xl p-2 text-left active:scale-95 transition-transform cursor-pointer"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-[#FFFDF9]">
                      <img
                        src={resolveAssetUrl(entry.photoUrl)}
                        alt={entry.petName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="font-display text-[12.5px] font-extrabold text-[#4B3C46] truncate">
                        {entry.petName}
                      </span>
                      <span className="text-[11px] font-extrabold text-[#8A747E] tabular-nums">
                        {entry.overallScore}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {modal === 'profile' && (
            <div className="space-y-2.5">
              <div className="bg-[#FFF5F8] border border-[#F3D7E2] rounded-2xl p-3 flex items-center gap-3">
                <img
                  src={PET_IMAGES.croppedCalicoCat}
                  alt="Keeper avatar"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl border border-[#E5D3CA] object-cover"
                />
                <div>
                  <div className="font-display text-[15px] font-extrabold text-[#4B3C46]">
                    {keeperName} · Lv.{level}
                  </div>
                  <div className="text-[12px] font-bold text-[#8A747E] inline-flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-0.5">
                      <FlameMiniIcon className="w-3.5 h-3.5" />
                      {streakDays}d
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-0.5">
                      <ShieldMiniIcon className="w-3.5 h-3.5" />
                      {fenceHours}h
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-0.5">
                      <LightningEnergyIcon className="w-4 h-4" />
                      {energy}/{maxEnergy}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[12px] font-extrabold text-[#4B3C46]">
                <div className="bg-[#F9F3E5] rounded-xl p-2 text-center tabular-nums">
                  Pats: {limits.petCoinsUsed}/{limits.petCoinsMax}
                </div>
                <div className="bg-[#E7F5FF] rounded-xl p-2 text-center tabular-nums">
                  Play: {limits.playCoinsUsed}/{limits.playCoinsMax}
                </div>
                <div className="bg-[#E8F8EC] rounded-xl p-2 text-center tabular-nums">
                  Feed: {limits.feedCoinsUsed}/{limits.feedCoinsMax}
                </div>
                <div className="bg-[#FFF8DC] rounded-xl p-2 text-center tabular-nums">
                  Clover: {limits.cloverCoinsUsed}/{limits.cloverCoinsMax}
                </div>
              </div>

              {(onOpenWallet || onOpenQuest) && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {onOpenQuest && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenQuest();
                      }}
                      className="cream-btn rounded-full min-h-[44px] px-3 text-[12px] font-extrabold text-[#4B3C46] bg-[#FFF8DC] cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <TrophyMiniIcon className="w-4 h-4" />
                      <span>First Bond</span>
                    </button>
                  )}
                  {onOpenWallet && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenWallet();
                      }}
                      className="cream-btn rounded-full min-h-[44px] px-3 text-[12px] font-extrabold text-[#4B3C46] bg-[#EFF8FF] cursor-pointer inline-flex items-center justify-center gap-1.5 truncate"
                    >
                      <Wallet className="w-4 h-4 text-[#4F7EA6] shrink-0" />
                      <span className="truncate">{walletLabel ?? 'Core Wallet'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
