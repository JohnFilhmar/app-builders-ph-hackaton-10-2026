import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AvatarStage } from '@/components/avatar/AvatarStage';
import { HeroFrame } from '@/components/scene/HeroFrame';
import { SceneBackdrop } from '@/components/scene/SceneBackdrop';
import { ShopBackdrop } from '@/components/scene/ShopBackdrop';
import { useGameStore } from '@/lib/stores/gameStore';

type HeroSceneProps = {
  className?: string;
  /** overlays drawn above the hero and below the frame, such as the level badge */
  children?: ReactNode;
};

/** The hero standing in its scene, dressed in whatever backdrop, aura and frame the player has equipped. */
export function HeroScene({ className, children }: HeroSceneProps) {
  const equipped = useGameStore((s) => s.state.equipped);
  return (
    <View className={className}>
      {equipped.backdrop ? <ShopBackdrop itemId={equipped.backdrop} /> : <SceneBackdrop slot="home_backdrop" />}
      <AvatarStage className="flex-1" fx="aura" auraItem={equipped.aura} />
      {equipped.frame ? <HeroFrame itemId={equipped.frame} /> : null}
      {children}
    </View>
  );
}
