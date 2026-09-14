import type {
  AvatarStateSchema,
  Direction,
  SimulationStateSchema,
} from '@codequest/domain';
import {
  avatarStateSchema,
  directionSchema,
  simulationStateSchema,
} from '@codequest/domain';

export type AvatarState = AvatarStateSchema;
export type SimulationState = SimulationStateSchema;
export type Facing = Direction;

export const createInitialState = (avatar: AvatarState): SimulationState =>
  simulationStateSchema.parse({
    avatar,
    collected: [],
    inventory: {},
    flags: {},
    stepCount: 0,
  });

export const parseAvatar = (value: unknown): AvatarState =>
  avatarStateSchema.parse(value);

export const parseFacing = (value: unknown): Facing =>
  directionSchema.parse(value);

export const cloneState = (state: SimulationState): SimulationState => ({
  avatar: { ...state.avatar },
  collected: [...state.collected],
  inventory: { ...state.inventory },
  flags: { ...state.flags },
  stepCount: state.stepCount,
});

export const statesEqual = (
  a: SimulationState,
  b: SimulationState,
): boolean => {
  if (a.avatar.cellX !== b.avatar.cellX || a.avatar.cellZ !== b.avatar.cellZ) return false;
  if (a.avatar.facing !== b.avatar.facing) return false;
  if (a.stepCount !== b.stepCount) return false;
  if (a.collected.length !== b.collected.length) return false;
  for (let i = 0; i < a.collected.length; i++) {
    if (a.collected[i] !== b.collected[i]) return false;
  }
  const invKeys = Object.keys(a.inventory);
  if (invKeys.length !== Object.keys(b.inventory).length) return false;
  for (const key of invKeys) {
    if (a.inventory[key] !== b.inventory[key]) return false;
  }
  const flagKeys = Object.keys(a.flags);
  if (flagKeys.length !== Object.keys(b.flags).length) return false;
  for (const key of flagKeys) {
    if (a.flags[key] !== b.flags[key]) return false;
  }
  return true;
};

export const simulationPackageMarker = '@codequest/simulation';
