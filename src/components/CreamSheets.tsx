import React, { useState } from 'react';
import { Camera, Heart, Sparkles, Upload, X } from 'lucide-react';
import {
  DailyLimits,
  FoodItemType,
  GardenToy,
  JudgeReport,
  NeighborGarden,
  SanctuaryPet,
  ShopItem,
} from '../types';
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
  onCarePet: (petId: string) => void;
  onUseSampleSnap: () => void;
  onUploadPhoto: (file: File) => void;
  onRescueStray: () => void;
  onPlaceBait: (baitName: string) => void;
  onOpenAlbumItem: (report: JudgeReport) => void;
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
  onCarePet,
  onUseSampleSnap,
  onUploadPhoto,
  onRescueStray,
  onPlaceBait,
  onOpenAlbumItem,
}) => {
  const [shopTab, setShopTab] = useState<'toys' | 'hats'>('toys');
  const [bagTab, setBagTab] = useState<'food' | 'bait'>('food');

  if (!modal) return null;

  const ownedAccessories = shopItems.filter(
    (item) => item.kind === 'accessory' && item.owned
  );

  const totalFood = (Object.keys(foodInventory) as FoodItemType[]).reduce(
    (sum, k) => sum + foodInventory[k],
    0
  );

  return (
    <div
      className="absolute inset-0 z-40 bg-[#FFFDF9]/75 backdrop-blur-xs flex items-end justify-center p-3"
      role="dialog"
      aria-modal="true"
    >
      <div className="cream-card w-full max-h-[82%] flex flex-col overflow-hidden">
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
            {modal === 'profile' && `🐱 Lv.${level}`}
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
                          mode={pet.cutoutMode ?? 'auto'}
                          accessory={pet.accessory}
                          className="w-11 h-11"
                        />
                      </div>
                      <div>
                        <div className="font-display text-[14px] font-extrabold text-[#4B3C46] flex items-center gap-1">
                          <span>{pet.name}</span>
                          {pet.minted && <CrystalMintIcon className="w-3.5 h-3.5" />}
                        </div>
                        <div className="text-[11px] font-bold text-[#8A747E] capitalize">
                          {pet.species}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
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
                        onClick={() => onCarePet(pet.id)}
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
                          onClick={() => onFeedPet(foodKey)}
                          className="buttercup-cta rounded-full px-3.5 py-1 text-[12px] font-extrabold text-[#4B3C46] disabled:opacity-45 cursor-pointer"
                        >
                          Feed
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

              <button
                type="button"
                onClick={onUseSampleSnap}
                className="buttercup-cta w-full rounded-full py-2.5 px-4 font-display text-[14px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 stroke-[2.4]" />
                <span>Sample Puppy</span>
              </button>

              <label className="cream-btn w-full rounded-full py-2.5 px-4 font-display text-[14px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer bg-[#EFF8FF]">
                <Upload className="w-4 h-4 stroke-[2.4]" />
                <span>Upload Photo</span>
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

          {modal === 'profile' && (
            <div className="space-y-2.5">
              <div className="bg-[#FFF5F8] border border-[#F3D7E2] rounded-2xl p-3 flex items-center gap-3">
                <img
                  src="/src/assets/images/cropped_calico_cat_1794637541476.jpg"
                  alt="Keeper avatar"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl border border-[#E5D3CA] object-cover"
                />
                <div>
                  <div className="font-display text-[15px] font-extrabold text-[#4B3C46]">
                    Mochi · Lv.{level}
                  </div>
                  <div className="text-[12px] font-bold text-[#8A747E]">
                    🔥 {streakDays}d · 🛡️ {fenceHours}h · ⚡ {energy}/{maxEnergy}
                  </div>
                </div>
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
                  🦋 Clover: {limits.cloverCoinsUsed}/{limits.cloverCoinsMax}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
