import type { CellSchema, DirectionSchema, SimulationStateSchema } from '@codequest/domain';

export interface WorldConfig {
  readonly cellSize: number;
  readonly groundY: number;
  readonly originOffsetX: number;
  readonly originOffsetZ: number;
}

export const defaultWorldConfig: WorldConfig = {
  cellSize: 1,
  groundY: 0,
  originOffsetX: 0,
  originOffsetZ: 0,
};

export const worldFromCell = (
  cell: CellSchema,
  config: WorldConfig = defaultWorldConfig,
): readonly [number, number, number] => [
  cell.cellX * config.cellSize + config.originOffsetX,
  config.groundY,
  cell.cellZ * config.cellSize + config.originOffsetZ,
];

export const facingToRadians = (facing: DirectionSchema): number => {
  switch (facing) {
    case 'north':
      return 0;
    case 'east':
      return Math.PI / 2;
    case 'south':
      return Math.PI;
    case 'west':
      return -Math.PI / 2;
  }
};

export interface AvatarWorldTransform {
  readonly position: readonly [number, number, number];
  readonly rotationY: number;
}

export const avatarTransform = (
  state: SimulationStateSchema,
  config: WorldConfig = defaultWorldConfig,
): AvatarWorldTransform => ({
  position: worldFromCell(state.avatar, config),
  rotationY: facingToRadians(state.avatar.facing),
});

export const directionVector = (
  facing: DirectionSchema,
): readonly [number, number] => {
  switch (facing) {
    case 'north':
      return [0, -1];
    case 'east':
      return [1, 0];
    case 'south':
      return [0, 1];
    case 'west':
      return [-1, 0];
  }
};

export const cellBounds = (
  mission: { readonly objects: readonly { readonly cells?: readonly CellSchema[]; readonly cell?: CellSchema; readonly occupiedCells?: readonly CellSchema[] }[] },
  config: WorldConfig = defaultWorldConfig,
): { readonly minX: number; readonly maxX: number; readonly minZ: number; readonly maxZ: number } => {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  const consider = (cell: CellSchema) => {
    if (cell.cellX < minX) minX = cell.cellX;
    if (cell.cellX > maxX) maxX = cell.cellX;
    if (cell.cellZ < minZ) minZ = cell.cellZ;
    if (cell.cellZ > maxZ) maxZ = cell.cellZ;
  };
  for (const obj of mission.objects) {
    if (obj.cell) consider(obj.cell);
    if (obj.cells) for (const cell of obj.cells) consider(cell);
    if (obj.occupiedCells) for (const cell of obj.occupiedCells) consider(cell);
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
  }
  return {
    minX: minX * config.cellSize,
    maxX: maxX * config.cellSize,
    minZ: minZ * config.cellSize,
    maxZ: maxZ * config.cellSize,
  };
};