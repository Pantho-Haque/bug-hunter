import type {
  CommandAppliedEventSchema,
  CommandRejectedEventSchema,
  MissionPackageSchema,
  RunEventSchema,
} from '@codequest/domain';

import { attemptMove, turnAvatar } from './collisions';
import { attemptCollect, attemptInteract } from './interactions';

import type { CommandInput } from './createSimulation';
import { cloneState, type SimulationState } from './state';

export interface ReduceResult {
  readonly event: RunEventSchema;
  readonly nextState: SimulationState;
  readonly applied: boolean;
}

const appliedEvent = (
  state: SimulationState,
  command: CommandInput,
  before: SimulationState,
  after: SimulationState,
  reasonKey: string,
): CommandAppliedEventSchema => ({
  type: 'commandApplied',
  commandId: command.commandId,
  sourceLine: command.sourceLine,
  command: {
    commandId: command.commandId,
    kind: command.kind,
    sourceLine: command.sourceLine,
  },
  before,
  after,
  reasonKey,
});

const rejectedEvent = (
  command: CommandInput,
  reasonKey: string,
): CommandRejectedEventSchema => ({
  type: 'commandRejected',
  commandId: command.commandId,
  sourceLine: command.sourceLine,
  kind: command.kind,
  reasonKey,
});

export const reduceCommand = (
  state: SimulationState,
  mission: MissionPackageSchema,
  command: CommandInput,
): ReduceResult => {
  const before = cloneState(state);

  switch (command.kind) {
    case 'moveForward': {
      const outcome = attemptMove(state, mission);
      if (outcome.blocked) {
        const event = rejectedEvent(command, outcome.reasonKey);
        return { event, nextState: before, applied: false };
      }
      const nextState: SimulationState = {
        ...state,
        avatar: outcome.nextAvatar,
        stepCount: state.stepCount + 1,
      };
      return {
        event: appliedEvent(state, command, before, nextState, outcome.reasonKey),
        nextState,
        applied: true,
      };
    }
    case 'turnLeft': {
      const nextState: SimulationState = {
        ...state,
        avatar: turnAvatar(state, 'left'),
        stepCount: state.stepCount + 1,
      };
      return {
        event: appliedEvent(state, command, before, nextState, 'turned.left'),
        nextState,
        applied: true,
      };
    }
    case 'turnRight': {
      const nextState: SimulationState = {
        ...state,
        avatar: turnAvatar(state, 'right'),
        stepCount: state.stepCount + 1,
      };
      return {
        event: appliedEvent(state, command, before, nextState, 'turned.right'),
        nextState,
        applied: true,
      };
    }
    case 'collect': {
      const outcome = attemptCollect(state, mission);
      if (!outcome.collected) {
        return {
          event: rejectedEvent(command, outcome.reasonKey),
          nextState: before,
          applied: false,
        };
      }
      const nextState: SimulationState = {
        ...outcome.nextState,
        stepCount: state.stepCount + 1,
      };
      return {
        event: appliedEvent(state, command, before, nextState, outcome.reasonKey),
        nextState,
        applied: true,
      };
    }
    case 'interact': {
      const outcome = attemptInteract(state, mission);
      if (!outcome.applied) {
        return {
          event: rejectedEvent(command, outcome.reasonKey),
          nextState: before,
          applied: false,
        };
      }
      const nextState: SimulationState = {
        ...outcome.nextState,
        stepCount: state.stepCount + 1,
      };
      return {
        event: appliedEvent(state, command, before, nextState, outcome.reasonKey),
        nextState,
        applied: true,
      };
    }
  }
};
