/// <reference lib="webworker" />

import RELEASE_SYNC from '@jitl/quickjs-wasmfile-release-sync';
import {
  type QuickJSContext,
  type QuickJSHandle,
  type QuickJSRuntime,
  newQuickJSWASMModuleFromVariant,
} from 'quickjs-emscripten-core';

import type {
  HostToWorkerSchema,
  RunnerCapabilitiesSchema,
  WorkerToHostSchema,
} from './protocol';
import { parseHostToWorker } from './protocol';
import { evaluatePredicate, reduceCommand, type SimulationState } from '@codequest/simulation';

import { classifyEvaluationFault } from './fault-mapping';
import { instrumentCommandSourceLines } from './source-mapping';

const scope = self as DedicatedWorkerGlobalScope;

const send = (message: WorkerToHostSchema) => {
  scope.postMessage(message);
};

const quickJsModulePromise = newQuickJSWASMModuleFromVariant(RELEASE_SYNC).then(
  (module) => {
    // Booting QuickJS costs seconds on a busy page. The host warms the worker
    // when a mission opens and waits for this before enabling Run.
    send({ type: 'ready' });
    return { module };
  },
  (error: unknown) => ({
    error: {
      code: 'blockedApi' as const,
      message: error instanceof Error ? error.message : 'quickjs failed to load',
    },
  }),
);

interface RunContext {
  readonly runId: string;
  /** Reset to the moment the learner's code starts, not when the run arrived. */
  startedAt: number;
  readonly deadlineMs: number;
  cancelled: boolean;
}

const activeRuns = new Map<string, RunContext>();

