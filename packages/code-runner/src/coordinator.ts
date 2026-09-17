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
  /** Releases one immutable command at a host-controlled animation boundary. */
  advance(): RunEventSchema[];
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
  readonly queued: number;
  readonly workerFinished: boolean;
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
  let workerFinished = false;
  const pendingCommands: Array<WorkerToHostSchema & { readonly type: 'commandRequested' }> = [];

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

  const belongsToActiveRun = (messageRunId: string): boolean =>
    runId !== undefined && runId === messageRunId;

  const completeIfDrained = () => {
    if (workerFinished && pendingCommands.length === 0 && lifecycle !== 'fault' && lifecycle !== 'cancelled') {
      lifecycle = 'complete';
    }
  };

  const releaseNext = (): RunEventSchema[] => {
    if (paused || lifecycle === 'fault' || lifecycle === 'cancelled') return [];
    const requested = pendingCommands[0];
    if (!requested) {
      completeIfDrained();
      return [];
    }
    if (applied + rejected >= options.budgets.maxCommands) {
      pendingCommands.splice(0, pendingCommands.length);
      const { fault } = mapRunnerFault('commandLimit', { reasonKey: 'run.command-limit.exceeded' });
      return handle('fault', fault);
    }
    pendingCommands.splice(0, 1);
    const event = acceptCommand(
      { commandId: requested.command.commandId, kind: requested.command.kind, sourceLine: requested.command.sourceLine },
      requested.command.sourceLine,
    );
    // The worker mirrors the simulation so predicates can answer mid-run. Host
    // and mirror reduce the same commands from the same start, so they must
    // agree; if they ever do not, the run is not trustworthy and stops.
    if (
      requested.mirrorStepCount !== undefined &&
      requested.mirrorStepCount !== state.stepCount
    ) {
      events.push(event);
      const { fault } = mapRunnerFault('blockedApi', {
        sourceLine: requested.command.sourceLine,
        reasonKey: 'run.mirror-divergence',
      });
      return [event, ...handle('fault', fault)];
    }
    events.push(event);
    completeIfDrained();
    return [event];
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
          workerFinished = false;
          pendingCommands.splice(0, pendingCommands.length);
          return handle('running');
        case 'commandRequested': {
          if (!belongsToActiveRun(message.runId)) return [];
          // Copy the untrusted worker payload into an append-only host queue.
          // Simulation reduction happens only through advance()/step().
          pendingCommands.push(Object.freeze({
            type: 'commandRequested',
            runId: message.runId,
            command: Object.freeze({ ...message.command }),
          }));
          return [];
        }
        case 'log':
          if (!belongsToActiveRun(message.runId)) return [];
          return [];
        case 'runFinished': {
          if (!belongsToActiveRun(message.runId)) return [];
          workerFinished = true;
          completeIfDrained();
          return [];
        }
        case 'runFault': {
          if (!belongsToActiveRun(message.runId)) return [];
          const { fault } = mapRunnerFault(message.code, {
            sourceLine: message.sourceLine,
            reasonKey: message.reason ?? `run.${message.code}`,
          });
          return handle('fault', fault);
        }
      }
    },
    advance() {
      return releaseNext();
    },
    pause() {
      paused = true;
      return handle('paused');
    },
    resume() {
      paused = false;
      return handle('running');
    },
    cancel(reason) {
      const { fault } = mapRunnerFault('cancelled', { reasonKey: `run.cancelled.${reason}` });
      return handle('cancelled', fault);
    },
    step() {
      if (!paused) return [];
      lifecycle = 'stepping';
      paused = false;
      const event = releaseNext();
      paused = true;
      const afterStep = lifecycle as RunLifecycleStateSchema;
      if (afterStep !== 'complete' && afterStep !== 'fault') lifecycle = 'paused';
      return event;
    },
    state() {
      return {
        lifecycle,
        runId,
        applied,
        rejected,
        queued: pendingCommands.length,
        workerFinished,
        events: [...events],
      };
    },
  };
};
