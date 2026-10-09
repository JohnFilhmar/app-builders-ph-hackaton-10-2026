import type { ComponentType } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { PALETTE } from '@/lib/theme/palette';

export type BackdropId = 'bg_sari_sari' | 'bg_palayan' | 'bg_sakayan' | 'bg_plaza';

const isBackdropId = (id: string): id is BackdropId => id === 'bg_sari_sari' || id === 'bg_palayan' || id === 'bg_sakayan' || id === 'bg_plaza';

// each scene keeps the lower middle quiet, where the hero stands
function SariSari() {
  return (
    <>
      <Rect x={0} y={0} width={100} height={100} fill="#FCEFD2" />
      <Circle cx={84} cy={16} r={7} fill={PALETTE.sipag300} opacity={0.8} />
      <Polygon points="2,30 40,30 44,38 -2,38" fill="#4F7A8C" />
      {[4, 10, 16, 22, 28, 34, 40].map((x) => (
        <Line key={x} x1={x} y1={30} x2={x + 1} y2={38} stroke="#3C5F6E" strokeWidth={0.8} />
      ))}
      <Rect x={2} y={38} width={38} height={44} fill="#E9C893" />
      <Rect x={6} y={44} width={30} height={20} fill={PALETTE.tara700} />
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <Rect key={`${row}${col}`} x={8 + col * 5.6} y={46 + row * 6} width={4} height={4.5} fill={['#E2574C', '#F5C542', '#4FA3D1', '#7DBE5A', '#F08A3C'][(row + col) % 5]} />
        )),
      )}
      {[9, 14, 19, 24, 29, 34].map((x) => (
        <Line key={x} x1={x} y1={44} x2={x} y2={64} stroke="#2A1A0C" strokeWidth={0.7} />
      ))}
      <Rect x={8} y={33} width={26} height={4} fill={PALETTE.banig50} />
      <SvgText x={21} y={36.2} fontSize={3.2} fontWeight="bold" fill={PALETTE.tara700} textAnchor="middle">
        SARI-SARI
      </SvgText>
      <Rect x={6} y={64} width={30} height={3} fill={PALETTE.tara500} />
      <Rect x={84} y={34} width={2} height={50} fill={PALETTE.tara500} />
      <Line x1={70} y1={38} x2={100} y2={36} stroke={PALETTE.tara700} strokeWidth={0.4} />
      <Polygon points="78,40 92,28 104,42 96,52 80,52" fill="#6FA14E" />
      <Polygon points="82,44 92,34 100,46 92,54" fill="#5A8A3D" />
      <Polygon points="0,82 100,78 100,100 0,100" fill="#D9BC8A" />
      <Polygon points="0,88 100,85 100,100 0,100" fill="#C9A574" />
    </>
  );
}

function Palayan() {
  const bands = ['#86B85F', '#9CCB72', '#7AAE55', '#93C46A', '#6E9F4C', '#88BB62'];
  return (
    <>
      <Rect x={0} y={0} width={100} height={100} fill="#F4EBD0" />
      <Circle cx={20} cy={14} r={6} fill={PALETTE.sipag300} opacity={0.85} />
      <Polygon points="0,40 18,22 34,34 52,16 72,32 88,20 100,30 100,60 0,60" fill="#B7C99A" />
      <Polygon points="0,48 22,32 44,44 64,30 86,42 100,36 100,64 0,64" fill="#9FB884" />
      {bands.map((fill, i) => {
        const y = 50 + i * 8;
        return <Polygon key={fill + i} points={`0,${y + 4} 18,${y} 40,${y + 3} 62,${y - 1} 82,${y + 3} 100,${y} 100,${y + 9} 0,${y + 12}`} fill={fill} />;
      })}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const y = 50 + i * 8;
        return <Line key={i} x1={0} y1={y + 4} x2={100} y2={y} stroke="#D7EBC9" strokeWidth={0.6} opacity={0.8} />;
      })}
      <Polygon points="0,96 100,92 100,100 0,100" fill="#5E8B40" />
    </>
  );
}

