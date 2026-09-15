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
import type { MissionPackageSchema, RunEventSchema, SimulationStateSchema } from '@codequest/domain';
import {
  deriveAnimationState,
  SceneView,
  inferTierFromHints,
  type AvatarPresentation,
} from '@codequest/renderer';
import { createInitialState } from '@codequest/simulation';

import { MissionWorkspace } from './MissionWorkspace';
import type { QualityPreference } from './SettingsDialog';

const MISSION = m01FirstSteps;

export interface MissionPreviewProps {
  readonly avatarPresentation: AvatarPresentation;
  readonly hasReducedEffects: boolean;
  readonly qualityPreference: QualityPreference;
  readonly onReturnToMap: () => void;
}

interface RunSession {
  readonly runId: string;
  readonly coordinator: CoordinatorHandle;
  readonly worker: Worker;
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
  qualityPreference,
  onReturnToMap,
}: MissionPreviewProps) {
  const agentName = avatarPresentation === 'girl' ? 'Nova' : 'Kai';
  const initialState = useMemo<SimulationStateSchema>(
    () => createInitialState(MISSION.startState.avatar),
    [],
  );
  const [simulation, setSimulation] = useState<SimulationStateSchema>(initialState);
  const [events, setEvents] = useState<readonly RunEventSchema[]>([]);
  const [queuedEvents, setQueuedEvents] = useState<readonly RunEventSchema[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runStateLabel, setRunStateLabel] = useState(
    `Write your route now. Running it will animate ${agentName} in this world once the safe mission runner is connected.`,
  );
  const sessionRef = useRef<RunSession | null>(null);
  const playbackTimerRef = useRef<number | null>(null);
  const playbackActiveRef = useRef(false);
  const workerFinishedRef = useRef(false);
  const terminalLabelRef = useRef<string | null>(null);
  const capabilities = useMemo(() => resolveCapabilities(MISSION), []);
  const inferredQuality = inferTierFromHints({
    hardwareConcurrency: typeof navigator === 'undefined' ? 4 : navigator.hardwareConcurrency,
    devicePixelRatio: typeof window === 'undefined' ? 1 : window.devicePixelRatio,
  });
  const quality = qualityPreference === 'auto' ? inferredQuality : qualityPreference;

  const stopSession = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.worker.terminate();
    sessionRef.current = null;
    if (playbackTimerRef.current !== null) {
      window.clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    playbackActiveRef.current = false;
    workerFinishedRef.current = false;
    terminalLabelRef.current = null;
  }, []);

  useEffect(() => {
    if (playbackActiveRef.current || queuedEvents.length === 0) {
      if (
        queuedEvents.length === 0 &&
        workerFinishedRef.current &&
        terminalLabelRef.current !== null
      ) {
        setIsRunning(false);
        setRunStateLabel(terminalLabelRef.current);
        workerFinishedRef.current = false;
        terminalLabelRef.current = null;
      }
      return;
    }

    const [nextEvent] = queuedEvents;
    playbackActiveRef.current = true;
    setEvents((current) => [...current, nextEvent]);
    if (nextEvent.type === 'commandApplied') {
      const after = nextEvent.after;
      if (after && typeof after === 'object' && 'avatar' in after && 'stepCount' in after) {
        setSimulation(after as SimulationStateSchema);
      }
    }
    playbackTimerRef.current = window.setTimeout(() => {
      playbackTimerRef.current = null;
      playbackActiveRef.current = false;
      setQueuedEvents((current) => current.slice(1));
    }, hasReducedEffects ? 0 : commandPlaybackDuration(nextEvent));
  }, [hasReducedEffects, queuedEvents]);

  const handleWorkerMessage = useCallback(
    (message: WorkerToHostSchema) => {
      const session = sessionRef.current;
      if (!session) return;
      const next = session.coordinator.onWorkerMessage(message);
      if (next.length > 0) {
        setQueuedEvents((current) => [...current, ...next]);
      }
      const state = session.coordinator.state();
      if (state.lifecycle === 'complete') {
        workerFinishedRef.current = true;
        terminalLabelRef.current = 'Run finished. Adjust the route and run again.';
      } else if (state.lifecycle === 'fault') {
        const lastFault = state.events[state.events.length - 1];
        const reason = lastFault && lastFault.type === 'runFault' ? lastFault.reasonKey : 'run fault';
        workerFinishedRef.current = true;
        terminalLabelRef.current = `Run stopped: ${reason}.`;
      } else if (state.lifecycle === 'cancelled') {
        workerFinishedRef.current = true;
        terminalLabelRef.current = 'Run cancelled.';
      }
    },
    [],
  );

  useEffect(() => () => stopSession(), [stopSession]);

  const handleRun = useCallback(
    (source: string) => {
      stopSession();
      setEvents([]);
      setQueuedEvents([]);
      setSimulation(initialState);
      setIsRunning(true);
      workerFinishedRef.current = false;
      terminalLabelRef.current = null;
      setRunStateLabel(`Loading ${agentName}'s safe mission runner…`);

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
        mission: MISSION as MissionPackageSchema,
        capabilities,
        initialState,
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
      setRunStateLabel(`Running ${agentName}'s route…`);
    },
    [agentName, capabilities, handleWorkerMessage, initialState, stopSession],
  );

  const movementState = isRunning
    ? deriveAnimationState(events, simulation).movementState
    : 'idle';

  return (
    <section className="game-screen" aria-labelledby="mission-title">
      <div className="playground">
        <SceneView
          className="starter-scene-view"
          events={events}
          mission={MISSION}
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
        mission={MISSION}
        isRunning={isRunning}
        runStateLabel={runStateLabel}
        onRun={handleRun}
      />
    </section>
  );
}
