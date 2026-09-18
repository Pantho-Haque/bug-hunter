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
// π puts the camera south of the avatar looking north: north is up on screen and
// east is right, the same orientation as the minimap.
const HOME_AZIMUTH = Math.PI;
const MIN_DISTANCE = 3.5;
const MAX_DISTANCE = 12;
const MIN_ELEVATION = Math.PI * 0.12;
const MAX_ELEVATION = Math.PI * 0.43;
const MAX_FOCUS_OFFSET = 4;
// Blockers are a 1-unit box plus a thin cap (see MissionObjectLayer).
const BLOCKER_TOP = 1.15;

/** Returns the distance to the first blocker intersecting the camera sight-line. */
export const occludedCameraDistance = (
  target: Readonly<Vector3>,
  cameraPosition: Readonly<Vector3>,
  blockers: readonly { readonly cellX: number; readonly cellZ: number }[],
  cellSize = defaultWorldConfig.cellSize,
): number | undefined => {
  const directionX = cameraPosition.x - target.x;
  const directionZ = cameraPosition.z - target.z;
  const length = Math.hypot(directionX, directionZ);
  if (length === 0) return undefined;
  let nearest: number | undefined;
  for (const cell of blockers) {
    const half = cellSize * 0.46;
    const centerX = cell.cellX * cellSize;
    const centerZ = cell.cellZ * cellSize;
    const minX = centerX - half;
    const maxX = centerX + half;
    const minZ = centerZ - half;
    const maxZ = centerZ + half;
    const tx1 = (minX - target.x) / directionX;
    const tx2 = (maxX - target.x) / directionX;
    const tz1 = (minZ - target.z) / directionZ;
    const tz2 = (maxZ - target.z) / directionZ;
    const xNear = directionX === 0 ? (target.x >= minX && target.x <= maxX ? -Infinity : Infinity) : Math.min(tx1, tx2);
    const xFar = directionX === 0 ? (target.x >= minX && target.x <= maxX ? Infinity : -Infinity) : Math.max(tx1, tx2);
    const zNear = directionZ === 0 ? (target.z >= minZ && target.z <= maxZ ? -Infinity : Infinity) : Math.min(tz1, tz2);
    const zFar = directionZ === 0 ? (target.z >= minZ && target.z <= maxZ ? Infinity : -Infinity) : Math.max(tz1, tz2);
    const enter = Math.max(xNear, zNear);
    const exit = Math.min(xFar, zFar);
    if (enter <= exit && exit >= 0 && enter <= 1) {
      // The slab test is in the ground plane; an elevated camera looking over a
      // low wall is not occluded by it, so also require the sight line to be
      // below the blocker's top where it crosses the cell.
      const heightAtEntry =
        target.y + (cameraPosition.y - target.y) * Math.max(0, Math.min(1, enter));
      if (heightAtEntry > BLOCKER_TOP) continue;
      const distance = Math.max(0, enter) * length;
      if (nearest === undefined || distance < nearest) nearest = distance;
    }
  }
  return nearest;
};

