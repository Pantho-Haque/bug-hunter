import type { Direction } from '@codequest/domain';

export interface AvatarState {
  readonly cellX: number;
  readonly cellZ: number;
  readonly facing: Direction;
}

export interface SimulationState {
  readonly avatar: AvatarState;
  readonly collected: readonly string[];
  readonly stepCount: number;
}

export const createInitialState = (avatar: AvatarState): SimulationState => ({
  avatar,
  collected: [],
  stepCount: 0,
});

export const simulationPackageMarker = '@codequest/simulation';