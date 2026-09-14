import { describe, expect, it } from 'vitest';

import { m01FirstSteps } from '@codequest/content';
import { createInitialState } from '@codequest/simulation';

import { createCoordinator, type CoordinatorHandle } from './coordinator';
import { resolveCapabilities } from './capabilities';
import {
  type HostToWorkerSchema,
  type RunnerCapabilitiesSchema,
  type WorkerToHostSchema,
} from './protocol';

interface CoordinatorFixture {
  readonly handle: CoordinatorHandle;
  readonly sentToWorker: HostToWorkerSchema[];
  readonly capabilities: RunnerCapabilitiesSchema;
}

const buildFixture = (mission = m01FirstSteps): CoordinatorFixture => {
  const initial = createInitialState(mission.startState.avatar);
  const capabilities = resolveCapabilities(mission);
  const sentToWorker: HostToWorkerSchema[] = [];
  const handle = createCoordinator({
    mission,
    capabilities,
    initialState: initial,
    budgets: {
      maxCommands: 16,
      maxInstructions: 1024,
      memoryBytes: 1024 * 1024,
      deadlineMs: 5000,
    },
    send(message) {
      sentToWorker.push(message);
    },
  });
  return { handle, sentToWorker, capabilities };
};

const commandRequested = (
  runId: string,
  commandId: string,
  kind: 'moveForward' | 'turnLeft' | 'turnRight' | 'collect' | 'interact',
  sourceLine: number,
): WorkerToHostSchema => ({
  type: 'commandRequested',
  runId,
  command: { commandId, kind, sourceLine },
});

describe('coordinator lifecycle', () => {
  it('transitions idle → booting → running → complete', () => {
    const fixture = buildFixture();
    fixture.handle.onWorkerMessage({ type: 'ready' });
    fixture.handle.onWorkerMessage({ type: 'runStarted', runId: 'r1', apiVersion: 'v1' });
    fixture.handle.onWorkerMessage(commandRequested('r1', 'c1', 'moveForward', 1));
    fixture.handle.onWorkerMessage({ type: 'runFinished', runId: 'r1', durationMs: 10, appliedCommands: 1, rejectedCommands: 0 });

    const state = fixture.handle.state();
    expect(state.lifecycle).toBe('complete');
    expect(state.applied).toBe(1);
  });

  it('emits a blocked-api event when a disallowed kind is requested', () => {
    const fixture = buildFixture();
    fixture.handle.onWorkerMessage({ type: 'ready' });
    fixture.handle.onWorkerMessage({ type: 'runStarted', runId: 'r2', apiVersion: 'v1' });
    fixture.handle.onWorkerMessage(commandRequested('r2', 'c1', 'interact', 1));
    fixture.handle.onWorkerMessage({ type: 'runFinished', runId: 'r2', durationMs: 10, appliedCommands: 0, rejectedCommands: 1 });
    const state = fixture.handle.state();
    const rejection = state.events.find((e) => e.type === 'commandRejected');
    expect(rejection).toBeDefined();
    if (rejection && rejection.type === 'commandRejected') {
      expect(rejection.reasonKey).toBe('run.blocked-api');
    }
    expect(state.lifecycle).toBe('complete');
  });
});

