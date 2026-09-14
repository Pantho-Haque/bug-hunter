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
import { SceneView, inferTierFromHints, type AvatarPresentation } from '@codequest/renderer';
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

export function MissionPreview({
  avatarPresentation,
  hasReducedEffects,
  qualityPreference,
  onReturnToMap,
}: MissionPreviewProps) {
  const initialState = useMemo<SimulationStateSchema>(
    () => createInitialState(MISSION.startState.avatar),
    [],
  );
  const [simulation, setSimulation] = useState<SimulationStateSchema>(initialState);
  const [events, setEvents] = useState<readonly RunEventSchema[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runStateLabel, setRunStateLabel] = useState(
    'Write your route now. Running it will animate Nova in this world once the safe mission runner is connected.',
  );
  const sessionRef = useRef<RunSession | null>(null);
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
  }, []);

  const handleWorkerMessage = useCallback(
    (message: WorkerToHostSchema) => {
      const session = sessionRef.current;
      if (!session) return;
      const next = session.coordinator.onWorkerMessage(message);
      if (next.length > 0) {
        setEvents((current) => [...current, ...next]);
      }
      const state = session.coordinator.state();
      const lastApplied = [...state.events].reverse().find((event) => event.type === 'commandApplied');
      if (lastApplied && lastApplied.type === 'commandApplied') {
        const after = lastApplied.after;
        if (after && typeof after === 'object' && 'avatar' in after && 'stepCount' in after) {
          setSimulation(after as SimulationStateSchema);
        }
      }
      if (state.lifecycle === 'complete') {
        setIsRunning(false);
        setRunStateLabel('Run finished. Adjust the route and run again.');
      } else if (state.lifecycle === 'fault') {
        setIsRunning(false);
        const lastFault = state.events[state.events.length - 1];
        const reason = lastFault && lastFault.type === 'runFault' ? lastFault.reasonKey : 'run fault';
        setRunStateLabel(`Run stopped: ${reason}.`);
      } else if (state.lifecycle === 'cancelled') {
        setIsRunning(false);
        setRunStateLabel('Run cancelled.');
      }
    },
    [],
  );

  useEffect(() => () => stopSession(), [stopSession]);

  const handleRun = useCallback(
    (source: string) => {
      stopSession();
      setEvents([]);
      setSimulation(initialState);
      setIsRunning(true);
      setRunStateLabel('Loading the safe mission runner…');

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
      setRunStateLabel('Running your route…');
    },
    [capabilities, handleWorkerMessage, initialState, stopSession],
  );

  return (
    <section className="game-screen" aria-labelledby="mission-title">
      <div className="playground">
        <div className="mission-bar">
          <div>
            <p className="eyebrow">Mission 01 · Meadow of Moves</p>
            <h1 id="mission-title">Reach the street beacon</h1>
            <p className="mission-copy">Preview the third-person route that code will control.</p>
          </div>
          <button className="text-button" onClick={onReturnToMap} type="button">Map</button>
        </div>

        <SceneView
          className="starter-scene-view"
          events={events}
          mission={MISSION}
          movementState="idle"
          presentation={avatarPresentation}
          quality={quality}
          reducedEffects={hasReducedEffects}
          state={simulation}
        />
        <section className="scene-description" aria-labelledby="scene-goal-title">
          <p className="eyebrow">Mission goal</p>
          <h2 id="scene-goal-title">{MISSION.briefing.goal}</h2>
          <p>{MISSION.briefing.readAloud} Write a route, then run your program to finish this level.</p>
        </section>
      </div>
      <MissionWorkspace
        mission={MISSION}
        isRunning={isRunning}
        runStateLabel={runStateLabel}
        onRun={handleRun}
      />
    </section>
  );
}