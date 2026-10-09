import { Canvas, useFrame } from '@react-three/fiber/native';
import { Asset } from 'expo-asset';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable } from 'react-native';
import { AnimationMixer, LoopOnce, SkinnedMesh, type AnimationAction, type Group } from 'three';

import placeholderAvatar from '../../../assets/placeholder_avatar.glb';
import { loadGlb, type LoadedModel } from '@/lib/viewer3d/loadGlb';

let cached: Promise<LoadedModel> | null = null;

/** Loads the avatar GLB once per app run; every screen reuses the same scene. */
function loadAvatar(): Promise<LoadedModel> {
  cached ??= (async () => {
    const asset = await Asset.fromModule(placeholderAvatar).downloadAsync();
    if (!asset.localUri) throw new Error('avatar asset has no local file');
    const model = await loadGlb(asset.localUri, 'avatar.glb');
    // a moving skinned mesh can be culled near the screen edge; keep it drawn
    model.scene.traverse((node) => {
      if (node instanceof SkinnedMesh) node.frustumCulled = false;
    });
    return model;
  })();
  return cached;
}

type AvatarProps = { model: LoadedModel; jumpRequest: number; onJumpDone: () => void };

function Avatar({ model, jumpRequest, onJumpDone }: AvatarProps) {
  const root = useRef<Group>(null);
  const mixer = useRef<AnimationMixer | null>(null);
  const idle = useRef<AnimationAction | null>(null);
  const jump = useRef<AnimationAction | null>(null);
  const hopStartedAt = useRef<number | null>(null);

  useEffect(() => {
    const m = new AnimationMixer(model.scene);
    mixer.current = m;
    const idleClip = model.animations.find((c) => /idle/i.test(c.name)) ?? model.animations[0];
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
  }, [model, onJumpDone]);

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
      {/* the placeholder rig is authored facing away from the camera */}
      <primitive object={model.scene} rotation={[0, Math.PI, 0]} />
    </group>
  );
}

type AvatarStageProps = { className?: string };

/**
 * The player's avatar standing on Bahay. Idle plays on a loop; tapping plays the jump once, and further taps are
 * ignored until it lands. Renders only while its screen is focused and the app is in the foreground.
 */
export function AvatarStage({ className }: AvatarStageProps) {
  const [model, setModel] = useState<LoadedModel | null>(null);
  const [jumpRequest, setJumpRequest] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [isForeground, setIsForeground] = useState(AppState.currentState === 'active');

  useEffect(() => {
    let isCurrent = true;
    void loadAvatar().then((m) => isCurrent && setModel(m));
    return () => {
      isCurrent = false;
    };
  }, []);
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

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Tap your hero to jump" onPress={onTap} className={className}>
      <Canvas frameloop={isFocused && isForeground ? 'always' : 'never'} camera={{ position: [0, 0.3, 3.2], fov: 42 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[3, 5, 4]} intensity={1.8} />
        <mesh position={[0, -1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.7, 48]} />
          <meshBasicMaterial color="#FFE08A" transparent opacity={0.45} />
        </mesh>
        {model ? <Avatar model={model} jumpRequest={jumpRequest} onJumpDone={onJumpDone} /> : null}
      </Canvas>
    </Pressable>
  );
}
