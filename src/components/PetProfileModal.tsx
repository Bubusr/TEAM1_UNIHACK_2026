import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Heart,
  Lock,
  Minus,
  Move,
  Plus,
  RotateCcw,
  RotateCw,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react';
import {
  FoodItemType,
  HatTransform,
  JudgeReport,
  PetAnimState,
  PetSpecies,
  SanctuaryPet,
  ShopItem,
} from '../types';
import {
  CroppedPetCutout,
  DEFAULT_HAT_TRANSFORM,
  HAT_STICKER_MAP,
} from './CroppedPetCutout';
import { CrystalMintIcon } from './HandDrawnAssets';
import { CropFoodIcon, HatStickerIcon } from './GameIcons';
import { FOOD_META } from './FarmScreen';
import { useShowTextLabels, useSkyTheme } from './SharedHud';
import { PASSPORT_BOND_XP_THRESHOLD } from '../services/pawsApi';

export function isFavoriteFoodForSpecies(
  species: PetSpecies,
  food: FoodItemType
): boolean {
  if (species === 'cat') return food === 'catnip' || food === 'peach';
  if (species === 'bunny') return food === 'carrot' || food === 'apple';
  return food === 'berry' || food === 'wheat';
}

interface PetProfileModalProps {
  open: boolean;
  mode: 'welcome' | 'profile';
  pet: SanctuaryPet | null;
  pendingReport?: JudgeReport | null;
  shopItems: ShopItem[];
  foodInventory: Record<FoodItemType, number>;
  coins: number;
  onClose: () => void;
  onConfirmWelcome: (customName: string) => void;
  onCareAction: (petId: string, action: 'pet' | 'feed' | 'play') => string;
  onFeedSpecificPet: (petId: string, food: FoodItemType) => string;
  onEquipAccessory: (petId: string, accessoryId: string | null) => void;
  onBuyAndEquipHat: (petId: string, item: ShopItem) => boolean;
  onUpdateHatTransform: (petId: string, next: HatTransform) => void;
  onOpenMintPassport: (petId: string) => void;
  onOpenFarm?: () => void;
}

const ANIM_CLASS_MAP: Record<PetAnimState, string> = {
  idle: 'animate-pet-hop',
  eating: 'animate-pet-eat',
  playing: 'animate-pet-play',
  happy: 'animate-pet-happy',
};

