import type {
  CommandRejectedEventSchema,
  MissionPackageSchema,
  RunEventSchema,
  RunLifecycleStateSchema,
} from '@codequest/domain';
import type { SimulationState } from '@codequest/simulation';
import { reduceCommand, type CommandInput } from '@codequest/simulation';

import { isCommandAllowed } from './capabilities';
import { mapRunnerFault } from './fault-mapping';
import {
  type HostToWorkerSchema,
  type RunnerCapabilitiesSchema,
  type WorkerToHostSchema,
} from './protocol';

export interface CoordinatorOptions {
  readonly mission: MissionPackageSchema;
  readonly capabilities: RunnerCapabilitiesSchema;
  readonly initialState: SimulationState;
  readonly budgets: {
    readonly maxCommands: number;
    readonly maxInstructions: number;
    readonly memoryBytes: number;
    readonly deadlineMs: number;
  };
  readonly send: (message: HostToWorkerSchema) => void;
}

export interface CoordinatorHandle {
  onWorkerMessage(message: WorkerToHostSchema): RunEventSchema[];
  pause(): RunEventSchema[];
  resume(): RunEventSchema[];
  cancel(reason: string): RunEventSchema[];
  step(): RunEventSchema[];
  state(): CoordinatorState;
}

export interface CoordinatorState {
  readonly lifecycle: RunLifecycleStateSchema;
  readonly runId: string | undefined;
  readonly applied: number;
  readonly rejected: number;
  readonly events: readonly RunEventSchema[];
}

export const createCoordinator = (options: CoordinatorOptions): CoordinatorHandle => {
  let lifecycle: RunLifecycleStateSchema = 'idle';
  let runId: string | undefined;
  let state: SimulationState = options.initialState;
  const events: RunEventSchema[] = [];
  let applied = 0;
  let rejected = 0;
  let paused = false;
  let stepping = false;

  const handle = (
    next: RunLifecycleStateSchema,
    event?: RunEventSchema,
  ): RunEventSchema[] => {
    lifecycle = next;
    if (event) events.push(event);
    return event ? [event] : [];
  };

  const acceptCommand = (command: CommandInput, sourceLine: number): RunEventSchema => {
    if (!isCommandAllowed(options.capabilities, command.kind)) {
      const rejection: CommandRejectedEventSchema = {
        type: 'commandRejected',
        commandId: command.commandId,
        sourceLine,
        kind: command.kind,
        reasonKey: 'run.blocked-api',
      };
      rejected += 1;
      return rejection;
    }
    const reduced = reduceCommand(state, options.mission, command);
    state = reduced.nextState;
    if (reduced.applied) {
      applied += 1;
    } else {
      rejected += 1;
    }
    return reduced.event;
  };

  return {
    onWorkerMessage(message) {
      switch (message.type) {
        case 'ready':
          return handle('booting');
        case 'runStarted':
          runId = message.runId;
          applied = 0;
          rejected = 0;
          paused = false;
          stepping = false;
          return handle('running');
        case 'commandRequested': {
          if (paused && !stepping) {
            return [];
          }
          if (applied + rejected >= options.budgets.maxCommands) {
            const { fault } = mapRunnerFault('memory', {
              reasonKey: 'run.memory.budget-exhausted',
            });
            return handle('fault', fault);
          }
          stepping = false;
          const event = acceptCommand(
            {
              commandId: message.command.commandId,
              kind: message.command.kind,
              sourceLine: message.command.sourceLine,
            },
            message.command.sourceLine,
          );
          events.push(event);
          return [event];
        }
        case 'log':
          return [];
        case 'runFinished': {
          const lifecycleFinal: RunLifecycleStateSchema = lifecycle === 'fault' ? 'fault' : 'complete';
          lifecycle = lifecycleFinal;
          return [];
        }
        case 'runFault': {
          const { fault } = mapRunnerFault(message.code, {
            sourceLine: message.sourceLine,
            reasonKey: message.reason ?? `run.${message.code}`,
          });
          return handle('fault', fault);
        }
      }
    },
    pause() {
      paused = true;
      return handle('paused');
    },
    resume() {
      paused = false;
      stepping = false;
      return handle('running');
    },
    cancel(reason) {
      const { fault } = mapRunnerFault('cancelled', { reasonKey: `run.cancelled.${reason}` });
      return handle('cancelled', fault);
    },
    step() {
      if (!paused) return [];
      stepping = true;
      return handle('stepping');
    },
    state() {
      return {
        lifecycle,
        runId,
        applied,
        rejected,
        events: [...events],
      };
    },
  };
};
