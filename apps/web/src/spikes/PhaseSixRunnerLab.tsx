import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { m01FirstSteps } from '@codequest/content';
import {
  createCoordinator,
  isHostToWorker,
  isWorkerToHost,
  parseHostToWorker,
  resolveCapabilities,
  type CoordinatorHandle,
  type HostToWorkerSchema,
  type WorkerToHostSchema,
} from '@codequest/code-runner';
import { createInitialState } from '@codequest/simulation';
import type {
  MissionPackageSchema,
  RunEventSchema,
  RunLifecycleStateSchema,
} from '@codequest/domain';

import { SpikeEditor } from './SpikeEditor';
import './phaseSix.css';

const MISSION: MissionPackageSchema = m01FirstSteps;

const initialSource = `// QuickJS sandbox. Only moveForward / turnLeft / turnRight / collect / interact are exposed.
moveForward();
moveForward();
moveForward();`;

interface LifecycleView {
  readonly state: RunLifecycleStateSchema;
  readonly eventCount: number;
  readonly lastEvent: RunEventSchema | undefined;
}

const lifecycleLabel = (state: RunLifecycleStateSchema): string => {
  switch (state) {
    case 'idle':
      return 'Waiting for the worker to boot…';
    case 'booting':
      return 'Worker is loading QuickJS…';
    case 'running':
      return 'Running your code…';
    case 'paused':
      return 'Paused. Press Step or Resume.';
    case 'stepping':
      return 'Stepping…';
    case 'complete':
      return 'Run complete.';
    case 'fault':
      return 'Run ended with a fault.';
    case 'cancelled':
      return 'Run cancelled.';
  }
};

interface RunSession {
  readonly runId: string;
  readonly coordinator: CoordinatorHandle;
  readonly worker: Worker;
}

