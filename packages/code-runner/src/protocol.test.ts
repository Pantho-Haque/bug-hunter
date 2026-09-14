import { describe, expect, it } from 'vitest';

import {
  parseHostToWorker,
  parseWorkerToHost,
  runnerCapabilitiesSchema,
} from './protocol';

describe('parseHostToWorker', () => {
  it('accepts a run message', () => {
    const message = parseHostToWorker({
      type: 'run',
      runId: 'run-1',
      source: 'moveForward();',
      capabilities: {
        apiVersion: 'v1',
        allowedCommandKinds: ['moveForward'],
        allowLogs: true,
      },
      budgets: {
        memoryBytes: 1024 * 1024,
        maxInstructions: 10000,
        maxCommands: 16,
        deadlineMs: 5000,
      },
    });
    expect(message.type).toBe('run');
  });

  it('rejects a run with an empty command kind list', () => {
    expect(() =>
      parseHostToWorker({
        type: 'run',
        runId: 'run-2',
        source: '',
        capabilities: {
          apiVersion: 'v1',
          allowedCommandKinds: [],
          allowLogs: true,
        },
        budgets: {
          memoryBytes: 1024,
          maxInstructions: 1,
          maxCommands: 1,
          deadlineMs: 1,
        },
      }),
    ).toThrow();
  });

  it('rejects a run with oversized source', () => {
    expect(() =>
      parseHostToWorker({
        type: 'run',
        runId: 'run-3',
        source: 'a'.repeat(20_001),
        capabilities: {
          apiVersion: 'v1',
          allowedCommandKinds: ['moveForward'],
          allowLogs: true,
        },
        budgets: {
          memoryBytes: 1024,
          maxInstructions: 1,
          maxCommands: 1,
          deadlineMs: 1,
        },
      }),
    ).toThrow();
  });

  it('accepts cancel/pause/step', () => {
    expect(parseHostToWorker({ type: 'cancel', runId: 'r1', reason: 'route-change' }).type).toBe('cancel');
    expect(parseHostToWorker({ type: 'pause', runId: 'r1' }).type).toBe('pause');
    expect(parseHostToWorker({ type: 'step', runId: 'r1' }).type).toBe('step');
  });

  it('rejects unknown host→worker types', () => {
    expect(() => parseHostToWorker({ type: 'teleport', runId: 'r1' })).toThrow();
  });
});

describe('parseWorkerToHost', () => {
  it('accepts every well-formed message', () => {
    expect(parseWorkerToHost({ type: 'ready' }).type).toBe('ready');
    expect(parseWorkerToHost({ type: 'runStarted', runId: 'r1', apiVersion: 'v1' }).type).toBe('runStarted');
    expect(
      parseWorkerToHost({
        type: 'commandRequested',
        runId: 'r1',
        command: { commandId: 'c1', kind: 'moveForward', sourceLine: 1 },
      }).type,
    ).toBe('commandRequested');
    expect(
      parseWorkerToHost({
        type: 'log',
        runId: 'r1',
        log: { level: 'log', message: 'hi' },
      }).type,
    ).toBe('log');
    expect(
      parseWorkerToHost({
        type: 'runFinished',
        runId: 'r1',
        durationMs: 100,
        appliedCommands: 2,
        rejectedCommands: 0,
      }).type,
    ).toBe('runFinished');
    expect(
      parseWorkerToHost({
        type: 'runFault',
        runId: 'r1',
        code: 'timeout',
        sourceLine: 5,
        reason: 'interrupt',
      }).type,
    ).toBe('runFault');
  });

  it('rejects malformed runFinished', () => {
    expect(() =>
      parseWorkerToHost({
        type: 'runFinished',
        runId: 'r1',
        durationMs: -1,
        appliedCommands: 0,
        rejectedCommands: 0,
      }),
    ).toThrow();
  });

  it('rejects unknown fault codes', () => {
    expect(() =>
      parseWorkerToHost({
        type: 'runFault',
        runId: 'r1',
        code: 'rogue',
      }),
    ).toThrow();
  });
});

describe('runnerCapabilitiesSchema', () => {
  it('rejects an empty command kind list', () => {
    expect(
      runnerCapabilitiesSchema.safeParse({
        apiVersion: 'v1',
        allowedCommandKinds: [],
        allowLogs: true,
      }).success,
    ).toBe(false);
  });

  it('rejects unknown command kinds', () => {
    expect(
      runnerCapabilitiesSchema.safeParse({
        apiVersion: 'v1',
        allowedCommandKinds: ['teleport'],
        allowLogs: true,
      }).success,
    ).toBe(false);
  });
});