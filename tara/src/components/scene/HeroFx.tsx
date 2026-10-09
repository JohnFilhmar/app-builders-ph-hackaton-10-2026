import { useEffect, useRef } from "react";
import { Animated, Easing, Image, View } from "react-native";
import Svg, { Circle, Polygon } from "react-native-svg";

import { SCENE_ART } from "@/lib/theme/sceneArt";
import { PALETTE } from "@/lib/theme/palette";

type HeroFxProps = {
  slot: "aura" | "level_up_fx" | "quest_done_fx";
  size: number;
  /** an equipped aura item from the shop; null or unknown keeps the gold shards */
  auraItem?: string | null;
};

/** Gold shard ray: a thin kite from the centre outwards, rotated into place. */
const ray = (angle: number, inner: number, outer: number, half: number) => {
  const rad = (a: number) => (a * Math.PI) / 180;
  const pt = (r: number, a: number) =>
    `${50 + r * Math.cos(rad(a))},${50 + r * Math.sin(rad(a))}`;
  return [
    pt(inner, angle),
    pt((inner + outer) / 2, angle - half),
    pt(outer, angle),
    pt((inner + outer) / 2, angle + half),
  ].join(" ");
};

const RAYS = Array.from({ length: 12 }, (_, i) => i * 30);
const RAINBOW = [
  "#E2574C",
  "#F08A3C",
  "#F5C542",
  "#7DBE5A",
  "#4FA3D1",
  "#8E6CC9",
];
// firefly spots on a loose ring, split in two sets that twinkle against each other
const FIREFLIES = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 + (i % 3) * 0.2;
  const r = 30 + (i % 4) * 4;
  return {
    x: 50 + r * Math.cos(a),
    y: 50 + r * Math.sin(a),
    r: i % 3 ? 1.6 : 2.4,
  };
});

function Fireflies({ size, pulse }: { size: number; pulse: Animated.Value }) {
  return (
    <>
      {[0, 1].map((set) => (
        <Animated.View
          key={set}
          style={{
            position: "absolute",
            width: size,
            height: size,
            opacity: set
              ? pulse
              : pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.2],
                }),
          }}
        >
          <Svg width={size} height={size} viewBox="0 0 100 100">
            {FIREFLIES.filter((_, i) => i % 2 === set).map((f) => (
              <Circle
                key={`${f.x}-${f.y}`}
                cx={f.x}
                cy={f.y}
                r={f.r * 2.2}
                fill="#E6F59A"
                opacity={0.35}
              />
            ))}
            {FIREFLIES.filter((_, i) => i % 2 === set).map((f) => (
              <Circle
                key={`c${f.x}-${f.y}`}
                cx={f.x}
                cy={f.y}
                r={f.r}
                fill="#F4FFB8"
              />
            ))}
          </Svg>
        </Animated.View>
      ))}
    </>
  );
}

/**
 * Effect drawn behind the hero: its aura, the level-up burst or the quest-done burst. Uses the real art from
 * SCENE_ART when present; otherwise a slowly turning ring of polygon shards stands in. The aura is quiet, the bursts
 * are bigger, so celebrations keep their weight.
 */
export function HeroFx({ slot, size, auraItem = null }: HeroFxProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const isFirefly = slot === "aura" && auraItem === "aura_alitaptap";
  const rayColor = (i: number) =>
    slot === "aura" && auraItem === "aura_bahaghari"
      ? (RAINBOW[i % RAINBOW.length] ?? PALETTE.sipag400)
      : i % 2
        ? PALETTE.sipag400
        : PALETTE.sipag500;
  useEffect(() => {
    if (!isFirefly) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isFirefly, pulse]);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: slot === "aura" ? 24000 : 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, slot]);
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const art = SCENE_ART[slot];
  const isBurst = slot !== "aura";

  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      {art ? (
        <Image
          source={art}
          resizeMode="contain"
          style={{ width: size, height: size }}
        />
      ) : (
        <Animated.View
          style={{ width: size, height: size, transform: [{ rotate }] }}
        >
          {isFirefly ? (
            <Fireflies size={size} pulse={pulse} />
          ) : (
            <Svg width={size} height={size} viewBox="0 0 100 100">
              <Polygon
                points="50,14 75,25 86,50 75,75 50,86 25,75 14,50 25,25"
                fill={PALETTE.sipag300}
                opacity={isBurst ? 0.45 : 0.28}
              />
              {RAYS.map((a, i) => (
                <Polygon
                  key={a}
                  points={ray(
                    a,
                    isBurst ? 24 : 30,
                    isBurst ? (i % 2 ? 44 : 50) : 40,
                    isBurst ? 7 : 4,
                  )}
                  fill={rayColor(i)}
                  opacity={isBurst ? 0.9 : 0.5}
                />
              ))}
            </Svg>
          )}
        </Animated.View>
      )}
    </View>
  );
}
