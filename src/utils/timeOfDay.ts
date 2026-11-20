export type TimeOfDayTheme = 'morning' | 'afternoon' | 'sunset' | 'night';

export function getTimeOfDayTheme(date: Date = new Date()): TimeOfDayTheme {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'sunset';
  return 'night';
}

export interface TimeOfDayPalette {
  id: TimeOfDayTheme;
  label: string;
  isNight: boolean;
  showStars: boolean;
  studioBgClass: string;
  startBaseBg: string;
  startSkyGradient: string;
  startMeadowGradient: string;
  sanctuaryBaseBg: string;
  sanctuarySkyGradient: string;
  sanctuaryMeadowGradient: string;
  farmBaseBg: string;
  farmSkyGradient: string;
  farmMeadowGradient: string;
  meadowGlowFill: string;
  meadowGlowOpacity: string;
  cloudFill: string;
  grassStroke: string;
  sunYStart: number;
  sunYSanctuary: number;
  sunHaloFill: string;
  sunFill: string;
  sunStroke: string;
  pondFill: string;
  pondStroke: string;
  pondHighlight: string;
  brookStroke: string;
  brookHighlight: string;
  portraitStageClass: string;
}

export const TIME_OF_DAY_PALETTES: Record<TimeOfDayTheme, TimeOfDayPalette> = {
  morning: {
    id: 'morning',
    label: 'Morning',
    isNight: false,
    showStars: false,
    studioBgClass: 'pastel-studio-bg',
    startBaseBg: '#C5EEAA',
    startSkyGradient:
      'linear-gradient(180deg, #C7ECFF 0%, #EAF8FF 62%, #DDF8C8 100%)',
    startMeadowGradient:
      'radial-gradient(circle at 50% 35%, #DCF9BE 0%, #BBEBA0 58%, #A2DF7C 100%)',
    sanctuaryBaseBg: '#AEE88D',
    sanctuarySkyGradient:
      'linear-gradient(180deg, #C7EEFF 0%, #EAF8FF 72%, #CCF5B8 100%)',
    sanctuaryMeadowGradient:
      'radial-gradient(circle at 50% 44%, #CCF5AE 0%, #B4EA90 60%, #9CDF75 100%)',
    farmBaseBg: '#BCEB9E',
    farmSkyGradient:
      'linear-gradient(180deg, #CBEFFF 0%, #E7F7FF 72%, #CEF5B8 100%)',
    farmMeadowGradient:
      'radial-gradient(circle at 50% 48%, #D3F5B2 0%, #BBE897 65%, #A5DC7F 100%)',
    meadowGlowFill: '#F0FFDA',
    meadowGlowOpacity: '0.52',
    cloudFill: '#FFFDF9',
    grassStroke: '#7EC667',
    sunYStart: 44,
    sunYSanctuary: 34,
    sunHaloFill: '#FFF5C2',
    sunFill: '#FFE794',
    sunStroke: '#E5B95C',
    pondFill: '#B5E8FF',
    pondStroke: '#9FC4DB',
    pondHighlight: '#E3F7FF',
    brookStroke: '#A5E2FF',
    brookHighlight: '#D6F3FF',
    portraitStageClass:
      'bg-gradient-to-b from-[#E7F7FF] to-[#D4F5BE] border-[#CFEBD5]',
  },
  afternoon: {
    id: 'afternoon',
    label: 'Afternoon',
    isNight: false,
    showStars: false,
    studioBgClass: 'pastel-studio-bg-afternoon',
    startBaseBg: '#CBEFA2',
    startSkyGradient:
      'linear-gradient(180deg, #B5E4FF 0%, #E8F7FF 48%, #FFF4CC 100%)',
    startMeadowGradient:
      'radial-gradient(circle at 50% 35%, #E7FBB8 0%, #C5EC96 58%, #A6DB78 100%)',
    sanctuaryBaseBg: '#B8E88C',
    sanctuarySkyGradient:
      'linear-gradient(180deg, #B8E6FF 0%, #EAF7FF 56%, #F4F8C4 100%)',
    sanctuaryMeadowGradient:
      'radial-gradient(circle at 50% 44%, #D9F7AD 0%, #BCEA8D 60%, #9EDB72 100%)',
    farmBaseBg: '#C4EC9A',
    farmSkyGradient:
      'linear-gradient(180deg, #BCE7FF 0%, #EEF8FF 56%, #F7F7C6 100%)',
    farmMeadowGradient:
      'radial-gradient(circle at 50% 48%, #DFF7B0 0%, #C3EA94 65%, #A8DC7A 100%)',
    meadowGlowFill: '#FFF9D6',
    meadowGlowOpacity: '0.56',
    cloudFill: '#FFFDF9',
    grassStroke: '#7CC262',
    sunYStart: 36,
    sunYSanctuary: 28,
    sunHaloFill: '#FFF1AA',
    sunFill: '#FFDE73',
    sunStroke: '#E0AC48',
    pondFill: '#AEE4FF',
    pondStroke: '#95BED8',
    pondHighlight: '#EAF9FF',
    brookStroke: '#9DDFFF',
    brookHighlight: '#DFF6FF',
    portraitStageClass:
      'bg-gradient-to-b from-[#DFF4FF] via-[#FFF8DE] to-[#D8F5B8] border-[#DCE8C5]',
  },
  sunset: {
    id: 'sunset',
    label: 'Sunset',
    isNight: false,
    showStars: true,
    studioBgClass: 'pastel-studio-bg-sunset',
    startBaseBg: '#C6DD8F',
    startSkyGradient:
      'linear-gradient(180deg, #E2C1FF 0%, #FFD0CA 54%, #FFE7B5 100%)',
    startMeadowGradient:
      'radial-gradient(circle at 50% 35%, #EAF0B6 0%, #C6DD8F 58%, #A4C777 100%)',
    sanctuaryBaseBg: '#C3DB8E',
    sanctuarySkyGradient:
      'linear-gradient(180deg, #E2C1FF 0%, #FFD0CA 60%, #FFE6B3 100%)',
    sanctuaryMeadowGradient:
      'radial-gradient(circle at 50% 44%, #E3EEAE 0%, #C3DB8E 60%, #A4C575 100%)',
    farmBaseBg: '#C8DE92',
    farmSkyGradient:
      'linear-gradient(180deg, #E2C1FF 0%, #FFD0CA 58%, #FFE6B3 100%)',
    farmMeadowGradient:
      'radial-gradient(circle at 50% 48%, #E6EFB0 0%, #C6DD8F 65%, #A6C677 100%)',
    meadowGlowFill: '#FFF0C7',
    meadowGlowOpacity: '0.5',
    cloudFill: '#FFF1E8',
    grassStroke: '#86B463',
    sunYStart: 56,
    sunYSanctuary: 42,
    sunHaloFill: '#FFD7B5',
    sunFill: '#FFBC91',
    sunStroke: '#E0866B',
    pondFill: '#F5CBE8',
    pondStroke: '#CFA6C6',
    pondHighlight: '#FFE7D6',
    brookStroke: '#F0C5E6',
    brookHighlight: '#FFE6D4',
    portraitStageClass:
      'bg-gradient-to-b from-[#FFE2D6] to-[#E5EEB5] border-[#ECCFB9]',
  },
  night: {
    id: 'night',
    label: 'Night',
    isNight: true,
    showStars: true,
    studioBgClass: 'pastel-studio-bg-night',
    startBaseBg: '#5D8F74',
    startSkyGradient:
      'linear-gradient(180deg, #47477E 0%, #6C66A6 56%, #9B8EC7 100%)',
    startMeadowGradient:
      'radial-gradient(circle at 50% 35%, #7DB08C 0%, #609477 58%, #4A7A66 100%)',
    sanctuaryBaseBg: '#5A8D73',
    sanctuarySkyGradient:
      'linear-gradient(180deg, #47477E 0%, #6C66A6 62%, #978BC2 100%)',
    sanctuaryMeadowGradient:
      'radial-gradient(circle at 50% 44%, #79AC8A 0%, #5D9075 60%, #487764 100%)',
    farmBaseBg: '#5E9176',
    farmSkyGradient:
      'linear-gradient(180deg, #47477E 0%, #6B65A3 62%, #988CC2 100%)',
    farmMeadowGradient:
      'radial-gradient(circle at 50% 48%, #7CAF8C 0%, #609377 65%, #4A7965 100%)',
    meadowGlowFill: '#C8E8D4',
    meadowGlowOpacity: '0.24',
    cloudFill: '#DCE0F7',
    grassStroke: '#406B58',
    sunYStart: 46,
    sunYSanctuary: 34,
    sunHaloFill: '#FFF6D6',
    sunFill: '#FFF0B8',
    sunStroke: '#DFC784',
    pondFill: '#93B2E8',
    pondStroke: '#738EC2',
    pondHighlight: '#DCE9FF',
    brookStroke: '#8EAEE6',
    brookHighlight: '#D6E5FF',
    portraitStageClass:
      'bg-gradient-to-b from-[#6B67A4] via-[#8E86BE] to-[#74A788] border-[#9692C4]',
  },
};
