import type { SanctuaryPet } from '../types';

export function resolveSelectedPetId(
  pets: SanctuaryPet[],
  selectedPetId: string | null | undefined
): string | null {
  if (pets.length === 0) return null;
  if (selectedPetId && pets.some((p) => p.id === selectedPetId || p.petUid === selectedPetId)) {
    const matched = pets.find((p) => p.id === selectedPetId || p.petUid === selectedPetId);
    return matched?.id ?? pets[0].id;
  }
  return pets[0].id;
}

export function resolveTargetPet(
  pets: SanctuaryPet[],
  explicitPetId?: string | null,
  selectedPetId?: string | null
): SanctuaryPet | null {
  if (pets.length === 0) return null;
  if (explicitPetId) {
    const byExplicit = pets.find(
      (p) => p.id === explicitPetId || p.petUid === explicitPetId
    );
    if (byExplicit) return byExplicit;
  }
  if (selectedPetId) {
    const bySelected = pets.find(
      (p) => p.id === selectedPetId || p.petUid === selectedPetId
    );
    if (bySelected) return bySelected;
  }
  return pets[0];
}

export function applyLocalPetCareUpdate(
  pets: SanctuaryPet[],
  targetPetId: string,
  actionType: 'pet' | 'feed' | 'play'
): SanctuaryPet[] {
  const xpGain = actionType === 'pet' ? 15 : actionType === 'feed' ? 25 : 20;
  return pets.map((p) => {
    if (p.id !== targetPetId && p.petUid !== targetPetId) {
      return p;
    }
    return {
      ...p,
      needsCare:
        actionType === 'pet'
          ? p.needsCare
            ? null
            : undefined
          : actionType === 'feed'
          ? null
          : p.needsCare,
      bondXp: (p.bondXp ?? 0) + xpGain,
      careCount: (p.careCount ?? 0) + 1,
      questPetDone: actionType === 'pet' ? true : p.questPetDone,
      questFeedDone: actionType === 'feed' ? true : p.questFeedDone,
      questPlayDone: actionType === 'play' ? true : p.questPlayDone,
    };
  });
}
