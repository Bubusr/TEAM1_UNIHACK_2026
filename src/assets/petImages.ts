import avatarCalicoCat from './images/avatar_calico_cat_1794627551774.jpg';
import croppedCalicoCat from './images/cropped_calico_cat_1794637541476.jpg';
import croppedFluffyBunny from './images/cropped_fluffy_bunny_1794637542800.jpg';
import croppedGoldenDog from './images/cropped_golden_dog_1794637542709.jpg';
import luredStrayCorgi from './images/lured_stray_corgi_1794627550798.jpg';
import neighborRagdollCat from './images/neighbor_ragdoll_cat_1794722671151.jpg';
import neighborSamoyedPup from './images/neighbor_samoyed_pup_1794722672155.jpg';
import neighborShibaDog from './images/neighbor_shiba_dog_1794722670611.jpg';
import polaroidGoldenPuppy from './images/polaroid_golden_puppy_1794627548886.jpg';

export const PET_IMAGES = {
  avatarCalicoCat,
  croppedCalicoCat,
  croppedFluffyBunny,
  croppedGoldenDog,
  luredStrayCorgi,
  neighborRagdollCat,
  neighborSamoyedPup,
  neighborShibaDog,
  polaroidGoldenPuppy,
} as const;

const LEGACY_PATH_MAP: Record<string, string> = {
  'avatar_calico_cat_1794627551774.jpg': avatarCalicoCat,
  'cropped_calico_cat_1794637541476.jpg': croppedCalicoCat,
  'cropped_fluffy_bunny_1794637542800.jpg': croppedFluffyBunny,
  'cropped_golden_dog_1794637542709.jpg': croppedGoldenDog,
  'lured_stray_corgi_1794627550798.jpg': luredStrayCorgi,
  'neighbor_ragdoll_cat_1794722671151.jpg': neighborRagdollCat,
  'neighbor_samoyed_pup_1794722672155.jpg': neighborSamoyedPup,
  'neighbor_shiba_dog_1794722670611.jpg': neighborShibaDog,
  'polaroid_golden_puppy_1794627548886.jpg': polaroidGoldenPuppy,
};

/**
 * Resolves legacy `/src/assets/images/<file>` paths (including those persisted
 * in localStorage from earlier sessions) to the Vite-bundled asset URL so pet
 * photos and avatars always load in both dev and production builds.
 */
export function resolveAssetUrl(url: string): string {
  if (!url) return croppedCalicoCat;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')) {
    return url;
  }
  const clean = url.split('?')[0];
  const filename = clean.split('/').pop() ?? '';
  if (filename && LEGACY_PATH_MAP[filename]) {
    return LEGACY_PATH_MAP[filename];
  }
  return url;
}
