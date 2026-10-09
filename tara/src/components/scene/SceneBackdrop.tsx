import { Image, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { SCENE_ART } from '@/lib/theme/sceneArt';
import { PALETTE } from '@/lib/theme/palette';

type SceneBackdropProps = { slot: 'home_backdrop' | 'onboarding_backdrop'; tone?: 'day' | 'dusk' };

// low-poly cliffs and a faceted sun: placeholder geometry until the painted backdrop arrives
const RIDGES = {
  day: ['#F3E3C3', '#E8D0A4', '#D9BC8A', '#C9A574'],
  dusk: ['#E9CFA4', '#D6B07C', '#B98A58', '#8B5A2B'],
};

/** Full-bleed scene behind a hero: the real backdrop art when SCENE_ART has it, low-poly cliffs otherwise. */
export function SceneBackdrop({ slot, tone = 'day' }: SceneBackdropProps) {
  const art = SCENE_ART[slot];
  if (art) return <Image source={art} resizeMode="cover" className="absolute inset-0 h-full w-full" />;
  const [far, mid, near, cliff] = RIDGES[tone];
  return (
    <View className="absolute inset-0" pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice">
        <Polygon points="0,0 100,0 100,100 0,100" fill={PALETTE.banig100} />
        <Polygon points="72,14 80,10 86,16 84,25 76,27 70,21" fill={PALETTE.sipag300} opacity={0.7} />
        <Polygon points="0,62 10,40 18,48 28,30 38,46 46,36 58,52 66,34 78,46 88,28 100,44 100,100 0,100" fill={far} />
        <Polygon points="0,72 8,58 20,66 30,50 42,64 52,56 64,70 76,54 90,66 100,58 100,100 0,100" fill={mid} />
        <Polygon points="0,82 14,70 26,78 40,68 56,80 70,72 84,82 100,74 100,100 0,100" fill={near} />
        <Polygon points="22,100 30,86 46,82 60,84 74,88 80,100" fill={cliff} />
        <Polygon points="30,86 46,82 60,84 52,88 38,89" fill={PALETTE.tara300} />
      </Svg>
    </View>
  );
}
