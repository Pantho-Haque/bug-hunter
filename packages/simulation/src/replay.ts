import type {
  MissionPackageSchema,
  RunEventSchema,
} from '@codequest/domain';

import type { CommandInput } from './createSimulation';
import { reduceCommand } from './reduceCommand';
import { cloneState, type SimulationState } from './state';

export interface ReplayResult {
  readonly finalState: SimulationState;
  readonly events: readonly RunEventSchema[];
  readonly appliedCount: number;
  readonly rejectedCount: number;
  readonly truncated: boolean;
}

export interface ReplayOptions {
  readonly maxSteps?: number;
}

const DEFAULT_MAX_STEPS = 1024;

export const replayCommands = (
  mission: MissionPackageSchema,
  commands: readonly CommandInput[],
  options: ReplayOptions = {},
): ReplayResult => {
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  let state = cloneState(mission.startState);
  const events: RunEventSchema[] = [];
  let applied = 0;
  let rejected = 0;
  let truncated = false;

  for (const command of commands) {
    if (events.length >= maxSteps) {
      truncated = true;
      break;
    }
    const result = reduceCommand(state, mission, command);
    events.push(result.event);
    state = result.nextState;
    if (result.applied) {
      applied += 1;
    } else {
      rejected += 1;
    }
  }

  return {
    finalState: state,
    events,
    appliedCount: applied,
    rejectedCount: rejected,
    truncated,
  };
};

export const replayFromInitial = (
  mission: MissionPackageSchema,
  initial: SimulationState,
  commands: readonly CommandInput[],
  options?: ReplayOptions,
): ReplayResult => {
  const wrapped: MissionPackageSchema = {
    ...mission,
    startState: cloneState(initial),
  };
  return replayCommands(wrapped, commands, options);
};