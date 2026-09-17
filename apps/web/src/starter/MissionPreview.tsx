import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  createCoordinator,
  isHostToWorker,
  isWorkerToHost,
  parseHostToWorker,
  resolveCapabilities,
  FAULT_PRESENTATIONS,
  type CoordinatorHandle,
  type HostToWorkerSchema,
  type WorkerToHostSchema,
} from '@codequest/code-runner';
import type {
  MissionPackageSchema,
  RunEventSchema,
  RunFaultSchema,
  SimulationStateSchema,
} from '@codequest/domain';
import { describeRunOutcome } from '@codequest/editor';
import type { SaveStore } from '@codequest/persistence';
import {
  deriveAnimationState,
  SceneView,
  inferTierFromHints,
  type AvatarPresentation,
} from '@codequest/renderer';
import { createInitialState, validateMissionObjectives } from '@codequest/simulation';

import { MissionWorkspace } from './MissionWorkspace';
import type { QualityPreference } from './SettingsDialog';

export type RunPhase = 'idle' | 'running' | 'paused' | 'done';

export interface MissionPreviewProps {
  readonly avatarPresentation: AvatarPresentation;
  readonly hasReducedEffects: boolean;
  readonly mission: MissionPackageSchema;
  readonly qualityPreference: QualityPreference;
  readonly store: SaveStore;
  readonly onReturnToMap: () => void;
  readonly onCompleted: (levelId: string) => void;
}

interface RunSession {
  readonly runId: string;
  readonly coordinator: CoordinatorHandle;
}

const commandPlaybackDuration = (event: RunEventSchema): number => {
  if (event.type !== 'commandApplied') return 260;
  switch (event.command.kind) {
    case 'moveForward':
      return 700;
    case 'turnLeft':
    case 'turnRight':
      return 460;
    case 'collect':
    case 'interact':
      return 520;
  }
};