function Sakayan() {
  return (
    <>
      <Rect x={0} y={0} width={100} height={100} fill="#FBE9C9" />
      <Polygon points="0,52 30,46 60,50 100,44 100,70 0,70" fill="#E3C79A" />
      <Polygon points="56,30 98,26 98,30 56,34" fill={PALETTE.tara500} />
      <Rect x={60} y={33} width={1.6} height={30} fill={PALETTE.tara700} />
      <Rect x={94} y={29} width={1.6} height={34} fill={PALETTE.tara700} />
      <Rect x={62} y={55} width={30} height={2} fill={PALETTE.tara300} />
      <Rect x={2} y={52} width={34} height={16} fill="#D94F3D" />
      <Rect x={2} y={48} width={34} height={5} fill={PALETTE.banig50} />
      <SvgText x={19} y={51.8} fontSize={3.4} fontWeight="bold" fill="#2A5DA8" textAnchor="middle">
        CUBAO
      </SvgText>
      {[4, 12, 20, 28].map((x) => (
        <Rect key={x} x={x} y={54} width={6} height={5} fill="#9ED3E6" />
      ))}
      <Rect x={2} y={62} width={34} height={2} fill={PALETTE.sipag400} />
      <Polygon points="36,56 44,58 44,68 36,68" fill="#C0392B" />
      <Rect x={40} y={52} width={1} height={6} fill="#C9CCD1" />
      <Circle cx={10} cy={69} r={3.4} fill={PALETTE.ink900} />
      <Circle cx={32} cy={69} r={3.4} fill={PALETTE.ink900} />
      <Circle cx={10} cy={69} r={1.4} fill="#C9CCD1" />
      <Circle cx={32} cy={69} r={1.4} fill="#C9CCD1" />
      <Polygon points="0,72 100,68 100,100 0,100" fill="#A89A88" />
      {[8, 30, 52, 74, 96].map((x) => (
        <Rect key={x} x={x - 4} y={83} width={8} height={1.4} fill={PALETTE.banig100} />
      ))}
    </>
  );
}

function Plaza() {
  const stars = [
    [8, 8],
    [22, 16],
    [38, 6],
    [62, 12],
    [78, 6],
    [92, 18],
    [14, 28],
    [86, 30],
  ];
  return (
    <>
      <Rect x={0} y={0} width={100} height={100} fill="#2B2140" />
      {stars.map(([x, y]) => (
        <Circle key={`${x}-${y}`} cx={x} cy={y} r={0.7} fill={PALETTE.banig50} />
      ))}
      <Circle cx={80} cy={14} r={5} fill="#FFF3C4" />
      <Circle cx={82} cy={13} r={4.4} fill="#2B2140" />
      <Polygon points="34,62 34,34 42,26 42,20 46,14 50,20 50,26 58,34 58,62" fill="#4A3A5C" />
      <Polygon points="40,62 40,46 46,40 52,46 52,62" fill="#2A1F38" />
      <Circle cx={46} cy={30} r={2.4} fill={PALETTE.sipag300} opacity={0.8} />
      <Polygon points="0,64 100,60 100,100 0,100" fill="#3A2E4A" />
      {[12, 88].map((x) => (
        <G key={x}>
          <Rect x={x - 0.7} y={44} width={1.4} height={20} fill="#1C1528" />
          <Circle cx={x} cy={43} r={5} fill={PALETTE.sipag300} opacity={0.25} />
          <Circle cx={x} cy={43} r={2} fill={PALETTE.sipag300} />
        </G>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Line key={i} x1={0} y1={70 + i * 8} x2={100} y2={66 + i * 8} stroke="#4C3E5E" strokeWidth={0.6} />
      ))}
    </>
  );
}

const SCENES: Record<BackdropId, ComponentType> = { bg_sari_sari: SariSari, bg_palayan: Palayan, bg_sakayan: Sakayan, bg_plaza: Plaza };

/**
 * A bought backdrop drawn behind the hero, in the app's low-poly style. Returns null for an id it does not know, so
 * the caller can fall back to the default scene.
 */
export function ShopBackdrop({ itemId }: { itemId: string }) {
  if (!isBackdropId(itemId)) return null;
  const Scene = SCENES[itemId];
  return (
    <View className="absolute inset-0" pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice">
        <Scene />
      </Svg>
    </View>
  );
}
