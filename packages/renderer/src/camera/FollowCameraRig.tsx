import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';

import type { MissionPackageSchema, SimulationStateSchema } from '@codequest/domain';

import {
  defaultWorldConfig,
  facingToRadians,
} from '../world/worldTransform';

export type CameraMode = 'coding' | 'strategic' | 'preview';

export interface FollowCameraRigProps {
  readonly state: SimulationStateSchema;
  readonly mission: MissionPackageSchema;
  readonly mode: CameraMode;
  readonly reducedEffects: boolean;
  readonly resetToken: number;
}

const modeConfig: Record<CameraMode, { distance: number; height: number; lookAhead: number; fov: number }> = {
  coding: { distance: 3.6, height: 2.4, lookAhead: 1.6, fov: 56 },
  strategic: { distance: 9, height: 7, lookAhead: 2, fov: 48 },
  preview: { distance: 4.8, height: 3.6, lookAhead: 2.2, fov: 52 },
};

export function FollowCameraRig({ state, mission, mode, reducedEffects, resetToken }: FollowCameraRigProps) {
  const { camera } = useThree();
  const cfg = modeConfig[mode];
  const desiredPosition = useRef(new Vector3());
  const desiredTarget = useRef(new Vector3());
  const currentTarget = useRef(new Vector3());

  useEffect(() => {
    if (!('fov' in camera)) return;
    const perspective = camera as PerspectiveCamera;
    perspective.fov = cfg.fov;
    perspective.near = 0.1;
    perspective.far = 80;
    perspective.updateProjectionMatrix();
  }, [camera, cfg.fov]);

  useEffect(() => {
    desiredPosition.current.set(0, cfg.height, -cfg.distance);
    desiredTarget.current.set(0, 0.9, 0);
    currentTarget.current.copy(desiredTarget.current);
    camera.position.copy(desiredPosition.current);
    camera.lookAt(desiredTarget.current);
  }, [resetToken, camera, cfg.distance, cfg.height]);

  useFrame((_, delta) => {
    const x = state.avatar.cellX * defaultWorldConfig.cellSize;
    const z = state.avatar.cellZ * defaultWorldConfig.cellSize;
    const yaw = facingToRadians(state.avatar.facing);
    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);
    desiredPosition.current.set(x - forwardX * cfg.distance, cfg.height, z - forwardZ * cfg.distance);
    desiredTarget.current.set(x + forwardX * cfg.lookAhead, 0.9, z + forwardZ * cfg.lookAhead);

    let shortest = cfg.distance;
    for (const obj of mission.objects) {
      if (obj.kind !== 'blocker') continue;
      for (const cell of obj.occupiedCells) {
        const dx = cell.cellX - desiredTarget.current.x;
        const dz = cell.cellZ - desiredTarget.current.z;
        if (Math.abs(dx) > cfg.distance + 1 || Math.abs(dz) > cfg.distance + 1) continue;
        const projected = Math.sqrt(dx * dx + dz * dz);
        if (projected > 0 && projected < cfg.distance + 1 && projected < shortest) {
          shortest = projected;
        }
      }
    }
    const clampedDistance = MathUtils.clamp(shortest - 0.4, 1.2, cfg.distance);
    desiredPosition.current.set(
      desiredTarget.current.x - forwardX * clampedDistance,
      cfg.height,
      desiredTarget.current.z - forwardZ * clampedDistance,
    );

    const t = reducedEffects ? 1 : Math.min(1, delta * 4);
    camera.position.lerp(desiredPosition.current, t);
    currentTarget.current.lerp(desiredTarget.current, Math.min(1, delta * 6));
    camera.lookAt(currentTarget.current);
  });

  return null;
}