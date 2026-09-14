import type {
  MissionObjectSchema,
  MissionPackageSchema,
  RunEventSchema,
} from '@codequest/domain';

import { reduceCommand } from './reduceCommand';
import { validateMissionObjectives } from './objectives';
import { cloneState, createInitialState, type AvatarState, type SimulationState } from './state';

export interface Simulation {
  readonly mission: MissionPackageSchema;
  readonly state: SimulationState;
  readonly events: readonly RunEventSchema[];
  step(command: CommandInput): SimulationStepResult;
  reset(): Simulation;
  isComplete(): boolean;
}

export interface CommandInput {
  readonly commandId: string;
  readonly sourceLine: number;
  readonly kind: 'moveForward' | 'turnLeft' | 'turnRight' | 'collect' | 'interact';
}

export interface SimulationStepResult {
  readonly simulation: Simulation;
  readonly event: RunEventSchema;
  readonly applied: boolean;
}

const resolveStartAvatar = (mission: MissionPackageSchema): AvatarState => {
  const spawn = mission.objects.find(
    (o): o is Extract<MissionObjectSchema, { kind: 'spawn' }> => o.kind === 'spawn',
  );
  if (spawn) {
    return { cellX: spawn.cell.cellX, cellZ: spawn.cell.cellZ, facing: spawn.facing };
  }
  return mission.startState.avatar;
};

interface MutableSnapshot {
  readonly mission: MissionPackageSchema;
  readonly state: SimulationState;
  readonly events: readonly RunEventSchema[];
}

const buildLiveSimulation = (
  mission: MissionPackageSchema,
  snapshot: MutableSnapshot,
): Simulation => {
  const handle: Simulation = {
    mission: snapshot.mission,
    state: snapshot.state,
    events: snapshot.events,
    step(command) {
      const next = reduceCommand(snapshot.state, snapshot.mission, command);
      const nextSnapshot: MutableSnapshot = {
        mission: snapshot.mission,
        state: next.nextState,
        events: [...snapshot.events, next.event],
      };
      return {
        simulation: buildLiveSimulation(snapshot.mission, nextSnapshot),
        event: next.event,
        applied: next.applied,
      };
    },
    reset() {
      return createSimulation(mission);
    },
    isComplete() {
      return validateMissionObjectives(mission, snapshot.state).ok;
    },
  };
  return handle;
};

export const createSimulation = (mission: MissionPackageSchema): Simulation => {
  const startAvatar = resolveStartAvatar(mission);
  const initial = createInitialState(startAvatar);
  return buildLiveSimulation(mission, {
    mission,
    state: initial,
    events: [],
  });
};

export const simulationFromState = (
  mission: MissionPackageSchema,
  state: SimulationState,
): Simulation => {
  const seed: SimulationState = cloneState(state);
  return {
    mission,
    state: seed,
    events: [],
    step(command) {
      const next = reduceCommand(seed, mission, command);
      const newState = next.nextState;
      return {
        simulation: simulationFromState(mission, newState),
        event: next.event,
        applied: next.applied,
      };
    },
    reset() {
      return simulationFromState(mission, state);
    },
    isComplete() {
      return validateMissionObjectives(mission, seed).ok;
    },
  };
};