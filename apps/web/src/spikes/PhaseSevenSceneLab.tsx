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
  SimulationStateSchema,
} from '@codequest/domain';
import {
  type AvatarMovementState,
  type AvatarPresentation,
  type CameraMode,
  type PreviewNudge,
  PreviewControls,
  SceneView,
  type QualityTier,
  deriveAnimationState,
  inferTierFromHints,
  reducedMotionDefault,
} from '@codequest/renderer';

import { SpikeEditor } from './SpikeEditor';
import './phaseSeven.css';

const MISSION: MissionPackageSchema = m01FirstSteps;

const initialSource = `moveForward();
moveForward();
moveForward();`;

interface RunSession {
  readonly runId: string;
  readonly coordinator: CoordinatorHandle;
  readonly worker: Worker;
}

const sourceEvents: RunEventSchema[] = [];

const stepMovement = (
  state: SimulationStateSchema,
  mission: MissionPackageSchema,
  direction: PreviewNudge['direction'],
): SimulationStateSchema => {
  if (direction === 'forward') {
    return {
      ...state,
      avatar: { ...state.avatar, cellX: state.avatar.cellX + 1 },
      stepCount: state.stepCount + 1,
    };
  }
  if (direction === 'backward') {
    return {
      ...state,
      avatar: { ...state.avatar, cellX: Math.max(0, state.avatar.cellX - 1) },
      stepCount: state.stepCount + 1,
    };
  }
  if (direction === 'left') {
    return {
      ...state,
      avatar: { ...state.avatar, cellZ: Math.max(mission.startState.avatar.cellZ - 1, state.avatar.cellZ - 1) },
      stepCount: state.stepCount + 1,
    };
  }
  return {
    ...state,
    avatar: { ...state.avatar, cellZ: state.avatar.cellZ + 1 },
    stepCount: state.stepCount + 1,
  };
};

