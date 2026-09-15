import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

import type { SimulationStateSchema } from '@codequest/domain';

import { type QualityTier } from '../quality/qualityTier';
import {
  type AvatarMovementState,
  type AvatarPresentation,
  facingToRadians,
} from './avatarPresentation';
import { AvatarRig } from './AvatarRig';

export interface AvatarEntityProps {
  readonly state: SimulationStateSchema;
  readonly movementState: AvatarMovementState;
  readonly presentation: AvatarPresentation;
  readonly reducedEffects: boolean;
  readonly stepDurationMs?: number;
  readonly quality?: QualityTier;
}

interface TweenState {
  readonly fromCell: { cellX: number; cellZ: number };
  readonly fromYaw: number;
  readonly toCell: { cellX: number; cellZ: number };
  readonly toYaw: number;
  readonly startedAt: number;
  readonly duration: number;
}

export function AvatarEntity({
  state,
  movementState,
  presentation,
  reducedEffects,
  stepDurationMs = 360,
  quality,
}: AvatarEntityProps) {
  const groupRef = useRef<Group | null>(null);
  const tweenRef = useRef<TweenState | null>(null);
  const lastKeyRef = useRef<string>(`${state.avatar.cellX}:${state.avatar.cellZ}:${state.avatar.facing}`);
  const visualStateRef = useRef<{ x: number; z: number; yaw: number }>({
    x: state.avatar.cellX,
    z: state.avatar.cellZ,
    yaw: facingToRadians(state.avatar.facing),
  });

  useEffect(() => {
    const key = `${state.avatar.cellX}:${state.avatar.cellZ}:${state.avatar.facing}`;
    if (key === lastKeyRef.current) return;
    const [prevX, prevZ, prevFacing] = lastKeyRef.current.split(':');
    tweenRef.current = {
      fromCell: { cellX: Number(prevX), cellZ: Number(prevZ) },
      fromYaw: facingDegreesFromName(prevFacing),
      toCell: { cellX: state.avatar.cellX, cellZ: state.avatar.cellZ },
      toYaw: facingToRadians(state.avatar.facing),
      startedAt: performance.now(),
      duration: reducedEffects ? 0 : stepDurationMs,
    };
    lastKeyRef.current = key;
  }, [state.avatar.cellX, state.avatar.cellZ, state.avatar.facing, reducedEffects, stepDurationMs]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const tween = tweenRef.current;
    if (tween) {
      const elapsed = performance.now() - tween.startedAt;
      const t = tween.duration === 0 ? 1 : Math.min(1, elapsed / tween.duration);
      const eased = easeInOut(t);
      const x = tween.fromCell.cellX + (tween.toCell.cellX - tween.fromCell.cellX) * eased;
      const z = tween.fromCell.cellZ + (tween.toCell.cellZ - tween.fromCell.cellZ) * eased;
      const yaw = tween.fromYaw + shortestAngle(tween.fromYaw, tween.toYaw) * eased;
      visualStateRef.current = { x, z, yaw };
      if (t >= 1) tweenRef.current = null;
    } else {
      visualStateRef.current = {
        x: state.avatar.cellX,
        z: state.avatar.cellZ,
        yaw: facingToRadians(state.avatar.facing),
      };
    }
    group.position.x = visualStateRef.current.x;
    group.position.z = visualStateRef.current.z;
    group.rotation.y = visualStateRef.current.yaw;
  });

  return (
    <group ref={groupRef}>
      <AvatarRig
        isMoving={tweenRef.current !== null || movementState === 'walking'}
        movementState={movementState}
        presentation={presentation}
        quality={quality}
        reducedEffects={reducedEffects}
      />
    </group>
  );
}

const facingDegreesFromName = (name: string): number => {
  switch (name) {
    case 'north':
      return 0;
    case 'east':
      return Math.PI / 2;
    case 'south':
      return Math.PI;
    case 'west':
      return -Math.PI / 2;
    default:
      return 0;
  }
};

const shortestAngle = (from: number, to: number): number => {
  let diff = (to - from) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
};

const easeInOut = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};