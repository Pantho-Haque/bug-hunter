import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

import {
  type AvatarMovementState,
  type AvatarPresentation,
  avatarTheme,
} from './avatarPresentation';

export interface AvatarRigProps {
  readonly isMoving: boolean;
  readonly movementState: AvatarMovementState;
  readonly presentation: AvatarPresentation;
  readonly reducedEffects: boolean;
}

export function AvatarRig({ isMoving, movementState, presentation, reducedEffects }: AvatarRigProps) {
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const reducedEffectsRef = useRef(reducedEffects);
  const celebrationUntilRef = useRef(0);

  useEffect(() => {
    reducedEffectsRef.current = reducedEffects;
  }, [reducedEffects]);

  useEffect(() => {
    if (reducedEffects) return;
    if (movementState === 'collecting' || movementState === 'interacting') {
      celebrationUntilRef.current = performance.now() + 600;
    }
  }, [movementState, reducedEffects]);

  useFrame(() => {
    if (reducedEffectsRef.current) return;
    const time = performance.now() / 1000;
    const swing = isMoving ? Math.sin(time * 9) * 0.8 : 0;
    const celebrate = performance.now() < celebrationUntilRef.current ? Math.sin(time * 16) * 0.7 : 0;
    const armSwing = movementState === 'turning-left' || movementState === 'turning-right' ? Math.sin(time * 12) * 0.45 : swing;
    if (leftArm.current) leftArm.current.rotation.x = armSwing;
    if (rightArm.current) rightArm.current.rotation.x = -armSwing + celebrate;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing;
    if (rightLeg.current) rightLeg.current.rotation.x = swing;
  });

  const theme = avatarTheme(presentation);

  return (
    <group>
      <mesh castShadow position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.34, 10, 8]} />
        <meshStandardMaterial color={theme.skinColor} flatShading />
      </mesh>
      <mesh castShadow position={[0, 2.55, -0.05]}>
        {theme.hairStyle === 'short' ? (
          <sphereGeometry args={[0.36, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        ) : (
          <sphereGeometry args={[0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        )}
        <meshStandardMaterial color={theme.hairColor} flatShading />
      </mesh>
      {theme.hairStyle === 'long' ? (
        <>
          <mesh castShadow position={[0, 2.1, -0.34]}>
            <boxGeometry args={[0.62, 0.6, 0.12]} />
            <meshStandardMaterial color={theme.hairColor} flatShading />
          </mesh>
          <mesh castShadow position={[-0.22, 1.55, -0.34]}>
            <cylinderGeometry args={[0.05, 0.07, 1, 6]} />
            <meshStandardMaterial color={theme.hairColor} flatShading />
          </mesh>
          <mesh castShadow position={[0.22, 1.55, -0.34]}>
            <cylinderGeometry args={[0.05, 0.07, 1, 6]} />
            <meshStandardMaterial color={theme.hairColor} flatShading />
          </mesh>
        </>
      ) : null}
      <mesh castShadow position={[0, 2.35, 0.32]}>
        <coneGeometry args={[0.07, 0.12, 6]} />
        <meshStandardMaterial color={theme.skinColor} flatShading />
      </mesh>
      <mesh castShadow position={[-0.3, 2.4, 0]}>
        <sphereGeometry args={[0.06, 6, 5]} />
        <meshStandardMaterial color={theme.skinColor} flatShading />
      </mesh>
      <mesh castShadow position={[0.3, 2.4, 0]}>
        <sphereGeometry args={[0.06, 6, 5]} />
        <meshStandardMaterial color={theme.skinColor} flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.85, 0]}>
        <boxGeometry args={[0.78, 0.8, 0.46]} />
        <meshStandardMaterial color={theme.shirtColor} flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.36, 0]}>
        <boxGeometry args={[0.78, 0.24, 0.46]} />
        <meshStandardMaterial color="#263a67" flatShading />
      </mesh>
      <group ref={leftArm} position={[-0.5, 1.83, 0]}>
        <mesh castShadow position={[0, -0.38, 0]}>
          <boxGeometry args={[0.22, 0.78, 0.24]} />
          <meshStandardMaterial color={theme.shirtColor} flatShading />
        </mesh>
        <mesh castShadow position={[0, -0.8, 0]}>
          <sphereGeometry args={[0.13, 6, 5]} />
          <meshStandardMaterial color={theme.skinColor} flatShading />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.5, 1.83, 0]}>
        <mesh castShadow position={[0, -0.38, 0]}>
          <boxGeometry args={[0.22, 0.78, 0.24]} />
          <meshStandardMaterial color={theme.shirtColor} flatShading />
        </mesh>
        <mesh castShadow position={[0, -0.8, 0]}>
          <sphereGeometry args={[0.13, 6, 5]} />
          <meshStandardMaterial color={theme.skinColor} flatShading />
        </mesh>
      </group>
      <group ref={leftLeg} position={[-0.22, 0.96, 0]}>
        <mesh castShadow position={[0, -0.46, 0]}>
          <boxGeometry args={[0.28, 0.9, 0.32]} />
          <meshStandardMaterial color={theme.pantsColor} flatShading />
        </mesh>
        <mesh castShadow position={[0, -0.88, 0.13]}>
          <boxGeometry args={[0.34, 0.18, 0.54]} />
          <meshStandardMaterial color="#eef3f5" flatShading />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.22, 0.96, 0]}>
        <mesh castShadow position={[0, -0.46, 0]}>
          <boxGeometry args={[0.28, 0.9, 0.32]} />
          <meshStandardMaterial color={theme.pantsColor} flatShading />
        </mesh>
        <mesh castShadow position={[0, -0.88, 0.13]}>
          <boxGeometry args={[0.34, 0.18, 0.54]} />
          <meshStandardMaterial color="#eef3f5" flatShading />
        </mesh>
      </group>
    </group>
  );
}