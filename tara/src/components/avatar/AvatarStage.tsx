import { Canvas, useFrame } from '@react-three/fiber/native';
import { Asset } from 'expo-asset';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { AnimationMixer, Box3, LoopOnce, SkinnedMesh, type AnimationAction, type Group } from 'three';

import { HeroFx } from '@/components/scene/HeroFx';
import { AVATAR_SOURCES } from '@/lib/avatar/avatarSources';
import { useSetupStore } from '@/lib/stores/setupStore';
import { loadGlb, type LoadedModel } from '@/lib/viewer3d/loadGlb';
import type { BaseAvatar } from '@/types/gameEvents';

// every hero is fitted to the same size so any rig frames the same way in the camera
const HERO_HEIGHT = 1.75;
const FLOOR_Y = -0.95;
const cache = new Map<BaseAvatar, Promise<LoadedModel>>();

async function loadModule(moduleId: number, name: string): Promise<LoadedModel> {
  const asset = await Asset.fromModule(moduleId).downloadAsync();
  if (!asset.localUri) throw new Error(`${name} has no local file`);
  return loadGlb(asset.localUri, name);
}

/** Loads a gender's hero once per app run, scaled to a fixed height with its feet on the floor. */
function loadAvatar(gender: BaseAvatar): Promise<LoadedModel> {
  const cached = cache.get(gender);
  if (cached) return cached;
  const promise = (async () => {
    const model = await loadModule(AVATAR_SOURCES[gender].file, `${gender}_hero.glb`);
    model.scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(model.scene);
    const height = box.max.y - box.min.y;
    if (height > 0) {
      // loadGlb already fitted the scene, so rescale relative to that and drop the feet onto the floor
      const factor = HERO_HEIGHT / height;
      model.scene.scale.multiplyScalar(factor);
      model.scene.position.y = FLOOR_Y - (box.min.y - model.scene.position.y) * factor;
    }
    // a moving skinned mesh can be culled near the screen edge; keep it drawn
    model.scene.traverse((node) => {
      if (node instanceof SkinnedMesh) node.frustumCulled = false;
    });
    return model;
  })();
  cache.set(gender, promise);
  return promise;
}

type AvatarProps = { model: LoadedModel; facesAway: boolean; jumpRequest: number; onJumpDone: () => void };

function Avatar({ model, facesAway, jumpRequest, onJumpDone }: AvatarProps) {
  const root = useRef<Group>(null);
  const mixer = useRef<AnimationMixer | null>(null);
  const idle = useRef<AnimationAction | null>(null);
  const jump = useRef<AnimationAction | null>(null);
  const hopStartedAt = useRef<number | null>(null);
  // a three.js object lives in one scene only, and Home stays mounted under the quest screen, so each stage gets its own copy of the rig
  const scene = useMemo(() => cloneSkinned(model.scene), [model]);

  useEffect(() => {
    const m = new AnimationMixer(scene);
    mixer.current = m;
    const idleClip = model.animations.find((c) => /idle/i.test(c.name)) ?? model.animations.find((c) => c.name !== 'jump');
    const jumpClip = model.animations.find((c) => /jump/i.test(c.name));
    if (idleClip) idle.current = m.clipAction(idleClip).play();
    if (jumpClip) {
      const action = m.clipAction(jumpClip);
      action.setLoop(LoopOnce, 1);
      action.clampWhenFinished = true;
      jump.current = action;
    }
    const finished = () => {
      jump.current?.fadeOut(0.2);
      idle.current?.reset().fadeIn(0.2).play();
      onJumpDone();
    };
    m.addEventListener('finished', finished);
    return () => {
      m.removeEventListener('finished', finished);
      m.stopAllAction();
    };
  }, [scene, model, onJumpDone]);

  useEffect(() => {
    if (jumpRequest === 0) return;
    if (jump.current) {
      idle.current?.fadeOut(0.15);
      jump.current.reset().fadeIn(0.15).play();
    } else {
      // placeholder rig has no jump clip: a short code-driven hop stands in for it
      hopStartedAt.current = Date.now();
    }
  }, [jumpRequest]);

  useFrame((_, delta) => {
    mixer.current?.update(delta);
    const node = root.current;
    if (!node || hopStartedAt.current === null) return;
    const t = (Date.now() - hopStartedAt.current) / 650;
    if (t >= 1) {
      node.position.y = 0;
      hopStartedAt.current = null;
      onJumpDone();
    } else node.position.y = Math.sin(Math.PI * t) * 0.45;
  });

  return (
    <group ref={root}>
      <primitive object={scene} rotation={[0, facesAway ? Math.PI : 0, 0]} />
    </group>
  );
}

type AvatarStageProps = {
  className?: string;
  /** effect drawn behind the hero: its aura, or a celebration burst */
  fx?: 'aura' | 'level_up_fx' | 'quest_done_fx';
  /** jump once as soon as the hero loads, for celebration screens */
  celebrate?: boolean;
};

/**
 * The player's avatar standing on Bahay. Idle plays on a loop; tapping plays the jump once, and further taps are
 * ignored until it lands. Renders only while its screen is focused and the app is in the foreground.
 */
export function AvatarStage({ className, fx, celebrate = false }: AvatarStageProps) {
  const gender = useSetupStore((s) => s.baseAvatar);
  const [model, setModel] = useState<LoadedModel | null>(null);
  const [jumpRequest, setJumpRequest] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [isForeground, setIsForeground] = useState(AppState.currentState === 'active');
  const [fxSize, setFxSize] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    void loadAvatar(gender).then((m) => isCurrent && setModel(m));
    return () => {
      isCurrent = false;
    };
  }, [gender]);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setIsForeground(s === 'active'));
    return () => sub.remove();
  }, []);

  const onJumpDone = useCallback(() => setIsJumping(false), []);
  const onTap = () => {
    if (isJumping || !model) return;
    setIsJumping(true);
    setJumpRequest((n) => n + 1);
  };
  useEffect(() => {
    if (!celebrate || !model) return;
    const timer = setTimeout(() => {
      setIsJumping(true);
      setJumpRequest((n) => n + 1);
    }, 350);
    return () => clearTimeout(timer);
  }, [celebrate, model]);

  return (
    <View className={className} onLayout={(e) => setFxSize(Math.min(e.nativeEvent.layout.width, e.nativeEvent.layout.height) * 0.95)}>
      {fx && fxSize > 0 ? (
        <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
          <HeroFx slot={fx} size={fxSize} />
        </View>
      ) : null}
      <Canvas frameloop={isFocused && isForeground ? 'always' : 'never'} camera={{ position: [0, 0, 3.2], fov: 42 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[3, 5, 4]} intensity={1.8} />
        <mesh position={[0, FLOOR_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* six segments: the hero stands on a hexagon tile, in keeping with the polygon look */}
          <circleGeometry args={[0.75, 6]} />
          <meshBasicMaterial color="#E8A90E" transparent opacity={0.35} />
        </mesh>
        {model ? <Avatar model={model} facesAway={AVATAR_SOURCES[gender].facesAway} jumpRequest={jumpRequest} onJumpDone={onJumpDone} /> : null}
      </Canvas>
      {/* the GL view swallows the first touch, so taps land on a transparent layer above it */}
      <Pressable accessibilityRole="button" accessibilityLabel="Tap your hero to jump" onPress={onTap} className="absolute inset-0" />
    </View>
  );
}