export function PhaseSixRunnerLab() {
  const [source, setSource] = useState(initialSource);
  const [lifecycle, setLifecycle] = useState<LifecycleView>({
    state: 'idle',
    eventCount: 0,
    lastEvent: undefined,
  });
  const [events, setEvents] = useState<readonly RunEventSchema[]>([]);
  const sessionRef = useRef<RunSession | null>(null);

  const capabilities = useMemo(() => resolveCapabilities(MISSION), []);

  const refreshLifecycle = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const state = session.coordinator.state();
    setLifecycle({
      state: state.lifecycle,
      eventCount: state.events.length,
      lastEvent: state.events.at(-1),
    });
    setEvents(state.events);
  }, []);

  const handleWorkerMessage = useCallback(
    (message: WorkerToHostSchema) => {
      const session = sessionRef.current;
      if (!session) return;
      session.coordinator.onWorkerMessage(message);
      refreshLifecycle();
    },
    [refreshLifecycle],
  );

  useEffect(
    () => () => {
      const session = sessionRef.current;
      if (session) {
        session.worker.terminate();
      }
    },
    [],
  );

  const runCode = useCallback(() => {
    const previous = sessionRef.current;
    if (previous) {
      previous.worker.terminate();
    }

    const runId = `run-${Date.now()}`;
    const worker = new Worker(new URL('@codequest/code-runner/worker', import.meta.url), {
      type: 'module',
      name: 'codequest-runner',
    });

    worker.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (!isWorkerToHost(event.data)) return;
      handleWorkerMessage(event.data);
    });

    worker.addEventListener('error', (event: ErrorEvent) => {
      handleWorkerMessage({
        type: 'runFault',
        runId,
        code: 'blockedApi',
        reason: event.message,
      });
    });

    const coordinator = createCoordinator({
      mission: MISSION,
      capabilities,
      initialState: createInitialState(MISSION.startState.avatar),
      budgets: {
        maxCommands: 16,
        maxInstructions: 4096,
        memoryBytes: 4 * 1024 * 1024,
        deadlineMs: 4000,
      },
      send(message) {
        if (!isHostToWorker(message)) {
          throw new Error(`invalid host→worker message: ${JSON.stringify(message)}`);
        }
        worker.postMessage(message satisfies HostToWorkerSchema);
      },
    });

    sessionRef.current = { runId, coordinator, worker };

    const prepared: HostToWorkerSchema = parseHostToWorker({
      type: 'run',
      runId,
      source,
      capabilities,
      budgets: {
        memoryBytes: 4 * 1024 * 1024,
        maxInstructions: 4096,
        maxCommands: 16,
        deadlineMs: 4000,
      },
    });
    worker.postMessage(prepared);
    refreshLifecycle();
  }, [capabilities, handleWorkerMessage, refreshLifecycle, source]);

  const cancelRun = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.coordinator.cancel('route-change');
    session.worker.postMessage({
      type: 'cancel',
      runId: session.runId,
      reason: 'route-change',
    } satisfies HostToWorkerSchema);
    refreshLifecycle();
  }, [refreshLifecycle]);

  const pauseRun = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.coordinator.pause();
    refreshLifecycle();
  }, [refreshLifecycle]);

  const resumeRun = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.coordinator.resume();
    session.coordinator.advance();
    refreshLifecycle();
  }, [refreshLifecycle]);

  const stepRun = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.coordinator.step();
    refreshLifecycle();
  }, [refreshLifecycle]);

  return (
    <div className="phase-six-lab">
      <header className="phase-six-header">
        <h1>Phase 6 — Runner Lab</h1>
        <p>
          Wiring the <code>@codequest/code-runner</code> worker into the coordinator. Mission is{' '}
          <code>{MISSION.identity.levelId}</code> ({MISSION.identity.title}); the registry exposes it
          as <code>contentRegistry.getMission({`'` + MISSION.identity.levelId + `'`})</code>.
        </p>
        <p className="phase-six-capabilities">
          Active capabilities:{' '}
          {capabilities.allowedCommandKinds.map((kind) => (
            <code key={kind}>{kind}</code>
          ))}
        </p>
      </header>

      <section className="phase-six-editor">
        <SpikeEditor source={source} onChange={setSource} />
        <div className="phase-six-actions">
          <button type="button" onClick={runCode}>
            Run
          </button>
          <button type="button" onClick={cancelRun}>
            Cancel
          </button>
          <button type="button" onClick={pauseRun}>
            Pause
          </button>
          <button type="button" onClick={resumeRun}>
            Resume
          </button>
          <button type="button" onClick={stepRun}>
            Step
          </button>
        </div>
      </section>

      <section className="phase-six-status">
        <span className={`phase-six-pill phase-six-pill-${lifecycle.state}`}>{lifecycle.state}</span>
        <span className="phase-six-label">{lifecycleLabel(lifecycle.state)}</span>
        <span className="phase-six-count">{events.length} events</span>
      </section>

      <section className="phase-six-events">
        <h2>Run events</h2>
        <ol>
          {events.map((event, index) => (
            <li key={`${event.type}-${index}`} className={`phase-six-row phase-six-row-${event.type}`}>
              <span className="phase-six-row-type">{event.type}</span>
              {event.type === 'commandApplied' ? (
                <>
                  <span className="phase-six-row-kind">{event.command.kind}</span>
                  <span className="phase-six-row-source">L{event.sourceLine}</span>
                  <span className="phase-six-row-reason">{event.reasonKey}</span>
                </>
              ) : null}
              {event.type === 'commandRejected' ? (
                <>
                  <span className="phase-six-row-kind">{event.kind}</span>
                  <span className="phase-six-row-source">L{event.sourceLine}</span>
                  <span className="phase-six-row-reason">{event.reasonKey}</span>
                </>
              ) : null}
              {event.type === 'runFault' ? (
                <>
                  <span className="phase-six-row-kind">{event.code}</span>
                  {event.sourceLine !== undefined ? (
                    <span className="phase-six-row-source">L{event.sourceLine}</span>
                  ) : null}
                  <span className="phase-six-row-reason">{event.reasonKey}</span>
                </>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
