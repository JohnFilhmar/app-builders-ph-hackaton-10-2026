import { useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

export type PolyFrameProps = {
  children?: ReactNode;
  /** corner cut in dp; the chamfer is what makes every surface read as polygon-built */
  cut?: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  /** height of the darker facet under the shape, like a game tile's side */
  depth?: number;
  depthColor?: string;
  className?: string;
};

/** Points of a rectangle with chamfered corners, inset by half the stroke so the outline is never clipped. */
export function chamferPoints(width: number, height: number, cut: number, inset = 0): string {
  const c = Math.min(cut, width / 2, height / 2);
  const l = inset;
  const t = inset;
  const r = width - inset;
  const b = height - inset;
  return [
    [l + c, t], [r - c, t], [r, t + c], [r, b - c], [r - c, b], [l + c, b], [l, b - c], [l, t + c],
  ].map(([x, y]) => `${x},${y}`).join(' ');
}

/**
 * A chamfered polygon surface drawn in SVG behind its children. The base for cards, buttons, chips and badges, so
 * the whole app shares one faceted silhouette.
 */
export function PolyFrame({ children, cut = 10, fill, stroke, strokeWidth = 1.5, depth = 0, depthColor, className = '' }: PolyFrameProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };
  const faceH = size.h - depth;
  const inset = stroke ? strokeWidth / 2 : 0;
  return (
    <View onLayout={onLayout} className={className} style={{ paddingBottom: depth }}>
      {size.w > 0 ? (
        <Svg width={size.w} height={size.h} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
          {depth > 0 ? (
            <Polygon points={chamferPoints(size.w, faceH, cut, inset)} fill={depthColor ?? stroke ?? fill} translateY={depth} />
          ) : null}
          <Polygon points={chamferPoints(size.w, faceH, cut, inset)} fill={fill} stroke={stroke} strokeWidth={stroke ? strokeWidth : 0} />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}
