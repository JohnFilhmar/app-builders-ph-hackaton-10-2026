import Svg, { Circle, Polygon } from 'react-native-svg';

import { PALETTE } from '@/lib/theme/palette';

type TaraFaceProps = { size?: number };

/** Tara the tarsier as polygon geometry: faceted head, pointed ears and the huge eyes tarsiers are known for. */
export function TaraFace({ size = 48 }: TaraFaceProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Polygon points="4,10 14,4 18,16" fill={PALETTE.tara700} />
      <Polygon points="44,10 34,4 30,16" fill={PALETTE.tara700} />
      <Polygon points="14,10 34,10 44,22 40,38 30,45 18,45 8,38 4,22" fill={PALETTE.tara500} />
      <Polygon points="18,30 30,30 27,40 21,40" fill={PALETTE.tara300} />
      <Circle cx={16} cy={24} r={8} fill={PALETTE.sipag300} />
      <Circle cx={32} cy={24} r={8} fill={PALETTE.sipag300} />
      <Circle cx={16} cy={24} r={5} fill={PALETTE.ink900} />
      <Circle cx={32} cy={24} r={5} fill={PALETTE.ink900} />
      <Circle cx={17.5} cy={22} r={1.6} fill={PALETTE.white} />
      <Circle cx={33.5} cy={22} r={1.6} fill={PALETTE.white} />
    </Svg>
  );
}
