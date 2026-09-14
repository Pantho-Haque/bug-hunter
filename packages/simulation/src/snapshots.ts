import type {
  MissionPackageSchema,
  RunEventSchema,
} from '@codequest/domain';

import type { CommandInput } from './createSimulation';
import { reduceCommand } from './reduceCommand';
import { cloneState, type SimulationState } from './state';

export interface RunTrace {
  readonly command: CommandInput;
  readonly stateBefore: SimulationState;
  readonly stateAfter: SimulationState;
  readonly event: RunEventSchema;
  readonly applied: boolean;
}

export interface SimulationSnapshotStore {
  push(command: CommandInput): RunTrace;
  reset(initial?: SimulationState): void;
  current(): SimulationState;
  depth(): number;
  traces(): readonly RunTrace[];
  stepBack(): SimulationState | undefined;
}

export interface CreateSnapshotStoreOptions {
  readonly mission: MissionPackageSchema;
  readonly initialState?: SimulationState;
}

export const createSnapshotStore = (
  options: CreateSnapshotStoreOptions,
): SimulationSnapshotStore => {
  const initial = cloneState(options.initialState ?? options.mission.startState);
  let state = cloneState(initial);
  const traces: RunTrace[] = [];

  const store: SimulationSnapshotStore = {
    push(command) {
      const stateBefore = cloneState(state);
      const result = reduceCommand(stateBefore, options.mission, command);
      state = result.nextState;
      const trace: RunTrace = {
        command,
        stateBefore,
        stateAfter: result.nextState,
        event: result.event,
        applied: result.applied,
      };
      traces.push(trace);
      return trace;
    },
    reset(next) {
      state = cloneState(next ?? initial);
      traces.length = 0;
    },
    current() {
      return cloneState(state);
    },
    depth() {
      return traces.length;
    },
    traces() {
      return [...traces];
    },
    stepBack() {
      const trace = traces.pop();
      if (!trace) return undefined;
      state = cloneState(trace.stateBefore);
      return cloneState(state);
    },
  };

  return store;
};