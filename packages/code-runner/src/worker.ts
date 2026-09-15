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
import { instrumentCommandSourceLines } from './source-mapping';

const scope = self as DedicatedWorkerGlobalScope;

const send = (message: WorkerToHostSchema) => {
  scope.postMessage(message);
};

const quickJsModulePromise = newQuickJSWASMModuleFromVariant(RELEASE_SYNC).then(
  (module) => ({ module }),
  (error: unknown) => ({
    error: {
      code: 'blockedApi' as const,
      message: error instanceof Error ? error.message : 'quickjs failed to load',
    },
  }),
);

interface RunContext {
  readonly runId: string;
  readonly startedAt: number;
  readonly deadlineMs: number;
  cancelled: boolean;
}

const classifyEvaluationFault = (
  message: string,
  context: RunContext,
  interruptChecks: number,
  maxInstructions: number,
): Extract<WorkerToHostSchema, { type: 'runFault' }>['code'] => {
  if (context.cancelled) return 'cancelled';
  if (performance.now() - context.startedAt > context.deadlineMs || interruptChecks >= maxInstructions) {
    return 'timeout';
  }
  if (/command budget exceeded/i.test(message)) return 'commandLimit';
  if (/out of memory|stack/i.test(message)) return 'memory';
  if (/referenceerror/i.test(message)) return 'blockedApi';
  return 'syntax';
};

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
        const requestedLine = jsContext.dump(args[0]) as unknown;
        const sourceLine = typeof requestedLine === 'number' && Number.isInteger(requestedLine)
          ? requestedLine
          : 0;
        send({
          type: 'commandRequested',
          runId: context.runId,
          command: { commandId, kind, sourceLine },
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
    const result = jsContext.evalCode(instrumentedSource, 'learner-code.js');
    if (result.error) {
      const dumped = jsContext.dump(result.error) as { message?: string; name?: string } | string;
      result.error.dispose();
      const errorMessage = typeof dumped === 'string' ? dumped : dumped.message ?? 'syntax error';
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

scope.addEventListener('message', async (event: MessageEvent<unknown>) => {
  let parsed: HostToWorkerSchema;
  try {
    parsed = parseHostToWorker(event.data);
  } catch {
    return;
  }
  if (parsed.type === 'run') {
    await executeRun(parsed);
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