export function MissionPreview({
  avatarPresentation,
  hasReducedEffects,
  mission,
  qualityPreference,
  store,
  onReturnToMap,
  onCompleted,
}: MissionPreviewProps) {
  const agentName = avatarPresentation === 'girl' ? 'Nova' : 'Kai';
  const initialState = useMemo<SimulationStateSchema>(
    () => createInitialState(mission.startState.avatar),
    [mission],
  );
  const [simulation, setSimulation] = useState<SimulationStateSchema>(initialState);
  const [events, setEvents] = useState<readonly RunEventSchema[]>([]);
  const [queuedEvents, setQueuedEvents] = useState<readonly RunEventSchema[]>([]);
  const [runPhase, setRunPhase] = useState<RunPhase>('idle');
  const [fault, setFault] = useState<RunFaultSchema | null>(null);
  const sessionRef = useRef<RunSession | null>(null);
  const playbackTimerRef = useRef<number | null>(null);
  const playbackActiveRef = useRef(false);
  const workerFinishedRef = useRef(false);
  const watchdogRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [isRunnerReady, setRunnerReady] = useState(false);
  const capabilities = useMemo(() => resolveCapabilities(mission), [mission]);
  const inferredQuality = inferTierFromHints({
    hardwareConcurrency: typeof navigator === 'undefined' ? 4 : navigator.hardwareConcurrency,
    devicePixelRatio: typeof window === 'undefined' ? 1 : window.devicePixelRatio,
  });
  const quality = qualityPreference === 'auto' ? inferredQuality : qualityPreference;

  const stopSession = useCallback(() => {
    const session = sessionRef.current;
    if (session) {
      // Cancel through the protocol rather than terminating: the worker keeps
      // its loaded QuickJS runtime so the next run starts immediately.
      session.coordinator.cancel('reset');
      workerRef.current?.postMessage({ type: 'cancel', runId: session.runId });
      sessionRef.current = null;
    }
    if (playbackTimerRef.current !== null) {
      window.clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    if (watchdogRef.current !== null) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
    playbackActiveRef.current = false;
    workerFinishedRef.current = false;
  }, []);

  /**
   * Guards against a runner that never answers — not against a long mission.
   * It is re-armed every time a command actually plays, so a 20-command capstone
   * animating for half a minute is fine while genuine silence still faults.
   */
  const armWatchdog = useCallback((deadlineMs: number) => {
    if (watchdogRef.current !== null) window.clearTimeout(watchdogRef.current);
    watchdogRef.current = window.setTimeout(() => {
      watchdogRef.current = null;
      const session = sessionRef.current;
      if (!session) return;
      const lifecycle = session.coordinator.state().lifecycle;
      if (lifecycle === 'complete' || lifecycle === 'fault' || lifecycle === 'cancelled') return;
      // A wedged runner is replaced outright, so the next Run starts clean.
      stopSession();
      workerRef.current?.terminate();
      workerRef.current = null;
      setRunnerReady(false);
      getWorkerRef.current?.();
      setFault({ type: 'runFault', code: 'timeout', reasonKey: 'run.runner-silent' });
      setRunPhase('done');
    }, deadlineMs + 8000);
  }, [stopSession]);

  const watchdogDeadlineRef = useRef(12000);
  const getWorkerRef = useRef<(() => Worker) | null>(null);

  useEffect(() => {
    if (playbackActiveRef.current || queuedEvents.length === 0) {
      if (queuedEvents.length === 0 && workerFinishedRef.current) {
        workerFinishedRef.current = false;
        setRunPhase('done');
      }
      return;
    }

    const [nextEvent] = queuedEvents;
    playbackActiveRef.current = true;
    // Progress: push the silence deadline out again.
    armWatchdog(watchdogDeadlineRef.current);
    setEvents((current) => [...current, nextEvent]);
    if (nextEvent.type === 'runFault') {
      setFault(nextEvent);
      workerFinishedRef.current = true;
    }
    if (nextEvent.type === 'commandApplied') {
      const after = nextEvent.after;
      if (after && typeof after === 'object' && 'avatar' in after && 'stepCount' in after) {
        setSimulation(after as SimulationStateSchema);
      }
    }
    playbackTimerRef.current = window.setTimeout(() => {
      playbackTimerRef.current = null;
      playbackActiveRef.current = false;
      // The host releases exactly one command after the visible command has
      // reached its boundary. While paused the coordinator releases nothing,
      // so playback stalls here until Resume or Step.
      const session = sessionRef.current;
      const released = session?.coordinator.advance() ?? [];
      setQueuedEvents((current) => [...current.slice(1), ...released]);
      if (session?.coordinator.state().lifecycle === 'complete' && released.length === 0) {
        workerFinishedRef.current = true;
      }
    }, hasReducedEffects ? 0 : commandPlaybackDuration(nextEvent));
  }, [armWatchdog, hasReducedEffects, queuedEvents]);

  const handleWorkerMessage = useCallback((message: WorkerToHostSchema) => {
    // 'ready' arrives during warm-up, before any run exists.
    if (message.type === 'ready') {
      setRunnerReady(true);
      return;
    }
    const session = sessionRef.current;
    if (!session) return;
    const next = session.coordinator.onWorkerMessage(message);
    // A worker evaluates source independently. Starting playback releases the
    // first queued request; every later request waits for the preceding
    // animation boundary above.
    const released = message.type === 'runFinished' ? session.coordinator.advance() : [];
    if (next.length > 0 || released.length > 0) {
      setQueuedEvents((current) => [...current, ...next, ...released]);
    }
    const lifecycle = session.coordinator.state().lifecycle;
    if (lifecycle === 'complete' || lifecycle === 'fault' || lifecycle === 'cancelled') {
      workerFinishedRef.current = true;
    }
  }, []);

  /**
   * Boot the runner as soon as the mission opens. QuickJS needs several seconds
   * on a page that is also building the 3D scene; doing it here means the wait
   * happens while the child reads the briefing instead of after they press Run.
   */
  const getWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker(new URL('@codequest/code-runner/worker', import.meta.url), {
      type: 'module',
      name: 'codequest-runner',
    });
    worker.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (!isWorkerToHost(event.data)) return;
      handleWorkerMessage(event.data);
    });
    worker.addEventListener('error', (event: ErrorEvent) => {
      const runId = sessionRef.current?.runId;
      if (!runId) return;
      handleWorkerMessage({ type: 'runFault', runId, code: 'blockedApi', reason: event.message });
    });
    workerRef.current = worker;
    return worker;
  }, [handleWorkerMessage]);

  useEffect(() => {
    getWorker();
    return () => {
      stopSession();
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [getWorker, stopSession]);

  const handleRun = useCallback(
    (source: string) => {
      stopSession();
      setEvents([]);
      setQueuedEvents([]);
      setSimulation(initialState);
      setFault(null);
      setRunPhase('running');

      const runId = `run-${Date.now()}`;
      const worker = getWorker();

      // The mission package owns the command budget; the runtime limits are the
      // host's safety net and are deliberately not authorable content.
      //
      // maxInstructions is the real guard against a runaway loop: it counts
      // interrupt checks, so it is unaffected by how much CPU the worker gets.
      // deadlineMs is only a wall-clock backstop and must stay generous — a
      // low-end device sharing a core with the 3D scene can take seconds to do
      // milliseconds of work, and a tight clock aborted every honest run.
      const budgets = {
        maxCommands: mission.budgets.maxCommands,
        maxInstructions: 4096,
        memoryBytes: 4 * 1024 * 1024,
        deadlineMs: 12000,
      };
      const coordinator = createCoordinator({
        mission,
        capabilities,
        initialState,
        budgets,
        send(message) {
          if (!isHostToWorker(message)) {
            throw new Error(`invalid host→worker message: ${JSON.stringify(message)}`);
          }
          worker.postMessage(message satisfies HostToWorkerSchema);
        },
      });
      sessionRef.current = { runId, coordinator };

      const prepared: HostToWorkerSchema = parseHostToWorker({
        type: 'run',
        runId,
        source,
        capabilities,
        budgets,
        mission,
        initialState,
      });
      worker.postMessage(prepared);

      // A runner that never answers must not leave a child watching "Running…"
      // forever. The worker reports its own failures; this covers the case
      // where it cannot even get that far.
      watchdogDeadlineRef.current = budgets.deadlineMs;
      getWorkerRef.current = getWorker;
      armWatchdog(budgets.deadlineMs);
    },
    [armWatchdog, capabilities, getWorker, initialState, mission, stopSession],
  );

  const handlePause = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.coordinator.pause();
    setRunPhase('paused');
  }, []);

  const handleResume = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.coordinator.resume();
    setRunPhase('running');
    const released = session.coordinator.advance();
    if (released.length > 0) setQueuedEvents((current) => [...current, ...released]);
    else if (session.coordinator.state().lifecycle === 'complete') workerFinishedRef.current = true;
  }, []);

  const handleStep = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const released = session.coordinator.step();
    if (released.length > 0) setQueuedEvents((current) => [...current, ...released]);
    else if (session.coordinator.state().workerFinished) setRunPhase('done');
  }, []);

  const handleResetScene = useCallback(() => {
    stopSession();
    setEvents([]);
    setQueuedEvents([]);
    setSimulation(initialState);
    setFault(null);
    setRunPhase('idle');
  }, [initialState, stopSession]);

  const outcome = useMemo(() => {
    if (runPhase !== 'done' || fault) return null;
    return describeRunOutcome(validateMissionObjectives(mission, simulation).issues, {
      agentName,
      goal: mission.briefing.goal,
    });
  }, [agentName, fault, mission, runPhase, simulation]);

  useEffect(() => {
    if (outcome?.status === 'success') onCompleted(mission.identity.levelId);
  }, [mission, onCompleted, outcome]);

  // Any terminal state retires the watchdog; otherwise it would fire later and
  // replace a finished run's result with a false timeout.
  useEffect(() => {
    if (runPhase !== 'done') return;
    if (watchdogRef.current === null) return;
    window.clearTimeout(watchdogRef.current);
    watchdogRef.current = null;
  }, [runPhase]);

  const faultCopy = fault ? FAULT_PRESENTATIONS[fault.code] : null;

  const isPlaying = runPhase === 'running' || runPhase === 'paused';
  const movementState = isPlaying
    ? deriveAnimationState(events, simulation).movementState
    : 'idle';

  return (
    <section className="game-screen" aria-labelledby="mission-title">
      <div className="playground">
        <SceneView
          className="starter-scene-view"
          events={events}
          mission={mission}
          movementState={movementState}
          presentation={avatarPresentation}
          quality={quality}
          reducedEffects={hasReducedEffects}
          state={simulation}
          toolbar={(
            <button className="scene-view-action" onClick={onReturnToMap} type="button">
              ← Map
            </button>
          )}
        />
      </div>
      <MissionWorkspace
        avatarPresentation={avatarPresentation}
        commands={capabilities.allowedCommandKinds}
        predicates={capabilities.allowedPredicateKinds}
        events={events}
        fault={fault}
        faultCopy={faultCopy}
        mission={mission}
        onPause={handlePause}
        onResetScene={handleResetScene}
        onResume={handleResume}
        onRun={handleRun}
        onStep={handleStep}
        isRunnerReady={isRunnerReady}
        outcome={outcome}
        runPhase={runPhase}
        store={store}
      />
    </section>
  );
}
