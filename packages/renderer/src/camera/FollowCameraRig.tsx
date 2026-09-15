import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { Plane, Raycaster, Vector2, Vector3 } from 'three';

import type { MissionPackageSchema, SimulationStateSchema } from '@codequest/domain';

import { defaultWorldConfig } from '../world/worldTransform';

export interface FollowCameraRigProps {
  readonly state: SimulationStateSchema;
  readonly mission: MissionPackageSchema;
  readonly reducedEffects: boolean;
  readonly resetToken: number;
}

const HOME_DISTANCE = 7;
const HOME_ELEVATION = Math.atan2(4.5, HOME_DISTANCE);
const HOME_LOOK_AHEAD = 1.8;
const MIN_DISTANCE = 3.5;
const MAX_DISTANCE = 12;
const MIN_ELEVATION = Math.PI * 0.12;
const MAX_ELEVATION = Math.PI * 0.43;
const MAX_FOCUS_OFFSET = 4;

export function FollowCameraRig({ state, mission, reducedEffects, resetToken }: FollowCameraRigProps) {
  const { camera, gl } = useThree();
  const azimuthRef = useRef<number>(0);
  const distanceRef = useRef<number>(HOME_DISTANCE);
  const elevationRef = useRef<number>(HOME_ELEVATION);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const focusOffsetRef = useRef(new Vector3(0, 0, HOME_LOOK_AHEAD));
  const desiredPosition = useRef(new Vector3());
  const desiredTarget = useRef(new Vector3());
  const currentTarget = useRef(new Vector3());
  const avatarAnchor = useRef(new Vector3());
  const hasAvatarAnchor = useRef(false);
  const raycasterRef = useRef(new Raycaster());
  const cursorRef = useRef(new Vector2());
  const groundRef = useRef(new Plane(new Vector3(0, 1, 0), 0));
  const cursorHitRef = useRef(new Vector3());

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
    elevationRef.current = HOME_ELEVATION;
    focusOffsetRef.current.set(0, 0, HOME_LOOK_AHEAD);
    desiredPosition.current.set(0, Math.sin(HOME_ELEVATION) * HOME_DISTANCE, -Math.cos(HOME_ELEVATION) * HOME_DISTANCE);
    desiredTarget.current.set(0, 0.9, 0);
    currentTarget.current.copy(desiredTarget.current);
    hasAvatarAnchor.current = false;
    camera.position.copy(desiredPosition.current);
    camera.lookAt(desiredTarget.current);
  }, [resetToken, camera]);

  useEffect(() => {
    const canvas = gl.domElement;
    const avatarPosition = () =>
      new Vector3(
        state.avatar.cellX * defaultWorldConfig.cellSize,
        0,
        state.avatar.cellZ * defaultWorldConfig.cellSize,
      );

    const worldAtCursor = (event: PointerEvent | WheelEvent): Vector3 | undefined => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return undefined;
      cursorRef.current.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycasterRef.current.setFromCamera(cursorRef.current, camera);
      return raycasterRef.current.ray.intersectPlane(groundRef.current, cursorHitRef.current)
        ? cursorHitRef.current.clone()
        : undefined;
    };

    const setFocusFromCursor = (event: PointerEvent | WheelEvent, strength = 1) => {
      const hit = worldAtCursor(event);
      if (!hit) return;
      const offset = hit.sub(avatarPosition());
      offset.y = 0;
      offset.clampLength(0, MAX_FOCUS_OFFSET);
      focusOffsetRef.current.lerp(offset, strength);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      setFocusFromCursor(event);
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
      azimuthRef.current -= dx * 0.005;
      elevationRef.current = Math.max(
        MIN_ELEVATION,
        Math.min(MAX_ELEVATION, elevationRef.current + dy * 0.005),
      );
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
      const previousDistance = distanceRef.current;
      const nextDistance = Math.max(
        MIN_DISTANCE,
        Math.min(MAX_DISTANCE, previousDistance + event.deltaY * 0.006),
      );
      distanceRef.current = nextDistance;
      const zoomProgress = 1 - nextDistance / previousDistance;
      setFocusFromCursor(event, zoomProgress);
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
  }, [camera, gl, state.avatar.cellX, state.avatar.cellZ]);

  useFrame((_, delta) => {
    const x = state.avatar.cellX * defaultWorldConfig.cellSize;
    const z = state.avatar.cellZ * defaultWorldConfig.cellSize;
    if (!hasAvatarAnchor.current) {
      avatarAnchor.current.set(x, 0, z);
      hasAvatarAnchor.current = true;
    } else {
      // The simulation advances a cell before the avatar mesh has finished its stride.
      // Keeping a separate, damped anchor makes the camera follow that visible stride.
      const anchorSmoothing = reducedEffects ? 1 : 1 - Math.exp(-4.5 * delta);
      avatarAnchor.current.x += (x - avatarAnchor.current.x) * anchorSmoothing;
      avatarAnchor.current.z += (z - avatarAnchor.current.z) * anchorSmoothing;
    }
    const focus = focusOffsetRef.current;
    const azimuth = azimuthRef.current;
    const distance = distanceRef.current;
    const elevation = elevationRef.current;
    const horizontalDistance = Math.cos(elevation) * distance;
    const targetX = avatarAnchor.current.x + focus.x;
    const targetZ = avatarAnchor.current.z + focus.z;
    desiredTarget.current.set(targetX, 0.9, targetZ);
    desiredPosition.current.set(
      targetX - Math.sin(azimuth) * horizontalDistance,
      0.9 + Math.sin(elevation) * distance,
      targetZ - Math.cos(azimuth) * horizontalDistance,
    );

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
        desiredPosition.current.y,
        desiredTarget.current.z - (Math.cos(azimuth) * clampedDistance),
      );
    }

    const t = reducedEffects ? 1 : 1 - Math.exp(-7 * delta);
    camera.position.lerp(desiredPosition.current, t);
    currentTarget.current.lerp(desiredTarget.current, reducedEffects ? 1 : 1 - Math.exp(-7 * delta));
    camera.lookAt(currentTarget.current);
  });

  return null;
}