export function PhaseSevenSceneLab() {
  void sourceEvents;
  const [source, setSource] = useState(initialSource);
  const [avatarPresentation, setAvatarPresentation] = useState<AvatarPresentation>('girl');
  const [quality, setQuality] = useState<QualityTier>(() =>
    inferTierFromHints({
      hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4,
      devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    }),
  );
  const [reducedEffects, setReducedEffects] = useState<boolean>(() => reducedMotionDefault());
  const [cameraMode, setCameraMode] = useState<CameraMode>('coding');
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [lifecycle, setLifecycle] = useState<RunLifecycleStateSchema>('idle');
  const [events, setEvents] = useState<readonly RunEventSchema[]>([]);
  const [simulation, setSimulation] = useState<SimulationStateSchema>(() =>
    createInitialState(MISSION.startState.avatar),
  );
  const [cameraResetToken, setCameraResetToken] = useState(0);

  const sessionRef = useRef<RunSession | null>(null);
  const capabilities = useMemo(() => resolveCapabilities(MISSION), []);

  const handleWorkerMessage = useCallback((message: WorkerToHostSchema) => {
    const session = sessionRef.current;
    if (!session) return;
    const next = session.coordinator.onWorkerMessage(message);
    if (next.length > 0) {
      setEvents((current) => [...current, ...next]);
    }
    const state = session.coordinator.state();
    setLifecycle(state.lifecycle);
    const reversed = [...state.events].reverse();
    const lastApplied = reversed.find((event) => event.type === 'commandApplied');
    if (lastApplied && lastApplied.type === 'commandApplied') {
      const afterState = lastApplied.after;
      if (
        afterState &&
        typeof afterState === 'object' &&
        'avatar' in afterState &&
        'stepCount' in afterState
      ) {
        setSimulation(afterState as SimulationStateSchema);
      }
    }
  }, []);

  useEffect(
    () => () => {
      const session = sessionRef.current;
      if (session) {
        session.worker.terminate();
      }
    },
    [],
  );

  const stopSession = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.worker.terminate();
    sessionRef.current = null;
  }, []);

  const runCode = useCallback(() => {
    stopSession();
    const fresh = createInitialState(MISSION.startState.avatar);
    setSimulation(fresh);
    setEvents([]);
    setPreviewEnabled(false);

    const runId = `run-${Date.now()}`;
    const worker = new Worker(new URL('@codequest/code-runner/src/worker.ts', import.meta.url), {
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
      initialState: fresh,
      budgets: { maxCommands: 16, maxInstructions: 4096, memoryBytes: 4 * 1024 * 1024, deadlineMs: 4000 },
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
      budgets: { memoryBytes: 4 * 1024 * 1024, maxInstructions: 4096, maxCommands: 16, deadlineMs: 4000 },
    });
    worker.postMessage(prepared);
    setLifecycle('booting');
  }, [capabilities, handleWorkerMessage, source, stopSession]);

  const reenterPreview = useCallback(() => {
    stopSession();
    const fresh = createInitialState(MISSION.startState.avatar);
    setSimulation(fresh);
    setEvents([]);
    setLifecycle('idle');
    setPreviewEnabled(true);
    setCameraResetToken((token) => token + 1);
  }, [stopSession]);

  const handlePreviewNudge = useCallback(
    (nudge: PreviewNudge) => {
      if (!previewEnabled) return;
      setSimulation((current) => stepMovement(current, MISSION, nudge.direction));
    },
    [previewEnabled],
  );

  const animation = deriveAnimationState(events, simulation);
  const movementState: AvatarMovementState = lifecycle === 'fault'
    ? 'fault'
    : lifecycle === 'cancelled'
      ? 'idle'
      : animation.movementState;

  return (
    <div className="phase-seven-lab">
      <header className="phase-seven-header">
        <h1>Phase 7 — Greybox Lab</h1>
        <p>
          Wiring the <code>@codequest/renderer</code> scene adapter to the Phase 5/6 coordinator + worker.
          Mission <code>{MISSION.identity.levelId}</code>, {MISSION.objects.length} objects.
        </p>
      </header>

      <div className="phase-seven-toolbar" role="toolbar" aria-label="Renderer controls">
        <button
          type="button"
          aria-pressed={avatarPresentation === 'boy'}
          onClick={() => setAvatarPresentation('boy')}
        >
          Boy
        </button>
        <button
          type="button"
          aria-pressed={avatarPresentation === 'girl'}
          onClick={() => setAvatarPresentation('girl')}
        >
          Girl
        </button>
        <button
          type="button"
          aria-pressed={!reducedEffects}
          onClick={() => setReducedEffects((value) => !value)}
        >
          {reducedEffects ? 'Restore motion' : 'Reduce motion'}
        </button>
        <button
          type="button"
          aria-pressed={cameraMode === 'coding'}
          onClick={() => setCameraMode('coding')}
        >
          Coding
        </button>
        <button
          type="button"
          aria-pressed={cameraMode === 'preview'}
          onClick={() => setCameraMode('preview')}
        >
          Preview
        </button>
        <button
          type="button"
          aria-pressed={cameraMode === 'strategic'}
          onClick={() => setCameraMode('strategic')}
        >
          Strategic
        </button>
        <button
          type="button"
          aria-pressed={previewEnabled}
          onClick={() => setPreviewEnabled((value) => !value)}
        >
          {previewEnabled ? 'Preview: on' : 'Preview: off'}
        </button>
        <button type="button" onClick={() => setCameraResetToken((token) => token + 1)}>
          Reset camera
        </button>
        <div className="phase-seven-quality" aria-label="Quality tier">
          {(['low', 'medium', 'high'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              aria-pressed={quality === tier}
              className="phase-seven-quality-pill"
              onClick={() => setQuality(tier)}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      <div className="phase-seven-grid">
        <section className="phase-seven-stage" aria-label="3D scene">
          <SceneView
            mission={MISSION}
            state={simulation}
            events={events}
            presentation={avatarPresentation}
            quality={quality}
            reducedEffects={reducedEffects}
            movementState={movementState}
            cameraMode={cameraMode}
            cameraResetToken={cameraResetToken}
            previewEnabled={previewEnabled}
            onPreviewNudge={handlePreviewNudge}
            className="phase-seven-scene-view"
          />
          <PreviewControls
            state={simulation}
            onNudge={handlePreviewNudge}
            enabled={previewEnabled}
          />
        </section>

        <aside className="phase-seven-sidebar" aria-label="Lab sidebar">
          <div className="phase-seven-card">
            <h2>Coordinator</h2>
            <p>
              Lifecycle: <code>{lifecycle}</code> · events: <code>{events.length}</code> · step{' '}
              <code>{simulation.stepCount}</code>
            </p>
            <div className="phase-seven-actions">
              <button type="button" onClick={runCode}>
                Run code
              </button>
              <button type="button" onClick={reenterPreview}>
                Reset Scene
              </button>
            </div>
          </div>
          <div className="phase-seven-card">
            <h2>Current command</h2>
            <div className="phase-seven-active">
              <span>
                Kind: <code>{animation.activeCommand?.kind ?? '—'}</code>
              </span>
              <span>
                Source line: <code>{animation.activeCommand?.sourceLine ?? '—'}</code>
              </span>
              <span>
                Movement: <code>{movementState}</code>
              </span>
              <span>
                Cell: <code>({simulation.avatar.cellX}, {simulation.avatar.cellZ})</code>
              </span>
              <span>
                Facing: <code>{simulation.avatar.facing}</code>
              </span>
            </div>
          </div>
          <div className="phase-seven-card">
            <h2>Source</h2>
            <SpikeEditor source={source} onChange={setSource} />
          </div>
          <div className="phase-seven-card phase-seven-trace">
            <h2>Trace</h2>
            <ol>
              {events.map((event, index) => {
                if (event.type === 'commandApplied') {
                  return (
                    <li key={`${event.commandId}-${index}`} data-applied="true">
                      ✓ L{event.sourceLine} {event.command.kind} → {event.reasonKey}
                    </li>
                  );
                }
                if (event.type === 'commandRejected') {
                  return (
                    <li key={`${event.commandId}-${index}`} data-applied="false">
                      ✗ L{event.sourceLine} {event.kind} → {event.reasonKey}
                    </li>
                  );
                }
                return (
                  <li key={`fault-${index}`} data-fault="true">
                    ⚠ {event.code} → {event.reasonKey}
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}