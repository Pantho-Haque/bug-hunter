import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { Vector3 } from 'three';

import type { MissionPackageSchema, SimulationStateSchema } from '@codequest/domain';

import { defaultWorldConfig } from '../world/worldTransform';

export interface FollowCameraRigProps {
  readonly state: SimulationStateSchema;
  readonly mission: MissionPackageSchema;
  readonly reducedEffects: boolean;
  readonly resetToken: number;
}

const HOME_DISTANCE = 7;
const HOME_HEIGHT = 4.5;
const HOME_LOOK_AHEAD = 1.8;
const MIN_AZIMUTH = -Math.PI * 0.85;
const MAX_AZIMUTH = Math.PI * 0.85;
const MIN_DISTANCE = 3.5;
const MAX_DISTANCE = 12;
const MIN_HEIGHT = 2.2;
const MAX_HEIGHT = 8;

export function FollowCameraRig({ state, mission, reducedEffects, resetToken }: FollowCameraRigProps) {
  const { camera, gl } = useThree();
  const azimuthRef = useRef<number>(0);
  const distanceRef = useRef<number>(HOME_DISTANCE);
  const heightRef = useRef<number>(HOME_HEIGHT);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const desiredPosition = useRef(new Vector3());
  const desiredTarget = useRef(new Vector3());
  const currentTarget = useRef(new Vector3());

  useEffect(() => {
    if (!('fov' in camera)) return;
    const perspective = camera as PerspectiveCamera;
    perspective.fov = 52;
    perspective.near = 0.1;
    perspective.far = 100;
    perspective.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    azimuthRef.current = 0;
    distanceRef.current = HOME_DISTANCE;
    heightRef.current = HOME_HEIGHT;
    desiredPosition.current.set(0, HOME_HEIGHT, -HOME_DISTANCE);
    desiredTarget.current.set(0, 0.9, 0);
    currentTarget.current.copy(desiredTarget.current);
    camera.position.copy(desiredPosition.current);
    camera.lookAt(desiredTarget.current);
  }, [resetToken, camera]);

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      draggingRef.current = true;
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const last = lastPointerRef.current;
      if (!last) return;
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      azimuthRef.current = Math.max(MIN_AZIMUTH, Math.min(MAX_AZIMUTH, azimuthRef.current - dx * 0.005));
      const distanceDelta = dy * 0.01;
      distanceRef.current = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, distanceRef.current + distanceDelta));
      heightRef.current = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, heightRef.current + dy * 0.005));
    };

    const onPointerUp = (event: PointerEvent) => {
      draggingRef.current = false;
      lastPointerRef.current = null;
      canvas.style.cursor = 'grab';
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // pointer was already released
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY * 0.005;
      distanceRef.current = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, distanceRef.current + delta));
    };

    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.style.cursor = '';
    };
  }, [gl]);

  useFrame((_, delta) => {
    const x = state.avatar.cellX * defaultWorldConfig.cellSize;
    const z = state.avatar.cellZ * defaultWorldConfig.cellSize;
    const azimuth = azimuthRef.current;
    const distance = distanceRef.current;
    const height = heightRef.current;
    const offsetX = Math.sin(azimuth) * distance;
    const offsetZ = Math.cos(azimuth) * distance;
    const targetX = x + Math.sin(azimuth) * HOME_LOOK_AHEAD;
    const targetZ = z + Math.cos(azimuth) * HOME_LOOK_AHEAD;
    desiredPosition.current.set(x - offsetX, height, z - offsetZ);
    desiredTarget.current.set(targetX, 0.9, targetZ);

    let shortest = distance;
    for (const obj of mission.objects) {
      if (obj.kind !== 'blocker') continue;
      for (const cell of obj.occupiedCells) {
        const dx = cell.cellX - desiredTarget.current.x;
        const dz = cell.cellZ - desiredTarget.current.z;
        if (Math.abs(dx) > distance + 1 || Math.abs(dz) > distance + 1) continue;
        const projected = Math.sqrt(dx * dx + dz * dz);
        if (projected > 0 && projected < distance + 1 && projected < shortest) {
          shortest = projected;
        }
      }
    }
    const clampedDistance = Math.max(0.4, shortest - 0.4);
    if (clampedDistance < distance) {
      desiredPosition.current.set(
        desiredTarget.current.x - (Math.sin(azimuth) * clampedDistance),
        height,
        desiredTarget.current.z - (Math.cos(azimuth) * clampedDistance),
      );
    }

    const t = reducedEffects ? 1 : Math.min(1, delta * 6);
    camera.position.lerp(desiredPosition.current, t);
    currentTarget.current.lerp(desiredTarget.current, Math.min(1, delta * 8));
    camera.lookAt(currentTarget.current);
  });

  return null;
}