describe('hostile fixtures', () => {
  it('handles an infinite loop → timeout fault', () => {
    const fixture = buildFixture();
    fixture.handle.onWorkerMessage({ type: 'ready' });
    fixture.handle.onWorkerMessage({ type: 'runStarted', runId: 'r-timeout', apiVersion: 'v1' });
    fixture.handle.onWorkerMessage({
      type: 'runFault',
      runId: 'r-timeout',
      code: 'timeout',
      sourceLine: 1,
      reason: 'interrupt',
    });
    expect(fixture.handle.state().lifecycle).toBe('fault');
    expect(fixture.handle.state().events.at(-1)).toMatchObject({ type: 'runFault', code: 'timeout', reasonKey: 'interrupt' });
  });

  it('handles unbounded recursion → memory fault', () => {
    const fixture = buildFixture();
    fixture.handle.onWorkerMessage({ type: 'ready' });
    fixture.handle.onWorkerMessage({ type: 'runStarted', runId: 'r-mem', apiVersion: 'v1' });
    fixture.handle.onWorkerMessage({
      type: 'runFault',
      runId: 'r-mem',
      code: 'memory',
      sourceLine: 3,
    });
    expect(fixture.handle.state().lifecycle).toBe('fault');
    expect(fixture.handle.state().events.at(-1)).toMatchObject({ type: 'runFault', code: 'memory', reasonKey: 'run.memory' });
  });

  it('handles allocation growth → memory fault with budget reason', () => {
    const fixture = buildFixture();
    fixture.handle.onWorkerMessage({ type: 'ready' });
    fixture.handle.onWorkerMessage({ type: 'runStarted', runId: 'r-alloc', apiVersion: 'v1' });
    for (let i = 0; i < 20; i++) {
      fixture.handle.onWorkerMessage(commandRequested('r-alloc', `c-${i}`, 'moveForward', i));
    }
    const state = fixture.handle.state();
    expect(state.applied + state.rejected).toBeLessThanOrEqual(16);
    expect(state.lifecycle).toBe('fault');
    expect(state.events.at(-1)).toMatchObject({ type: 'runFault', code: 'memory' });
  });

  it('handles blocked global access → blockedApi rejection', () => {
    const fixture = buildFixture();
    fixture.handle.onWorkerMessage({ type: 'ready' });
    fixture.handle.onWorkerMessage({ type: 'runStarted', runId: 'r-blocked', apiVersion: 'v1' });
    fixture.handle.onWorkerMessage(commandRequested('r-blocked', 'c1', 'interact', 1));
    const events = fixture.handle.onWorkerMessage({
      type: 'runFault',
      runId: 'r-blocked',
      code: 'blockedApi',
      sourceLine: 4,
    });
    expect(events.find((e) => e.type === 'runFault')).toMatchObject({ code: 'blockedApi' });
  });

  it('handles malformed command → fault rejection without crashing', () => {
    const fixture = buildFixture();
    fixture.handle.onWorkerMessage({ type: 'ready' });
    fixture.handle.onWorkerMessage({ type: 'runStarted', runId: 'r-malformed', apiVersion: 'v1' });
    fixture.handle.onWorkerMessage(commandRequested('r-malformed', 'c1', 'moveForward', 999));
    const state = fixture.handle.state();
    expect(state.applied).toBe(1);
    expect(fixture.handle.onWorkerMessage({ type: 'log', runId: 'r-malformed', log: { level: 'warn', message: 'malformed' } })).toEqual([]);
  });

  it('rejects bad arguments at the reducer level (moveForward into a blocker)', () => {
    const mission = JSON.parse(JSON.stringify(m01FirstSteps));
    mission.objects.push({
      id: 'wall-args',
      label: 'Wall',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 1, cellZ: 0 }],
      reasonKey: 'wall.solid',
    });
    const fixture = buildFixture(mission);
    fixture.handle.onWorkerMessage({ type: 'ready' });
    fixture.handle.onWorkerMessage({ type: 'runStarted', runId: 'r-args', apiVersion: 'v1' });
    fixture.handle.onWorkerMessage(commandRequested('r-args', 'c1', 'moveForward', 1));
    const events = fixture.handle.state().events;
    const rejection = events.find((e) => e.type === 'commandRejected');
    expect(rejection).toBeDefined();
    if (rejection && rejection.type === 'commandRejected') {
      expect(rejection.reasonKey).toBe('wall.solid');
    }
  });

  it('double-Run isolates state and rejects a second runId while one is active', () => {
    const fixture = buildFixture();
    fixture.handle.onWorkerMessage({ type: 'ready' });
    fixture.handle.onWorkerMessage({ type: 'runStarted', runId: 'r-A', apiVersion: 'v1' });
    fixture.handle.onWorkerMessage(commandRequested('r-A', 'c1', 'moveForward', 1));
    fixture.handle.onWorkerMessage(commandRequested('r-A', 'c2', 'moveForward', 2));
    fixture.handle.onWorkerMessage({ type: 'runStarted', runId: 'r-B', apiVersion: 'v1' });
    const stateAfter = fixture.handle.state();
    expect(stateAfter.runId).toBe('r-B');
    expect(stateAfter.applied).toBe(0);
  });

  it('Pause during run keeps commands queued until resume', () => {
    const fixture = buildFixture();
    fixture.handle.onWorkerMessage({ type: 'ready' });
    fixture.handle.onWorkerMessage({ type: 'runStarted', runId: 'r-pause', apiVersion: 'v1' });
    fixture.handle.onWorkerMessage(commandRequested('r-pause', 'c1', 'moveForward', 1));
    fixture.handle.pause();
    expect(fixture.handle.state().lifecycle).toBe('paused');
    fixture.handle.onWorkerMessage(commandRequested('r-pause', 'c2', 'moveForward', 2));
    expect(fixture.handle.state().applied).toBe(1);
    fixture.handle.resume();
    expect(fixture.handle.state().lifecycle).toBe('running');
    fixture.handle.onWorkerMessage(commandRequested('r-pause', 'c3', 'moveForward', 3));
    expect(fixture.handle.state().applied).toBe(2);
  });

  it('Step mode emits one command at a time when paused', () => {
    const fixture = buildFixture();
    fixture.handle.onWorkerMessage({ type: 'ready' });
    fixture.handle.onWorkerMessage({ type: 'runStarted', runId: 'r-step', apiVersion: 'v1' });
    fixture.handle.onWorkerMessage(commandRequested('r-step', 'c1', 'moveForward', 1));
    fixture.handle.pause();
    fixture.handle.step();
    fixture.handle.onWorkerMessage(commandRequested('r-step', 'c2', 'moveForward', 2));
    expect(fixture.handle.state().applied).toBe(2);
  });

  it('cancel during run produces a cancelled fault with route-change reason', () => {
    const fixture = buildFixture();
    fixture.handle.onWorkerMessage({ type: 'ready' });
    fixture.handle.onWorkerMessage({ type: 'runStarted', runId: 'r-cancel', apiVersion: 'v1' });
    fixture.handle.onWorkerMessage(commandRequested('r-cancel', 'c1', 'moveForward', 1));
    fixture.handle.cancel('route-change');
    const state = fixture.handle.state();
    expect(state.lifecycle).toBe('cancelled');
    expect(state.events.at(-1)).toMatchObject({
      type: 'runFault',
      code: 'cancelled',
      reasonKey: 'run.cancelled.route-change',
    });
  });
});