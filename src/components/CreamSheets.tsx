import React, { useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ExternalLink,
  Heart,
  Link2,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import {
  DailyLimits,
  FirstBondQuestStatus,
  FoodItemType,
  GardenToy,
  JudgeReport,
  KeeperAuthUser,
  NeighborGarden,
  SanctuaryPet,
  ShopItem,
  WalletInfo,
  Web3ConfigStatus,
} from '../types';
import {
  FIRST_BOND_QUEST_REWARD,
  MINT_ELIGIBILITY_RULES,
} from '../shared/gameMeta';
import {
  AVALANCHE_MAINNET_CHAIN_ID,
  formatEvmChainName,
  getWalletSecurityContext,
} from '../lib/walletClient';
import { CrystalMintIcon, PawCoinIcon } from './HandDrawnAssets';
import { CroppedPetCutout } from './CroppedPetCutout';
import { FOOD_META } from './FarmScreen';
import { SanctuaryModalType } from './SanctuaryScreen';

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
  selectedPetId?: string | null;
  shopItems: ShopItem[];
  toys: GardenToy[];
  foodInventory: Record<FoodItemType, number>;
  limits: DailyLimits;
  neighbors: NeighborGarden[];
  visitingNeighbor: NeighborGarden | null;
  album: JudgeReport[];
  luredRescued: boolean;
  activeBait: string | null;
  // Auth, Quest & Web3 Passport props (used inside 'profile' modal only)
  authUser: KeeperAuthUser | null;
  authLoading: boolean;
  firstBondQuest: FirstBondQuestStatus;
  linkedWallet: WalletInfo | null;
  browserWallet: {
    available: boolean;
    address: string | null;
    chainId: number | null;
    providerName: string;
    isCoreWallet: boolean;
  };
  web3Status: Web3ConfigStatus | null;
  profileBusy: string | null;
  profileFeedback: { type: 'ok' | 'err'; text: string } | null;
  onSignInGoogle: () => void;
  onSignOut: () => void;
  onClaimFirstBondQuest: (petUid: string) => void;
  onConnectAndVerifyWallet: () => void;
  onSwitchToFuji: () => void;
  onUnlinkWallet: () => void;
  onMintPassportFromProfile: (petUid: string) => void;
  onReconcilePet: (petUid: string) => void;
  // Game callbacks
  onSelectPet?: (petId: string) => void;
  onBuyItem: (item: ShopItem) => void;
  onBuyToy: (toy: GardenToy) => void;
  onFeedPet: (food: FoodItemType, petId?: string) => void;
  onVisitNeighbor: (neighborId: string) => void;
  onBuyFromNeighborMarket: (neighborId: string, listingId: string) => void;
  onEquipAccessory: (petId: string, accessoryId: string | null) => void;
  onCarePet: (petId: string) => void;
  onUseSampleSnap: () => void;
  onUploadPhoto: (file: File) => void;
  onOpenDiscoverCamera?: () => void;
  onRescueStray: () => void;
  onPlaceBait: (baitName: string) => void;
  onOpenAlbumItem: (report: JudgeReport) => void;
}