function clampVal(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export const PetProfileModal: React.FC<PetProfileModalProps> = ({
  open,
  mode,
  pet,
  pendingReport,
  shopItems,
  foodInventory,
  coins,
  onClose,
  onConfirmWelcome,
  onCareAction,
  onFeedSpecificPet,
  onEquipAccessory,
  onBuyAndEquipHat,
  onUpdateHatTransform,
  onOpenMintPassport,
  onOpenFarm,
}) => {
  const showLabels = useShowTextLabels();
  const { skyTheme } = useSkyTheme();
  const [nameInput, setNameInput] = useState('');
  const [localAnim, setLocalAnim] = useState<PetAnimState>('idle');
  const [reactionIcon, setReactionIcon] = useState<string>('💖');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showHatTray, setShowHatTray] = useState(false);
  const [showHatAdjust, setShowHatAdjust] = useState(false);
  const [showFeedTray, setShowFeedTray] = useState(false);

  useEffect(() => {
    if (mode === 'welcome' && pendingReport) {
      setNameInput(pendingReport.petName);
    } else if (pet) {
      setNameInput(pet.name);
      setLocalAnim(pet.animState ?? 'idle');
    }
    setFeedback(null);
    setShowHatTray(false);
    setShowHatAdjust(false);
    setShowFeedTray(false);
  }, [mode, pendingReport, pet?.id, open]);

  if (!open) return null;

  if (mode === 'welcome' && pendingReport) {
    return (
      <div
        onClick={onClose}
        className="absolute inset-0 z-50 bg-[#4B3C46]/25 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 pb-7 sm:pb-3"
        role="dialog"
        aria-modal="true"
        aria-label="Welcome Pet"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="cream-card w-full max-w-[340px] flex flex-col overflow-hidden"
        >
          <div className="pt-2 pb-0.5 flex justify-center bg-[#FFFDF9] sm:hidden">
            <span className="w-10 h-1 rounded-full bg-[#E5D3CA]" />
          </div>
          <div className="px-4 py-2 border-b border-[#F2E6DC] flex items-center justify-between bg-[#FFFDF9]">
            <h3 className="font-display text-[15.5px] font-extrabold text-[#4B3C46]">
              🐾 Welcome
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

          <div className="p-4 space-y-3 bg-[#FFFDF9] text-center">
            <div className="relative w-24 h-24 mx-auto rounded-2xl bg-[#E8F8EC] border-2 border-[#CFEBD5] flex items-center justify-center overflow-hidden">
              <CroppedPetCutout
                photoUrl={pendingReport.photoUrl}
                alt={pendingReport.petName}
                mode="auto"
                className="w-20 h-20 animate-pet-happy"
              />
              <span className="absolute top-1 right-1 bg-[#FFFDF9]/95 border border-[#E5D3CA] rounded-full px-1.5 py-0.5 text-[10px] font-extrabold text-[#4B3C46] tabular-nums">
                ⭐ {pendingReport.overallScore}
              </span>
            </div>

            <input
              id="welcome-pet-name"
              type="text"
              maxLength={18}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Pet name..."
              aria-label="Pet name"
              className="w-full rounded-2xl bg-[#FFF9F2] border-2 border-[#D9C3B4] px-3 py-2 text-center font-display text-[15px] font-extrabold text-[#4B3C46] focus:outline-none focus:border-[#C99D66]"
            />

            <button
              type="button"
              onClick={() =>
                onConfirmWelcome(nameInput.trim() || pendingReport.petName)
              }
              className="buttercup-cta w-full rounded-full min-h-[46px] px-5 font-display text-[14px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{nameInput.trim() || pendingReport.petName}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!pet) return null;

  const xpPercent = Math.min(
    100,
    Math.round((pet.bondXp / PASSPORT_BOND_XP_THRESHOLD) * 100)
  );
  const totalFood = (Object.keys(foodInventory) as FoodItemType[]).reduce(
    (sum, k) => sum + foodInventory[k],
    0
  );

  const hatCatalog = shopItems.filter((item) => item.kind === 'accessory');
  const activeHatMeta = pet.accessory ? HAT_STICKER_MAP[pet.accessory] : null;
  const currentHatPos: Required<HatTransform> = {
    x: pet.hatTransform?.x ?? DEFAULT_HAT_TRANSFORM.x,
    y: pet.hatTransform?.y ?? DEFAULT_HAT_TRANSFORM.y,
    scale: pet.hatTransform?.scale ?? DEFAULT_HAT_TRANSFORM.scale,
    rotate: pet.hatTransform?.rotate ?? DEFAULT_HAT_TRANSFORM.rotate,
  };

  const nudgeHat = (dx: number, dy: number) => {
    onUpdateHatTransform(pet.id, {
      ...currentHatPos,
      x: clampVal(currentHatPos.x + dx, 8, 92),
      y: clampVal(currentHatPos.y + dy, 4, 88),
    });
  };

  const scaleHat = (ds: number) => {
    const nextScale = clampVal(
      Math.round((currentHatPos.scale + ds) * 10) / 10,
      0.6,
      1.6
    );
    onUpdateHatTransform(pet.id, { ...currentHatPos, scale: nextScale });
  };

  const rotateHat = (dr: number) => {
    const nextRotate = clampVal(currentHatPos.rotate + dr, -45, 45);
    onUpdateHatTransform(pet.id, { ...currentHatPos, rotate: nextRotate });
  };

  const resetHatPosition = () => {
    onUpdateHatTransform(pet.id, { ...DEFAULT_HAT_TRANSFORM });
    setFeedback('↺');
  };

  const triggerCare = (action: 'pet' | 'play') => {
    const nextAnim: PetAnimState = action === 'play' ? 'playing' : 'happy';
    setReactionIcon(action === 'play' ? '🎾' : '💖');
    setLocalAnim(nextAnim);
    const msg = onCareAction(pet.id, action);
    setFeedback(msg);
    window.setTimeout(() => {
      setLocalAnim('idle');
    }, 1500);
  };

  const triggerSpecificFeed = (food: FoodItemType) => {
    setReactionIcon(FOOD_META[food].icon);
    setLocalAnim('eating');
    const msg = onFeedSpecificPet(pet.id, food);
    setFeedback(msg);
    window.setTimeout(() => {
      setLocalAnim('idle');
    }, 1500);
  };

  const triggerKibbleFallback = () => {
    setReactionIcon('🥣');
    setLocalAnim('eating');
    const msg = onCareAction(pet.id, 'feed');
    setFeedback(msg);
    window.setTimeout(() => {
      setLocalAnim('idle');
    }, 1500);
  };

  const handleSelectHat = (hatItem: ShopItem | null) => {
    if (!hatItem) {
      onEquipAccessory(pet.id, null);
      setShowHatAdjust(false);
      setFeedback(null);
      return;
    }
    if (hatItem.owned) {
      onEquipAccessory(pet.id, hatItem.id);
      setReactionIcon(hatItem.icon);
      setLocalAnim('happy');
      setFeedback(hatItem.icon);
      window.setTimeout(() => setLocalAnim('idle'), 1000);
      return;
    }
    if (coins < hatItem.cost) {
      setFeedback(`${hatItem.cost} 🪙`);
      return;
    }
    const ok = onBuyAndEquipHat(pet.id, hatItem);
    if (ok) {
      setReactionIcon(hatItem.icon);
      setLocalAnim('happy');
      setFeedback(`${hatItem.icon} ✓`);
      window.setTimeout(() => setLocalAnim('idle'), 1100);
    }
  };

  const portraitAnimClass =
    showHatAdjust && localAnim === 'idle' ? '' : ANIM_CLASS_MAP[localAnim];

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 bg-[#4B3C46]/25 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 pb-7 sm:pb-3"
      role="dialog"
      aria-modal="true"
      aria-label={`${pet.name} Pet Profile`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cream-card w-full max-w-[352px] max-h-[88%] flex flex-col overflow-hidden"
      >
        <div className="pt-2 pb-0.5 flex justify-center bg-[#FFFDF9] sm:hidden">
          <span className="w-10 h-1 rounded-full bg-[#E5D3CA]" />
        </div>
        <div className="px-4 py-2 border-b border-[#F2E6DC] flex items-center justify-between bg-[#FFFDF9]">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display text-[16px] font-extrabold text-[#4B3C46]">
              {pet.name}
            </h3>
            {pet.minted && <CrystalMintIcon className="w-4 h-4" />}
            <span className="rounded-full bg-[#FFF8DC] border border-[#EFE0A8] px-2 py-0.5 text-[10.5px] font-extrabold text-[#4B3C46] tabular-nums">
              Lv.{pet.bondLevel}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-[#FFF5F8] border border-[#E5D3CA] flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-3 overflow-y-auto space-y-2.5 bg-[#FFFDF9]">
          {/* Clean Portrait Stage (Direct Hat Dragging) */}
          <div
            className={`relative rounded-2xl border py-2.5 px-3 flex flex-col items-center ${
              skyTheme === 'sunset'
                ? 'bg-gradient-to-b from-[#FFE2D6] to-[#E5EEB5] border-[#ECCFB9]'
                : 'bg-gradient-to-b from-[#E7F7FF] to-[#D4F5BE] border-[#CFEBD5]'
            }`}
          >
            <div className="my-1 relative flex items-center justify-center">
              <div className={portraitAnimClass}>
                <CroppedPetCutout
                  photoUrl={pet.photoUrl}
                  alt={pet.name}
                  mode={pet.cutoutMode ?? 'auto'}
                  accessory={pet.accessory}
                  hatTransform={pet.hatTransform}
                  hatSize="lg"
                  draggableHat={Boolean(pet.accessory)}
                  onHatTransformChange={(next) => {
                    setShowFeedTray(false);
                    setShowHatTray(true);
                    setShowHatAdjust(true);
                    onUpdateHatTransform(pet.id, next);
                  }}
                  className="w-28 h-28"
                />
              </div>
              {localAnim !== 'idle' && (
                <span className="absolute -right-4 top-2 text-lg animate-bounce">
                  {reactionIcon}
                </span>
              )}
            </div>

            {feedback && (
              <div className="bg-[#FFFDF9] border border-[#D9C3B4] rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-[#4B3C46] tabular-nums">
                {feedback}
              </div>
            )}

            {/* Compact XP Bar inside Stage */}
            <div className="w-full mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-[#FFFDF9]/85 overflow-hidden border border-[#CFEBD5]">
                <div
                  className="h-full rounded-full bg-[#FFE07D] transition-all duration-300"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <span className="text-[10.5px] font-extrabold text-[#4B3C46] tabular-nums shrink-0">
                {pet.bondXp}/{PASSPORT_BOND_XP_THRESHOLD}
              </span>
            </div>
          </div>

          {/* 4 Actions: Pet / Feed / Hat (Cosmetic) / Play */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => triggerCare('pet')}
              aria-label="Pet"
              title="Pet"
              className="cream-btn rounded-2xl min-h-[48px] py-1.5 px-1.5 flex flex-col items-center justify-center gap-0.5 cursor-pointer bg-[#FFF5F8]"
            >
              <Heart className="w-5 h-5 fill-[#FF85A1] text-[#FF85A1]" />
              {showLabels && (
                <span className="font-display text-[11px] font-extrabold text-[#4B3C46] leading-tight">
                  Pet
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowFeedTray((prev) => {
                  const next = !prev;
                  if (next) setShowHatTray(false);
                  return next;
                });
              }}
              aria-label="Feed"
              title="Feed"
              className={`cream-btn relative rounded-2xl min-h-[48px] py-1.5 px-1.5 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                showFeedTray
                  ? 'bg-[#FFE07D] border-[#C99D66]'
                  : 'bg-[#F0FAF2]'
              }`}
            >
              <div className="flex items-center gap-0.5">
                <Utensils className="w-4.5 h-4.5 text-[#4EA866]" />
                {!showLabels && (
                  <span className="text-[10.5px] font-extrabold text-[#4B3C46] tabular-nums">
                    {totalFood}
                  </span>
                )}
              </div>
              {showLabels && (
                <span className="font-display text-[11px] font-extrabold text-[#4B3C46] leading-tight">
                  Feed
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowHatTray((prev) => {
                  const next = !prev;
                  if (next) setShowFeedTray(false);
                  return next;
                });
              }}
              aria-label="Wear hat or cosmetic"
              title="Hats & Cosmetics"
              className={`cream-btn relative rounded-2xl min-h-[48px] py-1.5 px-1.5 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                showHatTray
                  ? 'bg-[#FFE07D] border-[#C99D66]'
                  : 'bg-[#FFF5FA]'
              }`}
            >
              <HatStickerIcon
                hatId={pet.accessory ?? 'straw-hat'}
                className="w-5.5 h-5.5"
              />
              {showLabels && (
                <span className="font-display text-[11px] font-extrabold text-[#4B3C46] leading-tight">
                  Wear
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => triggerCare('play')}
              aria-label="Play"
              title="Play"
              className="cream-btn rounded-2xl min-h-[48px] py-1.5 px-1.5 flex flex-col items-center justify-center gap-0.5 cursor-pointer bg-[#EFF8FF]"
            >
              <Sparkles className="w-5 h-5 text-[#4F7EA6]" />
              {showLabels && (
                <span className="font-display text-[11px] font-extrabold text-[#4B3C46] leading-tight">
                  Play
                </span>
              )}
            </button>
          </div>

          {/* Pet-Specific Food Basket Tray */}
          {showFeedTray && (
            <div className="bg-[#F2FBF4] border border-[#CFEBD5] rounded-2xl p-2 space-y-1.5">
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(FOOD_META) as FoodItemType[]).map((foodKey) => {
                  const meta = FOOD_META[foodKey];
                  const count = foodInventory[foodKey];
                  const isFav = isFavoriteFoodForSpecies(pet.species, foodKey);
                  return (
                    <button
                      key={foodKey}
                      type="button"
                      disabled={count === 0}
                      onClick={() => triggerSpecificFeed(foodKey)}
                      aria-label={`Feed ${meta.name}`}
                      title={
                        isFav
                          ? `${meta.name} (Favorite +20 XP)`
                          : `${meta.name} (+15 XP)`
                      }
                      className={`relative rounded-xl min-h-[44px] px-2 py-1 border-2 flex items-center justify-center gap-1 transition-transform active:scale-90 cursor-pointer disabled:opacity-40 ${
                        isFav
                          ? 'bg-[#FFF8DC] border-[#E5C97B]'
                          : 'bg-[#FFFDF9] border-[#DDEEE0]'
                      }`}
                    >
                      <CropFoodIcon item={foodKey} className="w-5 h-5" />
                      <span className="text-[11px] font-extrabold text-[#4B3C46] tabular-nums">
                        x{count}
                      </span>
                      {isFav && (
                        <span
                          aria-hidden="true"
                          className="absolute -top-1.5 -right-1 text-[10px] leading-none"
                        >
                          ⭐
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {totalFood === 0 && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={triggerKibbleFallback}
                    className="flex-1 cream-btn rounded-full min-h-[36px] text-[11px] font-extrabold text-[#4B3C46] bg-[#FFFDF9] cursor-pointer inline-flex items-center justify-center gap-1"
                  >
                    <CropFoodIcon item="kibble" className="w-4 h-4" />
                    <span>+15 XP</span>
                  </button>
                  {onOpenFarm && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFarm();
                      }}
                      className="flex-1 buttercup-cta rounded-full min-h-[36px] text-[11px] font-extrabold text-[#4B3C46] cursor-pointer inline-flex items-center justify-center gap-1"
                    >
                      <CropFoodIcon item="wheat" className="w-4 h-4" />
                      <span>Farm</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Per-Pet Cosmetic / Hat Picker Tray (Opens on Wear Button Press, like Feed) */}
          {showHatTray && (
            <div className="bg-[#FFF6FA] border border-[#F3DCE6] rounded-2xl p-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-extrabold text-[#4B3C46] flex items-center gap-1">
                  <HatStickerIcon
                    hatId={pet.accessory ?? 'straw-hat'}
                    className="w-5 h-5"
                  />
                  {showLabels && (
                    <span className="text-[#8A747E]">
                      {activeHatMeta ? activeHatMeta.label : 'None'}
                    </span>
                  )}
                </span>

              {pet.accessory && (
                <button
                  type="button"
                  onClick={() => setShowHatAdjust((v) => !v)}
                  aria-label="Move hat"
                  className={`rounded-full px-2.5 min-h-[30px] text-[10.5px] font-extrabold border flex items-center gap-1 cursor-pointer active:scale-95 transition-transform ${
                    showHatAdjust
                      ? 'bg-[#FFE07D] border-[#C99D66] text-[#4B3C46]'
                      : 'bg-[#FFFDF9] border-[#E5D3CA] text-[#4B3C46]'
                  }`}
                >
                  <Move className="w-3.5 h-3.5" />
                  {showLabels && <span>{showHatAdjust ? 'Done' : 'Move'}</span>}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => handleSelectHat(null)}
                aria-label="No hat"
                title="No Hat"
                className={`relative w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border-2 transition-transform active:scale-90 cursor-pointer ${
                  !pet.accessory
                    ? 'bg-[#FFF3BF] border-[#D9AA4C]'
                    : 'bg-[#FFFDF9] border-[#E8D7CE] text-[#8A747E]'
                }`}
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>

              {hatCatalog.map((hat) => {
                const isEquipped = pet.accessory === hat.id;
                const isLocked = !hat.owned;
                return (
                  <button
                    key={hat.id}
                    type="button"
                    onClick={() => handleSelectHat(hat)}
                    aria-label={hat.name}
                    title={isLocked ? `${hat.name} (${hat.cost} Coins)` : hat.name}
                    className={`relative w-10 h-10 rounded-xl shrink-0 flex flex-col items-center justify-center border-2 transition-transform active:scale-90 cursor-pointer ${
                      isEquipped
                        ? 'bg-[#FFF3BF] border-[#D9AA4C]'
                        : isLocked
                        ? 'bg-[#FAF5F0] border-[#E8D7CE] opacity-80'
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

            {pet.accessory && showHatAdjust && (
              <div className="pt-1.5 border-t border-[#F3DCE6] space-y-1.5">
                <div className="grid grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => nudgeHat(-4, 0)}
                    aria-label="Move left"
                    className="cream-btn rounded-xl min-h-[36px] flex items-center justify-center text-[#4B3C46] cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeHat(0, -4)}
                    aria-label="Move up"
                    className="cream-btn rounded-xl min-h-[36px] flex items-center justify-center text-[#4B3C46] cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeHat(0, 4)}
                    aria-label="Move down"
                    className="cream-btn rounded-xl min-h-[36px] flex items-center justify-center text-[#4B3C46] cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeHat(4, 0)}
                    aria-label="Move right"
                    className="cream-btn rounded-xl min-h-[36px] flex items-center justify-center text-[#4B3C46] cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={resetHatPosition}
                    aria-label="Reset"
                    title="Reset"
                    className="cream-btn rounded-xl min-h-[36px] flex items-center justify-center text-[#8A747E] bg-[#FFFDF9] cursor-pointer text-[13px] font-extrabold"
                  >
                    ↺
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => scaleHat(-0.1)}
                    aria-label="Smaller"
                    className="cream-btn rounded-xl min-h-[34px] flex items-center justify-center text-[#4B3C46] cursor-pointer"
                  >
                    <Minus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleHat(0.1)}
                    aria-label="Larger"
                    className="cream-btn rounded-xl min-h-[34px] flex items-center justify-center text-[#4B3C46] cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateHat(-8)}
                    aria-label="Tilt left"
                    className="cream-btn rounded-xl min-h-[34px] flex items-center justify-center text-[#4B3C46] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateHat(8)}
                    aria-label="Tilt right"
                    className="cream-btn rounded-xl min-h-[34px] flex items-center justify-center text-[#4B3C46] cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Compact Passport CTA */}
          <button
            type="button"
            onClick={() => onOpenMintPassport(pet.id)}
            className="buttercup-cta w-full rounded-full min-h-[44px] px-4 font-display text-[13px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CrystalMintIcon className="w-4 h-4" />
            <span>
              {pet.minted
                ? `${pet.passportTokenId ?? 'NFT'} ✓`
                : pet.passportEligible
                ? 'Mint Passport'
                : `${Math.max(0, PASSPORT_BOND_XP_THRESHOLD - pet.bondXp)} XP`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
