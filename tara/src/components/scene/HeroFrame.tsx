import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Rect } from 'react-native-svg';

import { PALETTE } from '@/lib/theme/palette';

const BAMBOO = { pole: '#B9A54E', shade: '#8C7A2E', node: '#6E5F22' };

function Bamboo({ w, h }: { w: number; h: number }) {
  const t = 10;
  const nodes = (length: number) => Array.from({ length: Math.floor(length / 46) }, (_, i) => 30 + i * 46);
  return (
    <>
      <Rect x={0} y={0} width={w} height={t} fill={BAMBOO.pole} />
      <Rect x={0} y={h - t} width={w} height={t} fill={BAMBOO.pole} />
      <Rect x={0} y={0} width={t} height={h} fill={BAMBOO.pole} />
      <Rect x={w - t} y={0} width={t} height={h} fill={BAMBOO.pole} />
      <Rect x={0} y={t - 3} width={w} height={3} fill={BAMBOO.shade} />
      <Rect x={0} y={h - 3} width={w} height={3} fill={BAMBOO.shade} />
      {nodes(w).map((x) => (
        <Rect key={`t${x}`} x={x} y={0} width={3} height={t} fill={BAMBOO.node} />
      ))}
      {nodes(w).map((x) => (
        <Rect key={`b${x}`} x={x} y={h - t} width={3} height={t} fill={BAMBOO.node} />
      ))}
      {nodes(h).map((y) => (
        <Rect key={`l${y}`} x={0} y={y} width={t} height={3} fill={BAMBOO.node} />
      ))}
      {nodes(h).map((y) => (
        <Rect key={`r${y}`} x={w - t} y={y} width={t} height={3} fill={BAMBOO.node} />
      ))}
    </>
  );
}

function Gold({ w, h }: { w: number; h: number }) {
  const c = 18;
  const ring = (inset: number, cut: number) =>
    `${inset + cut},${inset} ${w - inset - cut},${inset} ${w - inset},${inset + cut} ${w - inset},${h - inset - cut} ${w - inset - cut},${h - inset} ${inset + cut},${h - inset} ${inset},${h - inset - cut} ${inset},${inset + cut}`;
  const gem = (x: number, y: number) => `${x},${y - 7} ${x + 7},${y} ${x},${y + 7} ${x - 7},${y}`;
  return (
    <>
      <Polygon points={ring(3, c)} fill="none" stroke={PALETTE.sipag500} strokeWidth={6} />
      <Polygon points={ring(10, c - 4)} fill="none" stroke={PALETTE.sipag300} strokeWidth={2} />
      {[
        [c, c],
        [w - c, c],
        [c, h - c],
        [w - c, h - c],
      ].map(([x = 0, y = 0]) => (
        <Polygon key={`${x}-${y}`} points={gem(x, y)} fill={PALETTE.sipag400} stroke={PALETTE.sipag600} strokeWidth={1.5} />
      ))}
    </>
  );
}

/** A bought frame drawn over the edge of a hero scene. Draws nothing for an id it does not know. */
export function HeroFrame({ itemId }: { itemId: string }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  if (itemId !== 'frame_kawayan' && itemId !== 'frame_ginto') return null;
  return (
    <View className="absolute inset-0" pointerEvents="none" onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {size.w > 0 ? (
        <Svg width={size.w} height={size.h}>
          {itemId === 'frame_kawayan' ? <Bamboo w={size.w} h={size.h} /> : <Gold w={size.w} h={size.h} />}
        </Svg>
      ) : null}
    </View>
  );
}