function shortAddr(addr: string | null | undefined): string {
  if (!addr) return 'Unlinked';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
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
  selectedPetId,
  shopItems,
  toys,
  foodInventory,
  limits,
  neighbors,
  visitingNeighbor,
  album,
  luredRescued,
  activeBait,
  authUser,
  authLoading,
  firstBondQuest,
  linkedWallet,
  browserWallet,
  web3Status,
  profileBusy,
  profileFeedback,
  onSignInGoogle,
  onSignOut,
  onClaimFirstBondQuest,
  onConnectAndVerifyWallet,
  onSwitchToFuji,
  onUnlinkWallet,
  onMintPassportFromProfile,
  onReconcilePet,
  onSelectPet,
  onBuyItem,
  onBuyToy,
  onFeedPet,
  onVisitNeighbor,
  onBuyFromNeighborMarket,
  onEquipAccessory,
  onCarePet,
  onUseSampleSnap,
  onUploadPhoto,
  onOpenDiscoverCamera,
  onRescueStray,
  onPlaceBait,
  onOpenAlbumItem,
}) => {
  const [shopTab, setShopTab] = useState<'toys' | 'hats'>('toys');
  const [bagTab, setBagTab] = useState<'food' | 'bait'>('food');
  const [profileTab, setProfileTab] = useState<'keeper' | 'wallet' | 'passports'>(
    'keeper'
  );
  const [selectedQuestPetUid, setSelectedQuestPetUid] = useState<string | null>(
    null
  );

  if (!modal) return null;

  const ownedAccessories = shopItems.filter(
    (item) => item.kind === 'accessory' && item.owned
  );

  const totalFood = (Object.keys(foodInventory) as FoodItemType[]).reduce(
    (sum, k) => sum + foodInventory[k],
    0
  );

  const serverPets = pets.filter((p) => Boolean(p.petUid));
  const activeQuestPet =
    serverPets.find((p) => p.petUid === selectedQuestPetUid) ??
    serverPets[0] ??
    null;

  const activeSanctuaryPet =
    pets.find((p) => p.id === selectedPetId || p.petUid === selectedPetId) ??
    pets[0] ??
    null;

  const isWrongNetwork =
    Boolean(browserWallet.address) &&
    browserWallet.chainId !== null &&
    browserWallet.chainId !== MINT_ELIGIBILITY_RULES.FUJI_CHAIN_ID;
  const securityCtx = getWalletSecurityContext();
  const isFullScreenModal = modal === 'profile' || modal === 'farmhouse';

  return (
    <div
      className="absolute inset-0 z-40 bg-[#FFFDF9]/75 backdrop-blur-xs flex items-end justify-center p-3"
      role="dialog"
      aria-modal="true"
    >
      <div className={`cream-card w-full ${isFullScreenModal ? 'h-[94%] max-h-[94%]' : 'max-h-[85%]'} flex flex-col overflow-hidden`}>
        <div className="px-4 py-3 border-b border-[#F2E6DC] flex items-center justify-between bg-[#FFFDF9]">
          <h3 className="font-display text-[16px] font-extrabold text-[#4B3C46]">
            {modal === 'farmhouse' && '🏡 Pets'}
            {modal === 'shop' && '🛍️ Shop'}
            {modal === 'visit' && '🏘️ Neighbors'}
            {modal === 'neighborMarket' &&
              `🏪 ${visitingNeighbor?.ownerName ?? 'Neighbor'}’s Market`}
            {modal === 'bag' && '🎒 Pantry & Bait'}
            {modal === 'snap' && '📷 Snap'}
            {modal === 'rescue' && '🐾 Rescue'}
            {modal === 'album' && '📖 Album'}
            {modal === 'profile' && `🐱 Keeper Profile · Lv.${level}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-[#FFF5F8] border border-[#E5D3CA] flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-3.5 overflow-y-auto flex-1 space-y-2.5 bg-[#FFFDF9]">
          {/* FARMHOUSE PETS + DAILY CAPS */}
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
                {pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-2 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-xl bg-[#E8F8EC] border border-[#CFEBD5] flex items-center justify-center shrink-0 overflow-hidden">
                        <CroppedPetCutout
                          photoUrl={pet.photoUrl}
                          alt={pet.name}
                          species={pet.species}
                          mode={pet.cutoutMode ?? 'auto'}
                          accessory={pet.accessory}
                          className="w-11 h-11"
                          bbox={pet.box_2d}
                        />
                      </div>
                      <div>
                        <div className="font-display text-[14px] font-extrabold text-[#4B3C46] flex items-center gap-1">
                          <span>{pet.name}</span>
                          {pet.minted && <CrystalMintIcon className="w-3.5 h-3.5" />}
                        </div>
                        <div className="text-[11px] font-bold text-[#8A747E] capitalize tabular-nums">
                          {pet.species}
                          {typeof pet.bondXp === 'number'
                            ? ` · ${pet.bondXp} Bond`
                            : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onSelectPet && (
                        <button
                          type="button"
                          onClick={() => onSelectPet(pet.id)}
                          className={`rounded-full px-2 py-1 text-[10.5px] font-extrabold cursor-pointer border ${
                            activeSanctuaryPet?.id === pet.id
                              ? 'bg-[#FFE07D] border-[#C99D66] text-[#4B3C46]'
                              : 'bg-[#FFFDF9] border-[#E5D7CE] text-[#8A747E]'
                          }`}
                        >
                          {activeSanctuaryPet?.id === pet.id ? 'Active ✓' : 'Select'}
                        </button>
                      )}
                      {ownedAccessories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextIdx =
                              ownedAccessories.findIndex(
                                (a) => a.id === pet.accessory
                              ) + 1;
                            const nextAcc =
                              nextIdx >= ownedAccessories.length
                                ? null
                                : ownedAccessories[nextIdx].id;
                            onEquipAccessory(pet.id, nextAcc);
                          }}
                          className="cream-btn rounded-full px-2.5 py-1 text-[11px] font-extrabold text-[#4B3C46] cursor-pointer"
                        >
                          {pet.accessory ? 'Swap' : 'Hat'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPet?.(pet.id);
                          onCarePet(pet.id);
                        }}
                        className="buttercup-cta rounded-full px-2.5 py-1 text-[11px] font-extrabold text-[#4B3C46] flex items-center gap-1 cursor-pointer"
                      >
                        <Heart className="w-3 h-3 fill-[#FF85A1] text-[#FF85A1]" />
                        <span>Pet</span>
                      </button>
                    </div>
                  </div>
                ))}
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
                    className={`rounded-full py-1 text-[12px] font-extrabold cursor-pointer ${
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
                        <div className="w-10 h-10 rounded-xl bg-[#FFFDF9] border border-[#D4E7FA] flex items-center justify-center text-xl">
                          {toy.icon}
                        </div>
                        <div>
                          <div className="font-display text-[13.5px] font-extrabold text-[#4B3C46]">
                            {toy.name}
                          </div>
                          <div className="text-[11px] font-bold text-[#8A747E] tabular-nums">
                            {toy.cost} 🪙
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={toy.owned || coins < toy.cost}
                        onClick={() => onBuyToy(toy)}
                        className={`rounded-full px-3.5 py-1 text-[12px] font-extrabold cursor-pointer ${
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
                  {shopItems.map((item) => {
                    const canAfford = coins >= item.cost;
                    return (
                      <div
                        key={item.id}
                        className="bg-[#FFF6FA] border border-[#F3DCE6] rounded-2xl p-2.5 flex items-center justify-between gap-2"
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
                          disabled={item.owned || !canAfford}
                          onClick={() => onBuyItem(item)}
                          className={`rounded-full px-3.5 py-1 text-[12px] font-extrabold cursor-pointer whitespace-nowrap ${
                            item.owned
                              ? 'bg-[#EFE7E0] text-[#8A747E]'
                              : 'buttercup-cta text-[#4B3C46] disabled:opacity-50'
                          }`}
                        >
                          {item.owned ? 'Owned' : 'Buy'}
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
                    className="buttercup-cta rounded-full px-3 py-1 text-[11.5px] font-extrabold text-[#4B3C46] cursor-pointer whitespace-nowrap shrink-0"
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
                      className={`rounded-full px-3.5 py-1 text-[12px] font-extrabold cursor-pointer ${
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

          {/* BAG: HARVESTED FOOD + PATE BAIT */}
          {modal === 'bag' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-1 bg-[#F7F1EB] rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setBagTab('food')}
                  className={`rounded-full py-1 text-[12px] font-extrabold cursor-pointer ${
                    bagTab === 'food'
                      ? 'bg-[#FFFDF9] text-[#4B3C46] shadow-xs'
                      : 'text-[#8A747E]'
                  }`}
                >
                  🧺 Food ({totalFood})
                </button>
                <button
                  type="button"
                  onClick={() => setBagTab('bait')}
                  className={`rounded-full py-1 text-[12px] font-extrabold cursor-pointer ${
                    bagTab === 'bait'
                      ? 'bg-[#FFFDF9] text-[#4B3C46] shadow-xs'
                      : 'text-[#8A747E]'
                  }`}
                >
                  🐟 Bait
                </button>
              </div>

              {bagTab === 'food' && (
                <div className="space-y-2">
                  {pets.length > 0 && (
                    <div className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-2 space-y-1.5">
                      <div className="text-[11px] font-extrabold text-[#5E4C56]">
                        Feeding Companion: {activeSanctuaryPet?.name ?? 'Pet'}
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                        {pets.map((pet) => {
                          const isSelected = activeSanctuaryPet?.id === pet.id;
                          return (
                            <button
                              key={pet.id}
                              type="button"
                              onClick={() => onSelectPet?.(pet.id)}
                              className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold cursor-pointer whitespace-nowrap border ${
                                isSelected
                                  ? 'bg-[#FFE07D] border-[#D8B44B] text-[#4B3C46]'
                                  : 'bg-[#FFFDF9] border-[#E5D7CE] text-[#8A747E]'
                              }`}
                            >
                              {pet.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(Object.keys(FOOD_META) as FoodItemType[]).map((foodKey) => {
                    const meta = FOOD_META[foodKey];
                    const count = foodInventory[foodKey];
                    return (
                      <div
                        key={foodKey}
                        className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-2.5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{meta.icon}</span>
                          <div>
                            <div className="font-display text-[14px] font-extrabold text-[#4B3C46]">
                              {meta.name}
                            </div>
                            <div className="text-[11px] font-bold text-[#8A747E] tabular-nums">
                              Basket: {count}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={count === 0}
                          onClick={() =>
                            onFeedPet(foodKey, activeSanctuaryPet?.id)
                          }
                          className="buttercup-cta rounded-full px-3.5 py-1 text-[12px] font-extrabold text-[#4B3C46] disabled:opacity-45 cursor-pointer"
                        >
                          Feed {activeSanctuaryPet?.name ?? ''}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {bagTab === 'bait' && (
                <div className="space-y-2">
                  {[
                    { name: 'Salmon Pate', icon: '🐟' },
                    { name: 'Honey Biscuit', icon: '🦴' },
                    { name: 'Clover Salad', icon: '🥕' },
                  ].map((b) => {
                    const isActive = activeBait === b.name;
                    return (
                      <button
                        key={b.name}
                        type="button"
                        onClick={() => onPlaceBait(b.name)}
                        className={`w-full rounded-2xl p-2.5 border flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-[#FFF3BF] border-[#E0BE63]'
                            : 'bg-[#FFF7FA] border-[#F0D8E2]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{b.icon}</span>
                          <span className="font-display text-[14px] font-extrabold text-[#4B3C46]">
                            {b.name}
                          </span>
                        </div>
                        <span className="font-display text-[12px] font-extrabold text-[#8A747E]">
                          {isActive ? 'Placed ✓' : 'Set'}
                        </span>
                      </button>
                    );
                  })}
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

              {web3Status && web3Status.geminiConfigured === false && (
                <div className="bg-[#FFF8DC] border border-[#E6D08A] rounded-2xl px-3 py-2 text-[11px] font-bold text-[#6E5321] leading-snug">
                  Live AI Photo Judging requires{' '}
                  <code className="font-mono">GEMINI_API_KEY</code> in Settings
                  &gt; Secrets. Uploaded photos will not receive fabricated
                  scores. Sanctuary, Farm, Pet Care &amp; First Bond Quest remain
                  playable.
                </div>
              )}

              {onOpenDiscoverCamera && (
                <button
                  type="button"
                  onClick={onOpenDiscoverCamera}
                  className="buttercup-cta w-full rounded-full py-3 px-4 font-display text-[14.5px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-transform"
                >
                  <Camera className="w-5 h-5 stroke-[2.4]" />
                  <span>Open Camera / Webcam</span>
                </button>
              )}

              {/* Mobile Rear Camera Shortcut */}
              <label className="cream-btn w-full rounded-full py-2.5 px-4 font-display text-[13.5px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer bg-[#FFF9F2] hover:bg-[#F7EFE6] border border-[#E8D9CD]">
                <Camera className="w-4 h-4 stroke-[2.2] text-[#C99D66]" />
                <span>Take Photo (Rear Camera)</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadPhoto(file);
                    e.target.value = '';
                  }}
                />
              </label>

              {/* Gallery / File Picker */}
              <label className="cream-btn w-full rounded-full py-2.5 px-4 font-display text-[13.5px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer bg-[#EFF8FF]">
                <Upload className="w-4 h-4 stroke-[2.4]" />
                <span>Choose from Gallery / Files</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadPhoto(file);
                    e.target.value = '';
                  }}
                />
              </label>

              {/* Sample Puppy for quick test */}
              <button
                type="button"
                onClick={onUseSampleSnap}
                className="w-full rounded-full py-2 px-4 text-[12px] font-bold text-[#8A747E] hover:text-[#4B3C46] hover:bg-[#F5EDE6] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>🐶 Use Sample Puppy Photo</span>
              </button>
            </div>
          )}

          {modal === 'rescue' && (
            <div>
              {!luredRescued ? (
                <div className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-3 flex flex-col items-center text-center gap-2.5">
                  <div className="w-28 h-28 rounded-2xl border-2 border-[#E2CBBF] overflow-hidden bg-[#FFFDF9] -rotate-1">
                    <img
                      src="/src/assets/images/lured_stray_corgi_1794627550798.jpg"
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
                      src={entry.photoUrl}
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
          )}

          {/* KEEPER PROFILE: AUTH + FUJI WALLET + PET PASSPORTS & ADOPTION */}
          {modal === 'profile' && (
            <div className="space-y-2.5">
              {/* Pastel Sub-Tabs inside Keeper Profile */}
              <div className="grid grid-cols-3 gap-1 bg-[#F7F1EB] rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setProfileTab('keeper')}
                  className={`rounded-full py-1.5 text-[11.5px] font-extrabold cursor-pointer ${
                    profileTab === 'keeper'
                      ? 'bg-[#FFFDF9] text-[#4B3C46] shadow-xs'
                      : 'text-[#8A747E]'
                  }`}
                >
                  🐱 Keeper
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab('wallet')}
                  className={`rounded-full py-1.5 text-[11.5px] font-extrabold cursor-pointer ${
                    profileTab === 'wallet'
                      ? 'bg-[#FFFDF9] text-[#4B3C46] shadow-xs'
                      : 'text-[#8A747E]'
                  }`}
                >
                  🦊 Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab('passports')}
                  className={`rounded-full py-1.5 text-[11.5px] font-extrabold cursor-pointer relative ${
                    profileTab === 'passports'
                      ? 'bg-[#FFFDF9] text-[#4B3C46] shadow-xs'
                      : 'text-[#8A747E]'
                  }`}
                >
                  📜 Passports
                </button>
              </div>

              {profileFeedback && (
                <div
                  className={`rounded-2xl px-3 py-2 text-[11.5px] font-bold border ${
                    profileFeedback.type === 'ok'
                      ? 'bg-[#F0FAF2] border-[#BCE2C5] text-[#356845]'
                      : 'bg-[#FFF0F4] border-[#ECC2CF] text-[#7D3A4F]'
                  }`}
                >
                  {profileFeedback.text}
                </div>
              )}

              {profileTab === 'keeper' && (
                <div className="space-y-2.5">
                  <div className="bg-[#FFF5F8] border border-[#F3D7E2] rounded-2xl p-3 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src="/src/assets/images/cropped_calico_cat_1794637541476.jpg"
                        alt="Keeper avatar"
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-2xl border border-[#E5D3CA] object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-display text-[14.5px] font-extrabold text-[#4B3C46] truncate">
                          {authUser ? authUser.displayName : 'Guest Keeper'} · Lv.
                          {level}
                        </div>
                        <div className="text-[11px] font-bold text-[#8A747E] truncate">
                          {authUser
                            ? authUser.email
                            : 'Server-saved Guest Sanctuary · Sign in to verify wallet & mint'}
                        </div>
                        <div className="text-[11px] font-bold text-[#8A747E] mt-0.5 tabular-nums">
                          🔥 {streakDays}d · 🛡️ {fenceHours}h · ⚡ {energy}/
                          {maxEnergy}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Google Auth Sync Card */}
                  <div className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-2.5 flex items-center justify-between gap-2">
                    <div className="text-[11.5px] font-bold text-[#5E4C56]">
                      {authLoading
                        ? 'Checking Keeper session...'
                        : authUser
                        ? 'Cloud Sanctuary Synced'
                        : 'Sign in with Google to merge guest progress & mint'}
                    </div>
                    {authUser ? (
                      <button
                        type="button"
                        disabled={Boolean(profileBusy)}
                        onClick={onSignOut}
                        className="cream-btn rounded-full px-3 py-1.5 text-[11.5px] font-extrabold text-[#4B3C46] flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={authLoading || Boolean(profileBusy)}
                        onClick={onSignInGoogle}
                        className="buttercup-cta rounded-full px-3 py-1.5 text-[11.5px] font-extrabold text-[#4B3C46] flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Google Sign-In</span>
                      </button>
                    )}
                  </div>

                  {/* Per-Pet First Bond Quest Card */}
                  <div className="bg-[#FFF8DC] border border-[#F0DFA5] rounded-2xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-display text-[13px] font-extrabold text-[#4B3C46]">
                        🌟 First Bond Quest
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums whitespace-nowrap ${
                          firstBondQuest.claimed
                            ? 'bg-[#E8F8EC] text-[#356845] border border-[#B4DFBE]'
                            : 'bg-[#FFFDF9] text-[#6E5321] border border-[#E5D3A3]'
                        }`}
                      >
                        {firstBondQuest.claimed
                          ? 'Claimed ✓'
                          : `+${FIRST_BOND_QUEST_REWARD.COINS} 🪙 · +${FIRST_BOND_QUEST_REWARD.EXP} EXP`}
                      </span>
                    </div>

                    <p className="text-[10.5px] font-bold text-[#6E6068] leading-snug">
                      Complete Pet, Feed, Play and reach{' '}
                      {firstBondQuest.minBondXp} Bond XP on one single pet.
                    </p>

                    {serverPets.length > 0 ? (
                      <>
                        {serverPets.length > 1 && (
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                            {serverPets.map((pet) => {
                              const selected =
                                activeQuestPet?.petUid === pet.petUid;
                              return (
                                <button
                                  key={pet.petUid}
                                  type="button"
                                  onClick={() =>
                                    setSelectedQuestPetUid(pet.petUid!)
                                  }
                                  className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold cursor-pointer whitespace-nowrap border ${
                                    selected
                                      ? 'bg-[#FFE07D] border-[#D8B44B] text-[#4B3C46]'
                                      : 'bg-[#FFFDF9] border-[#E5D7CE] text-[#8A747E]'
                                  }`}
                                >
                                  {pet.name}
                                  {firstBondQuest.claimedPetUid === pet.petUid
                                    ? ' ★'
                                    : ''}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {activeQuestPet && (() => {
                          const petDone = Boolean(activeQuestPet.questPetDone);
                          const feedDone = Boolean(activeQuestPet.questFeedDone);
                          const playDone = Boolean(activeQuestPet.questPlayDone);
                          const bondVal = activeQuestPet.bondXp ?? 0;
                          const bondMet = bondVal >= firstBondQuest.minBondXp;
                          const bondPct = Math.min(
                            100,
                            Math.round(
                              (bondVal / firstBondQuest.minBondXp) * 100
                            )
                          );
                          const canClaim =
                            !firstBondQuest.claimed &&
                            petDone &&
                            feedDone &&
                            playDone &&
                            bondMet;

                          return (
                            <div className="bg-[#FFFDF9] border border-[#EFE0D4] rounded-xl p-2 space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-extrabold text-[#4B3C46]">
                                <span className="truncate">
                                  Tracking: {activeQuestPet.name} (
                                  {activeQuestPet.species})
                                </span>
                                <span className="tabular-nums text-[#8A747E]">
                                  {bondVal}/{firstBondQuest.minBondXp} Bond
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5 text-[10.5px] font-extrabold text-center">
                                {[
                                  { label: '❤️ Pet', done: petDone },
                                  { label: '🥕 Feed', done: feedDone },
                                  { label: '🎾 Play', done: playDone },
                                ].map((step) => (
                                  <div
                                    key={step.label}
                                    className={`rounded-lg py-1 px-1.5 border ${
                                      step.done
                                        ? 'bg-[#E8F8EC] border-[#B4DFBE] text-[#356845]'
                                        : 'bg-[#FFF9F2] border-[#EFE0D4] text-[#8A747E]'
                                    }`}
                                  >
                                    <div>{step.label}</div>
                                    <div className="text-[9.5px]">
                                      {step.done ? 'Done ✓' : 'Pending'}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="w-full h-1.5 rounded-full bg-[#EFE3D8] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#F5C34B] transition-all duration-300"
                                  style={{ width: `${bondPct}%` }}
                                />
                              </div>

                              {firstBondQuest.claimed ? (
                                <div className="rounded-full bg-[#E8F8EC] border border-[#B4DFBE] py-1.5 text-center text-[11px] font-extrabold text-[#356845]">
                                  First Bond Quest Reward Claimed ✓
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={!canClaim || Boolean(profileBusy)}
                                  onClick={() =>
                                    onClaimFirstBondQuest(
                                      activeQuestPet.petUid!
                                    )
                                  }
                                  className="buttercup-cta w-full rounded-full py-1.5 px-3 text-[11.5px] font-extrabold text-[#4B3C46] disabled:opacity-45 cursor-pointer whitespace-nowrap"
                                >
                                  {profileBusy === 'quest'
                                    ? 'Claiming Reward...'
                                    : canClaim
                                    ? `Claim First Bond (+${firstBondQuest.rewardCoins} 🪙)`
                                    : 'Finish Steps & 100 Bond XP'}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <div className="text-[11px] font-bold text-[#8A747E]">
                        Syncing Sanctuary pet checklist...
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[12px] font-extrabold text-[#4B3C46]">
                    <div className="bg-[#F9F3E5] rounded-xl p-2 text-center tabular-nums">
                      ❤️ Pats: {limits.petCoinsUsed}/{limits.petCoinsMax}
                    </div>
                    <div className="bg-[#E7F5FF] rounded-xl p-2 text-center tabular-nums">
                      🎾 Play: {limits.playCoinsUsed}/{limits.playCoinsMax}
                    </div>
                    <div className="bg-[#E8F8EC] rounded-xl p-2 text-center tabular-nums">
                      🥕 Feed: {limits.feedCoinsUsed}/{limits.feedCoinsMax}
                    </div>
                    <div className="bg-[#FFF8DC] rounded-xl p-2 text-center tabular-nums">
                      🦋 Clover: {limits.cloverCoinsUsed}/
                      {limits.cloverCoinsMax}
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'wallet' && (
                <div className="space-y-2.5">
                  <div className="bg-[#F2F8FF] border border-[#D4E7FA] rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[13.5px] font-extrabold text-[#4B3C46] flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-[#4B7DA6]" />
                        <span>Avalanche Fuji Wallet</span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          linkedWallet
                            ? 'bg-[#E8F8EC] text-[#356845]'
                            : 'bg-[#FFFDF9] text-[#8A747E] border border-[#E5D7CE]'
                        }`}
                      >
                        {linkedWallet ? 'Verified ✓' : 'Optional'}
                      </span>
                    </div>

                    <p className="text-[11px] font-bold text-[#6E6068] leading-snug">
                      All Sanctuary &amp; Farm gameplay works without a wallet.
                      Connect Core Extension (recommended) or an injected EVM
                      wallet with a signed nonce only when minting a Pet
                      Passport.
                    </p>

                    {!authUser ? (
                      <button
                        type="button"
                        onClick={onSignInGoogle}
                        className="buttercup-cta w-full rounded-full py-2 text-[12px] font-extrabold text-[#4B3C46] cursor-pointer"
                      >
                        Sign in with Google First
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="bg-[#FFFDF9] border border-[#D4E7FA] rounded-xl p-2 text-[11px] font-bold text-[#4B3C46] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[#8A747E]">
                              Detected Provider:
                            </span>
                            <span
                              className={
                                browserWallet.isCoreWallet
                                  ? 'text-[#356845] font-extrabold'
                                  : !browserWallet.available
                                  ? 'text-[#B54B65] font-extrabold'
                                  : 'font-extrabold'
                              }
                            >
                              {browserWallet.available
                                ? browserWallet.isCoreWallet
                                  ? 'Core Extension ✓'
                                  : browserWallet.providerName
                                : browserWallet.providerName === 'Unsupported Wallet'
                                ? 'Unsupported Wallet'
                                : 'No Extension Detected'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#8A747E]">
                              Selected Account:
                            </span>
                            <span className="font-mono font-extrabold">
                              {browserWallet.address
                                ? shortAddr(browserWallet.address)
                                : 'None Selected'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#8A747E]">Linked Wallet:</span>
                            <span className="font-mono font-extrabold">
                              {shortAddr(linkedWallet?.address)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[#8A747E] shrink-0">
                              Browser Network:
                            </span>
                            <span
                              className={
                                !browserWallet.available
                                  ? 'text-[#B54B65] font-extrabold text-right'
                                  : browserWallet.chainId ===
                                    MINT_ELIGIBILITY_RULES.FUJI_CHAIN_ID
                                  ? 'text-[#356845] font-extrabold text-right'
                                  : isWrongNetwork
                                  ? 'text-[#B2772D] font-extrabold text-right'
                                  : 'font-extrabold text-right'
                              }
                            >
                              {!browserWallet.available
                                ? browserWallet.providerName === 'Unsupported Wallet'
                                  ? 'Unsupported EVM Provider'
                                  : 'No Extension Detected'
                                : browserWallet.chainId ===
                                  MINT_ELIGIBILITY_RULES.FUJI_CHAIN_ID
                                ? 'Avalanche Fuji Testnet (43113) ✓'
                                : browserWallet.chainId ===
                                  AVALANCHE_MAINNET_CHAIN_ID
                                ? 'Avalanche C-Chain Mainnet (43114)'
                                : browserWallet.chainId
                                ? formatEvmChainName(browserWallet.chainId)
                                : 'Not Connected'}
                            </span>
                          </div>
                        </div>

                        {browserWallet.chainId ===
                          AVALANCHE_MAINNET_CHAIN_ID && (
                          <div className="bg-[#FFF8DC] border border-[#E6D08A] rounded-xl px-2.5 py-1.5 text-[10.5px] font-bold text-[#6E5321] leading-snug">
                            Connected to{' '}
                            <span className="font-extrabold">
                              Avalanche C-Chain Mainnet (43114)
                            </span>
                            . Off-chain EIP-191 ownership verification
                            (<code className="font-mono">personal_sign</code>)
                            works on Mainnet; switch to Avalanche Fuji Testnet
                            (43113) before minting.
                          </div>
                        )}

                        {(securityCtx.isIframe ||
                          securityCtx.isEphemeralPreviewHost) && (
                          <div className="bg-[#FFF5F8] border border-[#E6B8C5] rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-[#6E4956] leading-snug flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#B54B65] shrink-0 mt-0.5" />
                            <span>
                              Origin:{' '}
                              <code className="font-mono break-all">
                                {securityCtx.origin || 'preview'}
                              </code>
                              {securityCtx.isIframe
                                ? ' (embedded iframe)'
                                : ' (ephemeral preview host)'}
                              . Wallets like Core may show a domain warning for
                              unverified preview URLs or iframes — never bypass
                              an unresolved security warning.
                            </span>
                          </div>
                        )}

                        <p className="text-[10px] font-bold text-[#8A747E] leading-snug">
                          Desktop Core Extension &amp; EIP-6963 browser wallets
                          supported in Phase 1 (Core Mobile WalletConnect
                          deferred).
                        </p>

                        {isWrongNetwork && (
                          <button
                            type="button"
                            disabled={Boolean(profileBusy)}
                            onClick={onSwitchToFuji}
                            className="buttercup-cta w-full rounded-full py-2 text-[12px] font-extrabold text-[#4B3C46] cursor-pointer"
                          >
                            {profileBusy === 'switch'
                              ? 'Switching Network...'
                              : 'Switch to Avalanche Fuji (43113)'}
                          </button>
                        )}

                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={Boolean(profileBusy)}
                            onClick={onConnectAndVerifyWallet}
                            className="buttercup-cta flex-1 rounded-full py-2 px-3 text-[12px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55 whitespace-nowrap"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>
                              {profileBusy === 'wallet'
                                ? 'Awaiting Signature...'
                                : linkedWallet
                                ? 'Re-Verify Wallet'
                                : 'Connect & Sign Nonce'}
                            </span>
                          </button>
                          {linkedWallet && (
                            <button
                              type="button"
                              disabled={Boolean(profileBusy)}
                              onClick={onUnlinkWallet}
                              className="cream-btn rounded-full py-2 px-3 text-[12px] font-extrabold text-[#7D3A4F] cursor-pointer"
                            >
                              Unlink
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Honest Web3 Contract & Minting Configuration Box */}
                  <div className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-2.5 space-y-1.5 text-[11px] font-bold text-[#5E4C56]">
                    <div className="font-display text-[12.5px] font-extrabold text-[#4B3C46] flex items-center justify-between">
                      <span>Fuji Contract Status</span>
                      <span
                        className={
                          web3Status?.readyForMint
                            ? 'text-[#356845]'
                            : 'text-[#B2772D]'
                        }
                      >
                        {web3Status?.readyForMint ? 'Ready ✓' : 'Config Needed'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8A747E]">Passport Contract:</span>
                      <span className="font-mono">
                        {web3Status?.contractAddress
                          ? shortAddr(web3Status.contractAddress)
                          : 'Not Set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8A747E]">Metadata Storage:</span>
                      <span>
                        {web3Status?.metadataProvider === 'pinata'
                          ? web3Status.ipfsConfigured
                            ? 'Pinata IPFS ✓'
                            : 'Pinata (API Key Missing)'
                          : 'Server Passport JSON'}
                      </span>
                    </div>
                    {web3Status && !web3Status.readyForMint && (
                      <div className="bg-[#FFF3BF] rounded-xl px-2.5 py-1.5 text-[10.5px] text-[#6E5321] leading-snug">
                        To enable Fuji minting, deploy{' '}
                        <code className="font-mono">PawsAndPicketPassport.sol</code>{' '}
                        and set{' '}
                        <code className="font-mono">
                          {web3Status.missingConfig.join(', ')}
                        </code>{' '}
                        on the server.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {profileTab === 'passports' && (
                <div className="space-y-2.5">
                  {!authUser && (
                    <div className="bg-[#FFF8DC] border border-[#EFE0A8] rounded-2xl p-2.5 flex items-center justify-between gap-2 text-[11.5px] font-bold text-[#5E4C56]">
                      <span>
                        Sign in with Google to verify your wallet &amp; mint
                        Fuji Passports.
                      </span>
                      <button
                        type="button"
                        onClick={onSignInGoogle}
                        className="buttercup-cta rounded-full px-3 py-1 text-[11px] font-extrabold text-[#4B3C46] shrink-0 cursor-pointer"
                      >
                        Sign In
                      </button>
                    </div>
                  )}

                  {/* Owned Pet Passports */}
                  <div className="space-y-2">
                    <div className="font-display text-[12px] font-extrabold text-[#4B3C46] flex items-center justify-between">
                      <span>🪪 Your Pet Passports ({pets.length})</span>
                      <span className="text-[10.5px] font-bold text-[#8A747E]">
                        Fuji ERC-721
                      </span>
                    </div>

                    {pets.map((pet) => {
                      const scoreVal = pet.score ?? 0;
                      const bondVal = pet.bondXp ?? 0;
                      const scoreMet = scoreVal >= MINT_ELIGIBILITY_RULES.MIN_SCORE;
                      const bondMet = bondVal >= MINT_ELIGIBILITY_RULES.MIN_BOND_XP;
                      const bondPct = Math.min(
                        100,
                        Math.round(
                          (bondVal / MINT_ELIGIBILITY_RULES.MIN_BOND_XP) * 100
                        )
                      );
                      const ownerMismatch =
                        Boolean(pet.minted) &&
                        Boolean(pet.onChainOwner) &&
                        Boolean(linkedWallet?.address) &&
                        pet.onChainOwner!.toLowerCase() !==
                          linkedWallet!.address.toLowerCase();
                      const ipfsCid =
                        pet.ipfsCid ||
                        (pet.metadataUri?.startsWith('ipfs://')
                          ? pet.metadataUri.replace('ipfs://', '')
                          : null);

                      return (
                        <div
                          key={pet.id}
                          className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-2.5 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-[#E8F8EC] border border-[#CFEBD5] overflow-hidden shrink-0 flex items-center justify-center">
                                <CroppedPetCutout
                                  photoUrl={pet.photoUrl}
                                  alt={pet.name}
                                  species={pet.species}
                                  mode={pet.cutoutMode ?? 'auto'}
                                  accessory={pet.accessory}
                                  className="w-10 h-10"
                                  bbox={pet.box_2d}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="font-display text-[13.5px] font-extrabold text-[#4B3C46] flex items-center gap-1 truncate">
                                  <span>{pet.name}</span>
                                  {pet.minted && (
                                    <CrystalMintIcon className="w-3.5 h-3.5 shrink-0" />
                                  )}
                                </div>
                                <div className="text-[10.5px] font-bold text-[#8A747E] capitalize tabular-nums">
                                  {pet.species} · Score {scoreVal}/80{' '}
                                  {scoreMet ? '✓' : ''} · Care {pet.careCount ?? 0}
                                </div>
                                <div className="text-[10px] font-bold text-[#9A858E] truncate">
                                  Discoverer:{' '}
                                  {pet.originalDiscovererWallet
                                    ? shortAddr(pet.originalDiscovererWallet)
                                    : pet.originalDiscovererUid
                                    ? `${pet.originalDiscovererUid.slice(0, 8)}…`
                                    : 'You'}
                                </div>
                              </div>
                            </div>

                            {pet.minted ? (
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="bg-[#E8F8EC] border border-[#B4DFBE] rounded-full px-2 py-0.5 text-[10px] font-extrabold text-[#356845] flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>#{pet.tokenId}</span>
                                </span>
                                {pet.mintTxHash && (
                                  <a
                                    href={`https://testnet.snowtrace.io/tx/${pet.mintTxHash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] font-bold text-[#4B7DA6] underline flex items-center gap-0.5"
                                  >
                                    <span>Snowtrace</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                                {ipfsCid && (
                                  <a
                                    href={`https://gateway.pinata.cloud/ipfs/${ipfsCid}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] font-bold text-[#4B7DA6] underline flex items-center gap-0.5"
                                  >
                                    <span>IPFS JSON</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold shrink-0 ${
                                  scoreMet && bondMet
                                    ? 'bg-[#FFF3BF] text-[#7D5E23] border border-[#E6CA78]'
                                    : 'bg-[#F5EDE6] text-[#8A747E]'
                                }`}
                              >
                                {scoreMet && bondMet ? 'Eligible ✓' : 'Growing'}
                              </span>
                            )}
                          </div>

                          {/* Bond XP Progress */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-extrabold text-[#6E6068] tabular-nums">
                              <span>Bond XP Milestone</span>
                              <span>
                                {bondVal}/{MINT_ELIGIBILITY_RULES.MIN_BOND_XP}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-[#EFE3D8] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#FF9EBA] transition-all duration-300"
                                style={{ width: `${bondPct}%` }}
                              />
                            </div>
                          </div>

                          {ownerMismatch && (
                            <div className="bg-[#FFF0F4] border border-[#ECC2CF] rounded-xl p-1.5 text-[10.5px] font-bold text-[#7D3A4F] flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                On-chain owner ({shortAddr(pet.onChainOwner)}) differs
                                from your linked wallet. Tap Reconcile.
                              </span>
                            </div>
                          )}

                          {/* Recent Memories */}
                          {pet.memories && pet.memories.length > 0 && (
                            <div className="bg-[#FFFDF9] border border-[#F2E6DC] rounded-xl px-2 py-1 text-[10px] font-bold text-[#7B6670] truncate">
                              📖 {pet.memories[pet.memories.length - 1].note}
                            </div>
                          )}

                          {/* Actions Row */}
                          {authUser && pet.petUid && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {!pet.minted && (
                                <button
                                  type="button"
                                  disabled={
                                    Boolean(profileBusy) ||
                                    !scoreMet ||
                                    !bondMet ||
                                    !linkedWallet ||
                                    !web3Status?.readyForMint
                                  }
                                  onClick={() =>
                                    onMintPassportFromProfile(pet.petUid!)
                                  }
                                  className="buttercup-cta rounded-full px-3 py-1 text-[11px] font-extrabold text-[#4B3C46] disabled:opacity-45 cursor-pointer flex items-center gap-1"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>
                                    {profileBusy === `mint-${pet.petUid}`
                                      ? 'Minting...'
                                      : 'Mint Fuji NFT'}
                                  </span>
                                </button>
                              )}

                              {pet.minted && (
                                <button
                                  type="button"
                                  disabled={Boolean(profileBusy)}
                                  onClick={() => onReconcilePet(pet.petUid!)}
                                  className="cream-btn rounded-full px-2.5 py-1 text-[11px] font-extrabold text-[#4B3C46] flex items-center gap-1 cursor-pointer"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Reconcile</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
