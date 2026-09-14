import { useEffect, useRef } from 'react';

import type {
  MissionObjectSchema,
  MissionPackageSchema,
  SimulationStateSchema,
} from '@codequest/domain';

import { cellBounds, defaultWorldConfig } from '../world/worldTransform';

export interface MinimapProps {
  readonly mission: MissionPackageSchema;
  readonly state: SimulationStateSchema;
  readonly reducedEffects: boolean;
}

const VIEWPORT_PADDING_CELLS = 2;
const STEP_DURATION_MS = 360;

const cellToPixel = (
  cellX: number,
  cellZ: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  pixelScale: number,
  originX: number,
  originY: number,
): readonly [number, number] => [
  originX + (cellX - bounds.minX) * pixelScale,
  originY + (cellZ - bounds.minZ) * pixelScale,
];

const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function Minimap({ mission, state, reducedEffects }: MinimapProps) {
  const bounds = cellBounds(mission);
  const cellSize = defaultWorldConfig.cellSize;
  const widthCells = (bounds.maxX - bounds.minX) / cellSize + VIEWPORT_PADDING_CELLS * 2;
  const heightCells = (bounds.maxZ - bounds.minZ) / cellSize + VIEWPORT_PADDING_CELLS * 2;
  const adjustedBounds = {
    minX: bounds.minX - VIEWPORT_PADDING_CELLS * cellSize,
    maxX: bounds.maxX + VIEWPORT_PADDING_CELLS * cellSize,
    minZ: bounds.minZ - VIEWPORT_PADDING_CELLS * cellSize,
    maxZ: bounds.maxZ + VIEWPORT_PADDING_CELLS * cellSize,
  };
  const pixelWidth = 200;
  const pixelHeight = Math.round((heightCells / widthCells) * pixelWidth);
  const pixelScale = pixelWidth / widthCells;

  const tilePixel = (cellX: number, cellZ: number): readonly [number, number] =>
    cellToPixel(cellX * cellSize, cellZ * cellSize, adjustedBounds, pixelScale, 0, 0);

  const renderCell = (object: MissionObjectSchema) => {
    if (object.kind === 'spawn') {
      const [x, y] = tilePixel(object.cell.cellX, object.cell.cellZ);
      return <rect key={object.id} x={x - 6} y={y - 6} width={12} height={12} fill="#caa15a" />;
    }
    if (object.kind === 'goal') {
      const [x, y] = tilePixel(object.cell.cellX, object.cell.cellZ);
      return (
        <g key={object.id}>
          <rect x={x - 7} y={y - 7} width={14} height={14} fill="#ffe166" />
          <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fontWeight="700" fill="#3a2a0a">
            G
          </text>
        </g>
      );
    }
    if (object.kind === 'collectible') {
      if (state.collected.includes(object.id)) return null;
      const [x, y] = tilePixel(object.cell.cellX, object.cell.cellZ);
      return <circle key={object.id} cx={x} cy={y} r={5} fill="#8be9fd" />;
    }
    if (object.kind === 'blocker') {
      return object.occupiedCells.map((cell, index) => {
        const [x, y] = tilePixel(cell.cellX, cell.cellZ);
        return <rect key={`${object.id}-${index}`} x={x - 6} y={y - 6} width={12} height={12} fill="#7a4a30" />;
      });
    }
    if (object.kind === 'interactable') {
      const [x, y] = tilePixel(object.cell.cellX, object.cell.cellZ);
      return <polygon key={object.id} points={`${x},${y - 6} ${x + 6},${y + 4} ${x - 6},${y + 4}`} fill="#bd93f9" />;
    }
    if (object.kind === 'trigger') {
      return object.cells.map((cell, index) => {
        const [x, y] = tilePixel(cell.cellX, cell.cellZ);
        return <rect key={`${object.id}-${index}`} x={x - 5} y={y - 5} width={10} height={10} fill="none" stroke="#ff7a45" strokeWidth={1.5} />;
      });
    }
    return null;
  };

  const avatarCellX = state.avatar.cellX * cellSize;
  const avatarCellZ = state.avatar.cellZ * cellSize;
  const [targetX, targetY] = cellToPixel(avatarCellX, avatarCellZ, adjustedBounds, pixelScale, 0, 0);
  const facing = state.avatar.facing;

  const avatarGroupRef = useRef<SVGGElement | null>(null);
  const tweenRef = useRef<{
    fromX: number;
    fromY: number;
    fromYaw: number;
    toX: number;
    toY: number;
    toYaw: number;
    startedAt: number;
    duration: number;
  } | null>(null);
  const visualRef = useRef<{ x: number; y: number; yaw: number }>({ x: targetX, y: targetY, yaw: facingToYaw(facing) });
  const lastKeyRef = useRef<string>(`${state.avatar.cellX}:${state.avatar.cellZ}:${facing}`);

  useEffect(() => {
    const key = `${state.avatar.cellX}:${state.avatar.cellZ}:${facing}`;
    if (key === lastKeyRef.current) return;
    tweenRef.current = {
      fromX: visualRef.current.x,
      fromY: visualRef.current.y,
      fromYaw: visualRef.current.yaw,
      toX: targetX,
      toY: targetY,
      toYaw: facingToYaw(facing),
      startedAt: performance.now(),
      duration: reducedEffects ? 0 : STEP_DURATION_MS,
    };
    lastKeyRef.current = key;
  }, [targetX, targetY, facing, state.avatar.cellX, state.avatar.cellZ, reducedEffects]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const tween = tweenRef.current;
      if (tween) {
        const elapsed = performance.now() - tween.startedAt;
        const t = tween.duration === 0 ? 1 : Math.min(1, elapsed / tween.duration);
        const eased = easeInOut(t);
        visualRef.current = {
          x: tween.fromX + (tween.toX - tween.fromX) * eased,
          y: tween.fromY + (tween.toY - tween.fromY) * eased,
          yaw: tween.fromYaw + shortestYaw(tween.fromYaw, tween.toYaw) * eased,
        };
        if (t >= 1) tweenRef.current = null;
      } else {
        visualRef.current = { x: targetX, y: targetY, yaw: facingToYaw(facing) };
      }
      const group = avatarGroupRef.current;
      if (group) {
        group.setAttribute('transform', `translate(${visualRef.current.x} ${visualRef.current.y}) rotate(${yawToDegrees(visualRef.current.yaw)})`);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [targetX, targetY, facing]);

  return (
    <svg
      role="img"
      aria-label={`Minimap for ${mission.identity.title}`}
      width="100%"
      viewBox={`0 0 ${pixelWidth} ${pixelHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className={`minimap${reducedEffects ? ' minimap-reduced' : ''}`}
    >
      <rect x={0} y={0} width={pixelWidth} height={pixelHeight} fill="#0d1b2a" rx={6} />
      <g aria-hidden="true" className="minimap-grid">
        {Array.from({ length: Math.ceil(widthCells) + 1 }, (_, index) => {
          const x = index * pixelScale;
          return (
            <line
              key={`grid-x-${index}`}
              x1={x}
              y1={0}
              x2={x}
              y2={pixelHeight}
              stroke="#1a2c40"
              strokeWidth={1}
            />
          );
        })}
        {Array.from({ length: Math.ceil(heightCells) + 1 }, (_, index) => {
          const y = index * pixelScale;
          return (
            <line
              key={`grid-z-${index}`}
              x1={0}
              y1={y}
              x2={pixelWidth}
              y2={y}
              stroke="#1a2c40"
              strokeWidth={1}
            />
          );
        })}
      </g>
      <text x={pixelWidth / 2} y={12} textAnchor="middle" fontSize={9} fill="#a4c8e1">
        {mission.identity.title}
      </text>
      {mission.objects.map(renderCell)}
      <g ref={avatarGroupRef} className="minimap-avatar">
        <line x1={0} y1={0} x2={4} y2={0} stroke="#ffd65c" strokeWidth={2} />
        <circle cx={0} cy={0} r={5} fill="#ffd65c" stroke="#1a1a1a" strokeWidth={1.5} />
      </g>
      <text x={pixelWidth - 6} y={pixelHeight - 6} textAnchor="end" fontSize={8} fill="#7d97ad">
        step {state.stepCount}
      </text>
    </svg>
  );
}

const facingToYaw = (facing: SimulationStateSchema['avatar']['facing']): number => {
  switch (facing) {
    case 'north':
      return -Math.PI / 2;
    case 'east':
      return 0;
    case 'south':
      return Math.PI / 2;
    case 'west':
      return Math.PI;
  }
};

const yawToDegrees = (yaw: number): number => (yaw * 180) / Math.PI;

const shortestYaw = (from: number, to: number): number => {
  let diff = (to - from) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
};