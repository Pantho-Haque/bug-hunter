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
  const [avatarX, avatarY] = cellToPixel(avatarCellX, avatarCellZ, adjustedBounds, pixelScale, 0, 0);
  const facing = state.avatar.facing;
  const facingOffset: readonly [number, number] = facing === 'north' ? [0, -4] : facing === 'east' ? [4, 0] : facing === 'south' ? [0, 4] : [-4, 0];

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
      <text x={pixelWidth / 2} y={12} textAnchor="middle" fontSize={9} fill="#a4c8e1">
        {mission.identity.title}
      </text>
      {mission.objects.map(renderCell)}
      <g>
        <line x1={avatarX} y1={avatarY} x2={avatarX + facingOffset[0]} y2={avatarY + facingOffset[1]} stroke="#ffd65c" strokeWidth={2} />
        <circle cx={avatarX} cy={avatarY} r={5} fill="#ffd65c" stroke="#1a1a1a" strokeWidth={1.5} />
      </g>
      <text x={pixelWidth - 6} y={pixelHeight - 6} textAnchor="end" fontSize={8} fill="#7d97ad">
        step {state.stepCount}
      </text>
    </svg>
  );
}