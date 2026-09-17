import type {
  MissionObjectSchema,
  MissionPackageSchema,
} from '@codequest/domain';

import type { AvatarState, SimulationState } from './state';

export const cellKey = (cell: { readonly cellX: number; readonly cellZ: number }) =>
  `${cell.cellX},${cell.cellZ}`;

export interface MoveOutcome {
  readonly nextAvatar: AvatarState;
  readonly blocked: boolean;
  readonly reasonKey: string;
}

export const deltaForFacing = (facing: AvatarState['facing']): { readonly dX: number; readonly dZ: number } => {
  switch (facing) {
    case 'north':
      return { dX: 0, dZ: -1 };
    case 'south':
      return { dX: 0, dZ: 1 };
    case 'east':
      return { dX: 1, dZ: 0 };
    case 'west':
      return { dX: -1, dZ: 0 };
    default:
      return { dX: 0, dZ: 0 };
  }
};

export const occupiedCellsByKind = (
  mission: MissionPackageSchema,
): Map<string, MissionObjectSchema> => {
  const map = new Map<string, MissionObjectSchema>();
  for (const obj of mission.objects) {
    if (obj.kind === 'spawn' || obj.kind === 'goal' || obj.kind === 'collectible' || obj.kind === 'interactable') {
      map.set(cellKey(obj.cell), obj);
    }
    if (obj.kind === 'blocker') {
      for (const cell of obj.occupiedCells) {
        map.set(cellKey(cell), obj);
      }
    }
    if (obj.kind === 'decor' || obj.kind === 'trigger') {
      for (const cell of obj.cells) {
        const key = cellKey(cell);
        if (!map.has(key)) {
          map.set(key, obj);
        }
      }
    }
  }
  return map;
};

/** A gate blocker stops counting as solid once its unlock flag is set. */
export const isBlockerOpen = (
  blocker: Extract<MissionObjectSchema, { kind: 'blocker' }>,
  state: SimulationState,
): boolean =>
  blocker.unlockedByFlag !== undefined && state.flags[blocker.unlockedByFlag] === true;

export const attemptMove = (
  state: SimulationState,
  mission: MissionPackageSchema,
): MoveOutcome => {
  const { dX, dZ } = deltaForFacing(state.avatar.facing);
  const target = {
    cellX: state.avatar.cellX + dX,
    cellZ: state.avatar.cellZ + dZ,
  };
  const occupied = occupiedCellsByKind(mission);
  const obstacle = occupied.get(cellKey(target));
  if (obstacle && obstacle.kind === 'blocker' && !isBlockerOpen(obstacle, state)) {
    return {
      nextAvatar: state.avatar,
      blocked: true,
      reasonKey: obstacle.reasonKey,
    };
  }
  return {
    nextAvatar: { ...state.avatar, cellX: target.cellX, cellZ: target.cellZ },
    blocked: false,
    reasonKey: 'moved.forward',
  };
};

export const turnAvatar = (
  state: SimulationState,
  direction: 'left' | 'right',
): AvatarState => {
  const order: readonly AvatarState['facing'][] = ['north', 'east', 'south', 'west'];
  const index = order.indexOf(state.avatar.facing);
  const next = (index + (direction === 'left' ? 3 : 1)) % order.length;
  return { ...state.avatar, facing: order[next] };
};

export const distance = (
  a: { readonly cellX: number; readonly cellZ: number },
  b: { readonly cellX: number; readonly cellZ: number },
): number => Math.abs(a.cellX - b.cellX) + Math.abs(a.cellZ - b.cellZ);

export const directionToward = (
  from: { readonly cellX: number; readonly cellZ: number },
  to: { readonly cellX: number; readonly cellZ: number },
): AvatarState['facing'] => {
  if (to.cellX > from.cellX) return 'east';
  if (to.cellX < from.cellX) return 'west';
  if (to.cellZ > from.cellZ) return 'south';
  return 'north';
};