const executeRun = async (message: Extract<HostToWorkerSchema, { type: 'run' }>) => {
  const context: RunContext = {
    runId: message.runId,
    startedAt: performance.now(),
    deadlineMs: message.budgets.deadlineMs,
    cancelled: false,
  };
  activeRuns.set(message.runId, context);

  send({ type: 'runStarted', runId: message.runId, apiVersion: message.capabilities.apiVersion });

  const loadResult = await quickJsModulePromise;
  if ('error' in loadResult) {
    send({
      type: 'runFault',
      runId: message.runId,
      code: loadResult.error.code,
      reason: loadResult.error.message,
    });
    activeRuns.delete(message.runId);
    return;
  }

  const runtime: QuickJSRuntime = loadResult.module.newRuntime();
  runtime.setMemoryLimit(message.budgets.memoryBytes);
  runtime.setMaxStackSize(512 * 1024);
  let interruptChecks = 0;
  runtime.setInterruptHandler(() => {
    interruptChecks += 1;
    if (context.cancelled) return true;
    return (
      interruptChecks >= message.budgets.maxInstructions ||
      performance.now() - context.startedAt > context.deadlineMs
    );
  });

  const jsContext: QuickJSContext = runtime.newContext();
  const capabilities: RunnerCapabilitiesSchema = message.capabilities;

  /**
   * A predicate has to answer from the world as it stands at that line, so the
   * worker mirrors the simulation while learner code runs. The host reduces the
   * same commands independently and stays authoritative for the result; the
   * mirror exists only so `while (canMoveForward())` can be asked at all.
   *
   * Learner code cannot reach this: it runs inside QuickJS, which has no access
   * to the worker's own scope.
   */
  let mirror: SimulationState | undefined = message.initialState;
  const missionForMirror = message.mission;


  let appliedCount = 0;
  const rejectedCount = 0;
  let commandCounter = 0;

  try {
    const commandMaker = (kind: RunnerCapabilitiesSchema['allowedCommandKinds'][number]) => {
      const handle = jsContext.newFunction(kind, (...args: QuickJSHandle[]) => {
        if (context.cancelled) {
          throw new Error('cancelled');
        }
        if (commandCounter >= message.budgets.maxCommands) {
          throw new Error('command budget exceeded');
        }
        commandCounter += 1;
        const commandId = `c-${commandCounter}`;
        // A command that somehow arrives without its injected line number must
        // still run: losing the line is a worse trace, not a broken program.
        const requestedLine: unknown = args[0] === undefined ? undefined : jsContext.dump(args[0]);
        const sourceLine = typeof requestedLine === 'number' && Number.isInteger(requestedLine)
          ? requestedLine
          : 0;
        if (mirror !== undefined && missionForMirror !== undefined) {
          mirror = reduceCommand(mirror, missionForMirror, {
            commandId,
            kind,
            sourceLine,
          }).nextState;
        }
        send({
          type: 'commandRequested',
          runId: context.runId,
          command: { commandId, kind, sourceLine },
          mirrorStepCount: mirror?.stepCount,
        });
        return jsContext.undefined;
      });
      return handle;
    };

    for (const kind of capabilities.allowedCommandKinds) {
      const handle = commandMaker(kind);
      jsContext.setProp(jsContext.global, kind, handle);
      handle.dispose();
    }

    // Predicates read the mirror and return a boolean straight into QuickJS.
    // They apply no command and cost no command budget.
    for (const kind of capabilities.allowedPredicateKinds) {
      const handle = jsContext.newFunction(kind, () => {
        if (context.cancelled) throw new Error('cancelled');
        if (mirror === undefined || missionForMirror === undefined) {
          // A mission unlocked a predicate but the host sent no world to read.
          // Failing loudly beats answering a question from nothing.
          throw new Error(`predicate ${kind} has no world state`);
        }
        return evaluatePredicate(kind, mirror, missionForMirror)
          ? jsContext.true
          : jsContext.false;
      });
      jsContext.setProp(jsContext.global, kind, handle);
      handle.dispose();
    }

    if (capabilities.allowLogs) {
      const logHandle: QuickJSHandle = jsContext.newFunction('log', (...args: QuickJSHandle[]) => {
        const log = {
          level: 'log' as const,
          message: args.map((argument) => String(jsContext.dump(argument))).join(' '),
        };
        send({ type: 'log', runId: context.runId, log });
        return jsContext.undefined;
      });
      const consoleHandle = jsContext.newObject();
      jsContext.setProp(consoleHandle, 'log', logHandle);
      jsContext.setProp(jsContext.global, 'console', consoleHandle);
      logHandle.dispose();
      consoleHandle.dispose();
    }

    const instrumentedSource = instrumentCommandSourceLines(
      message.source,
      capabilities.allowedCommandKinds,
    );

    // The deadline bounds the learner's code, not the runner's start-up. Booting
    // QuickJS and building the context can take seconds on a low-end device or a
    // busy page; counting that against the budget interrupted every run with
    // "your code took too long" before the first instruction ever executed.
    context.startedAt = performance.now();
    const result = jsContext.evalCode(instrumentedSource, 'learner-code.js');
    if (result.error) {
      const dumped = jsContext.dump(result.error) as { message?: string; name?: string } | string;
      result.error.dispose();
      const errorMessage =
        typeof dumped === 'string'
          ? dumped
          : [dumped.name, dumped.message ?? 'syntax error'].filter(Boolean).join(': ');
      send({
        type: 'runFault',
        runId: message.runId,
        code: classifyEvaluationFault(
          errorMessage,
          context,
          interruptChecks,
          message.budgets.maxInstructions,
        ),
        reason: errorMessage,
      });
      activeRuns.delete(message.runId);
      return;
    }
    result.value.dispose();

    appliedCount = commandCounter;
    send({
      type: 'runFinished',
      runId: message.runId,
      durationMs: performance.now() - context.startedAt,
      appliedCommands: appliedCount,
      rejectedCommands: rejectedCount,
    });
  } catch (error) {
    if (context.cancelled) {
      send({
        type: 'runFault',
        runId: message.runId,
        code: 'cancelled',
        reason: 'run cancelled',
      });
    } else {
      send({
        type: 'runFault',
        runId: message.runId,
        code: classifyEvaluationFault(
          error instanceof Error ? error.message : 'runtime error',
          context,
          interruptChecks,
          message.budgets.maxInstructions,
        ),
        reason: error instanceof Error ? error.message : 'runtime error',
      });
    }
    activeRuns.delete(message.runId);
  } finally {
    jsContext.dispose();
    runtime.dispose();
  }
};

/**
 * A run that dies inside the worker used to leave the host waiting forever,
 * which shows a child an endless "Running…". Every failure path now ends in a
 * runFault for the active run.
 */
const reportWorkerFailure = (reason: string) => {
  for (const runId of activeRuns.keys()) {
    send({ type: 'runFault', runId, code: 'timeout', reason });
    activeRuns.delete(runId);
  }
};

scope.addEventListener('error', (event: ErrorEvent) => {
  reportWorkerFailure(event.message || 'runner worker error');
});

scope.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  const reason: unknown = event.reason;
  reportWorkerFailure(
    reason instanceof Error ? reason.message : String(reason ?? 'runner worker rejection'),
  );
});

scope.addEventListener('message', async (event: MessageEvent<unknown>) => {
  let parsed: HostToWorkerSchema;
  try {
    parsed = parseHostToWorker(event.data);
  } catch {
    return;
  }
  if (parsed.type === 'run') {
    try {
      await executeRun(parsed);
    } catch (error) {
      reportWorkerFailure(error instanceof Error ? error.message : 'runner failed to start');
    }
    return;
  }
  if (parsed.type === 'cancel') {
    const run = activeRuns.get(parsed.runId);
    if (!run) return;
    run.cancelled = true;
    return;
  }
  if (parsed.type === 'pause' || parsed.type === 'step') {
    return;
  }
});

export type CodeRunnerWorkerEntrypoint = typeof scope;
