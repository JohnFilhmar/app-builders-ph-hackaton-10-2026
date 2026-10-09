import { useMemo, useRef } from 'react';
import { PanResponder, type GestureResponderEvent, type GestureResponderHandlers } from 'react-native';

import type { ModelTransform } from '@/types/viewer';

const ROTATE_PER_PX = 0.01;
const MOVE_PER_PX = 0.005;
const DEPTH_PER_PX = 0.01;

type TouchPoint = { pageX: number; pageY: number };
type Baseline = { transform: ModelTransform; touches: number; x: number; y: number; spread: number };

const centroid = (t: TouchPoint[]) => ({
  x: t.reduce((s, p) => s + p.pageX, 0) / t.length,
  y: t.reduce((s, p) => s + p.pageY, 0) / t.length,
});
const spread = (t: TouchPoint[]) => (t.length < 2 || !t[0] || !t[1] ? 0 : Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY));

/**
 * Touch handlers that turn gestures into a model transform: one finger rotates (X/Y axes),
 * two fingers move along X/Y, pinching moves along Z. Spread the result onto the view that wraps the 3D canvas.
 * @param transform current transform (read at gesture start)
 * @param onChange receives every updated transform
 */
export function useModelGestures(transform: ModelTransform, onChange: (next: ModelTransform) => void): GestureResponderHandlers {
  const latest = useRef(transform);
  latest.current = transform;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const baseline = useRef<Baseline | null>(null);

  return useMemo(() => {
    const rebase = (touches: TouchPoint[]) => {
      const c = centroid(touches);
      baseline.current = { transform: latest.current, touches: touches.length, x: c.x, y: c.y, spread: spread(touches) };
    };
    const touchesOf = (e: GestureResponderEvent): TouchPoint[] => e.nativeEvent.touches;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => rebase(touchesOf(e)),
      onPanResponderMove: (e) => {
        const touches = touchesOf(e);
        if (touches.length === 0) return;
        // finger count changed mid-gesture: restart from where the model is now, so it never jumps
        if (!baseline.current || baseline.current.touches !== touches.length) rebase(touches);
        const base = baseline.current;
        if (!base) return;
        const c = centroid(touches);
        const dx = c.x - base.x;
        const dy = c.y - base.y;
        const [px, py, pz] = base.transform.position;
        const [rx, ry, rz] = base.transform.rotation;

        if (touches.length === 1) {
          onChangeRef.current({ position: base.transform.position, rotation: [rx + dy * ROTATE_PER_PX, ry + dx * ROTATE_PER_PX, rz] });
        } else {
          const depth = (spread(touches) - base.spread) * DEPTH_PER_PX;
          onChangeRef.current({ position: [px + dx * MOVE_PER_PX, py - dy * MOVE_PER_PX, pz + depth], rotation: base.transform.rotation });
        }
      },
      onPanResponderRelease: () => {
        baseline.current = null;
      },
    }).panHandlers;
  }, []);
}