export function FollowCameraRig({ state, mission, reducedEffects, resetToken }: FollowCameraRigProps) {
  const { camera, gl } = useThree();
  const azimuthRef = useRef<number>(HOME_AZIMUTH);
  const distanceRef = useRef<number>(HOME_DISTANCE);
  const elevationRef = useRef<number>(HOME_ELEVATION);
  // Input writes targets; the frame loop eases the live values toward them, so
  // mouse, trackpad and touch all feel the same and nothing snaps.
  const azimuthTargetRef = useRef<number>(HOME_AZIMUTH);
  const distanceTargetRef = useRef<number>(HOME_DISTANCE);
  const elevationTargetRef = useRef<number>(HOME_ELEVATION);
  const focusOffsetRef = useRef(new Vector3(0, 0, -HOME_LOOK_AHEAD));
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
    azimuthRef.current = HOME_AZIMUTH;
    distanceRef.current = HOME_DISTANCE;
    elevationRef.current = HOME_ELEVATION;
    azimuthTargetRef.current = HOME_AZIMUTH;
    distanceTargetRef.current = HOME_DISTANCE;
    elevationTargetRef.current = HOME_ELEVATION;
    focusOffsetRef.current.set(0, 0, -HOME_LOOK_AHEAD);
    desiredPosition.current.set(0, Math.sin(HOME_ELEVATION) * HOME_DISTANCE, Math.cos(HOME_ELEVATION) * HOME_DISTANCE);
    desiredTarget.current.set(0, 0.9, 0);
    currentTarget.current.copy(desiredTarget.current);
    hasAvatarAnchor.current = false;
    camera.position.copy(desiredPosition.current);
    camera.lookAt(desiredTarget.current);
  }, [resetToken, camera]);

  useEffect(() => {
    const canvas = gl.domElement;
    // Without this, a touch drag scrolls the page instead of orbiting.
    canvas.style.touchAction = 'none';
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDistance: number | null = null;

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

    // Zooming leans the view toward the cursor a little, like a map app.
    const nudgeFocusToward = (event: WheelEvent, strength: number) => {
      const hit = worldAtCursor(event);
      if (!hit) return;
      const offset = hit.sub(avatarPosition());
      offset.y = 0;
      offset.clampLength(0, MAX_FOCUS_OFFSET);
      focusOffsetRef.current.lerp(offset, strength);
    };

    const clampElevation = (value: number) =>
      Math.max(MIN_ELEVATION, Math.min(MAX_ELEVATION, value));
    const clampDistance = (value: number) =>
      Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, value));

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      canvas.setPointerCapture(event.pointerId);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
      }
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (event: PointerEvent) => {
      const last = pointers.get(event.pointerId);
      if (!last) return;
      const current = { x: event.clientX, y: event.clientY };
      pointers.set(event.pointerId, current);

      if (pointers.size === 2 && pinchDistance !== null) {
        const [a, b] = [...pointers.values()];
        const spread = Math.hypot(a.x - b.x, a.y - b.y);
        if (spread > 0) {
          distanceTargetRef.current = clampDistance(
            distanceTargetRef.current * (pinchDistance / spread),
          );
          pinchDistance = spread;
        }
        return;
      }
      if (pointers.size !== 1) return;

      // Scaled by the canvas size so a full drag is the same turn on a phone,
      // a trackpad and a large monitor.
      const rect = canvas.getBoundingClientRect();
      const dx = (current.x - last.x) / Math.max(1, rect.width);
      const dy = (current.y - last.y) / Math.max(1, rect.height);
      azimuthTargetRef.current -= dx * Math.PI * 1.6;
      elevationTargetRef.current = clampElevation(elevationTargetRef.current + dy * Math.PI * 0.9);
    };

    const onPointerUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinchDistance = null;
      if (pointers.size === 0) canvas.style.cursor = 'grab';
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // pointer was already released
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      // Normalise line/page deltas to pixels; a trackpad pinch arrives as a
      // wheel event with ctrlKey and wants a stronger response.
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1;
      const delta = Math.max(-120, Math.min(120, event.deltaY * unit));
      const factor = Math.exp(delta * (event.ctrlKey ? 0.01 : 0.0035));
      const previous = distanceTargetRef.current;
      const next = clampDistance(previous * factor);
      distanceTargetRef.current = next;
      const zoomProgress = 1 - next / previous;
      if (zoomProgress > 0) nudgeFocusToward(event, zoomProgress * 0.6);
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
      canvas.style.touchAction = '';
    };
  }, [camera, gl, state.avatar.cellX, state.avatar.cellZ]);

  useFrame((_, delta) => {
    // Ease the live camera values toward their input targets.
    const ease = reducedEffects ? 1 : 1 - Math.exp(-10 * delta);
    azimuthRef.current += (azimuthTargetRef.current - azimuthRef.current) * ease;
    elevationRef.current += (elevationTargetRef.current - elevationRef.current) * ease;
    distanceRef.current += (distanceTargetRef.current - distanceRef.current) * ease;

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

    const blockerCells: Array<{ readonly cellX: number; readonly cellZ: number }> = [];
    for (const obj of mission.objects) {
      if (obj.kind !== 'blocker') continue;
      blockerCells.push(...obj.occupiedCells);
    }
    const blockedAt = occludedCameraDistance(desiredTarget.current, desiredPosition.current, blockerCells);
    const clampedDistance = blockedAt === undefined ? distance : Math.max(0.4, blockedAt - 0.4);
    if (blockedAt !== undefined && clampedDistance < distance) {
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
