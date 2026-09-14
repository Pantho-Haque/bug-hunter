/// <reference lib="webworker" />

import RELEASE_SYNC from '@jitl/quickjs-wasmfile-release-sync';
import { newQuickJSWASMModuleFromVariant } from 'quickjs-emscripten-core';

import type {
  RunnerCommand,
  RunnerRequest,
  RunnerResponse,
} from './runnerProtocol';

const scope = self as DedicatedWorkerGlobalScope;
const quickJsPromise = newQuickJSWASMModuleFromVariant(RELEASE_SYNC);

quickJsPromise.then(() => {
  const response: RunnerResponse = { type: 'ready' };
  scope.postMessage(response);
});

scope.addEventListener(
  'message',
  async (event: MessageEvent<RunnerRequest>) => {
    if (event.data.type !== 'run') return;

    const { runId, source } = event.data;
    const startedAt = performance.now();
    const commands: RunnerCommand[] = [];
    const logs: string[] = [];
    const QuickJS = await quickJsPromise;
    const runtime = QuickJS.newRuntime();

    runtime.setMemoryLimit(8 * 1024 * 1024);
    runtime.setMaxStackSize(512 * 1024);
    runtime.setInterruptHandler(() => performance.now() - startedAt > 750);

    const context = runtime.newContext();

    try {
      const moveForwardHandle = context.newFunction('moveForward', () => {
        if (commands.length >= 64) {
          throw new Error('Command budget exceeded: use 64 commands or fewer.');
        }

        commands.push({ name: 'moveForward', sequence: commands.length + 1 });
        return context.undefined;
      });
      context.setProp(context.global, 'moveForward', moveForwardHandle);
      moveForwardHandle.dispose();

      const logHandle = context.newFunction('log', (...args) => {
        if (logs.length < 20)
          logs.push(
            args.map((argument) => String(context.dump(argument))).join(' '),
          );
        return context.undefined;
      });
      const consoleHandle = context.newObject();
      context.setProp(consoleHandle, 'log', logHandle);
      context.setProp(context.global, 'console', consoleHandle);
      logHandle.dispose();
      consoleHandle.dispose();

      const result = context.evalCode(source, 'learner-code.js');

      if (result.error) {
        const error = context.dump(result.error) as
          { message?: string; name?: string } | string;
        result.error.dispose();
        const message =
          typeof error === 'string'
            ? error
            : `${error.name ?? 'Error'}: ${error.message ?? 'The program could not run.'}`;
        const response: RunnerResponse = {
          durationMs: performance.now() - startedAt,
          message,
          runId,
          type: 'fault',
        };
        scope.postMessage(response);
        return;
      }

      result.value.dispose();
      const response: RunnerResponse = {
        commands,
        durationMs: performance.now() - startedAt,
        logs,
        runId,
        type: 'complete',
      };
      scope.postMessage(response);
    } catch (error) {
      const response: RunnerResponse = {
        durationMs: performance.now() - startedAt,
        message:
          error instanceof Error
            ? error.message
            : 'The runner stopped unexpectedly.',
        runId,
        type: 'fault',
      };
      scope.postMessage(response);
    } finally {
      context.dispose();
      runtime.dispose();
    }
  },
);
