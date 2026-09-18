import { useEffect, useState } from 'react';

import type { FaultPresentation } from '@codequest/code-runner';
import type { MissionPackageSchema, RunEventSchema, RunFaultSchema } from '@codequest/domain';
import type { RunOutcome } from '@codequest/editor';
import { newLevelCode, type SaveStore } from '@codequest/persistence';
import type { AvatarPresentation } from '@codequest/renderer';

import { MissionCodeEditor } from './MissionCodeEditor';
import type { RunPhase } from './MissionPreview';

export interface MissionWorkspaceProps {
  readonly avatarPresentation: AvatarPresentation;
  /** Every command this mission unlocks, not just the newly taught one. */
  readonly commands: readonly string[];
  /** Questions this mission unlocks. They return a value and change nothing. */
  readonly predicates: readonly string[];
  readonly mission: MissionPackageSchema;
  readonly events: readonly RunEventSchema[];
  readonly fault: RunFaultSchema | null;
  readonly faultCopy: FaultPresentation | null;
  readonly outcome: RunOutcome | null;
  readonly runPhase: RunPhase;
  /** False while the sandboxed runner is still booting. */
  readonly isRunnerReady: boolean;
  readonly store: SaveStore;
  readonly nextMissionTitle?: string;
  readonly onNextMission?: () => void;
  readonly onReturnToMap: () => void;
  readonly onRun: (source: string) => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onStep: () => void;
  readonly onResetScene: () => void;
}

const runStateLabel = (phase: RunPhase, agentName: string, isRunnerReady: boolean): string => {
  switch (phase) {
    case 'idle':
      return isRunnerReady
        ? 'Write your route, then press Run.'
        : 'Getting the code runner ready. You can start writing now.';
    case 'running':
      return `Running ${agentName}'s route…`;
    case 'paused':
      return 'Paused. Press Step to take one command.';
    case 'done':
      return 'Run finished.';
  }
};

/** Reason keys are engine vocabulary; the trace should read like a sentence. */
const REASON_COPY: Readonly<Record<string, string>> = {
  'moved.forward': 'took one step',
  'turned.left': 'turned left',
  'turned.right': 'turned right',
  'collect.picked-up': 'picked it up',
  'interact.applied': 'used it',
  'collect.nothing-here': 'found nothing to pick up',
  'collect.already-collected': 'had already picked that up',
  'interact.nothing-here': 'found nothing to use',
  'interact.wrong-facing': 'was not facing it',
  'interact.out-of-range': 'was too far away',
};

const describeReason = (reasonKey: string): string =>
  REASON_COPY[reasonKey] ??
  (/block|closed|wall|dark|broken|gust|dim|reef|water|pond|hedge|rail/.test(reasonKey)
    ? 'was stopped — something was in the way'
    : reasonKey.replace(/[.-]/g, ' '));

const traceLine = (event: RunEventSchema, agentName: string): string | null => {
  if (event.type === 'runFault') return null;
  const kind = event.type === 'commandApplied' ? event.command.kind : event.kind;
  // instrumentCommandSourceLines emits 1-based authored lines already.
  return `Line ${event.sourceLine}: ${kind}() — ${agentName} ${describeReason(event.reasonKey)}`;
};

export function MissionWorkspace({
  avatarPresentation,
  commands,
  predicates,
  mission,
  events,
  fault,
  faultCopy,
  isRunnerReady,
  nextMissionTitle,
  onNextMission,
  onReturnToMap,
  outcome,
  runPhase,
  store,
  onRun,
  onPause,
  onResume,
  onStep,
  onResetScene,
}: MissionWorkspaceProps) {
  const [source, setSource] = useState(
    () =>
      store.readLevelCode(mission.identity.levelId, mission.identity.apiVersion, ['v1'])
        ?.source ?? mission.starterCode,
  );
  const [hintStage, setHintStage] = useState(0);
  // "Start code over" is one click from losing everything typed, so the
  // previous source is kept until the child either undoes or types again.
  const [undoSource, setUndoSource] = useState<string | null>(null);
  const [traceOpen, setTraceOpen] = useState(true);
  const agentName = avatarPresentation === 'girl' ? 'Nova' : 'Kai';
  const isPlaying = runPhase === 'running' || runPhase === 'paused';
  const runBlocked = isPlaying || !isRunnerReady;
  const revealedHints = mission.hints.slice(0, hintStage);
  const missionNumber = Number.parseInt(mission.identity.levelId.slice(1), 10);
  const canUndoReset = undoSource !== null && source === mission.starterCode;

  useEffect(() => {
    // A full or blocked quota must never stop a child from coding, so a failed
    // draft save is reported by the store and otherwise ignored here.
    store.writeLevelCode(
      newLevelCode(mission.identity.levelId, mission.identity.apiVersion, source),
    );
  }, [mission, source, store]);

  return (
    <aside className="mission-workspace" aria-labelledby="mission-title">
      <section className="mission-workspace__briefing" aria-labelledby="mission-title">
        <p className="eyebrow">Mission {missionNumber}</p>
        <h1 id="mission-title">{mission.identity.title}</h1>
        <p className="mission-workspace__goal"><strong>Goal:</strong> {mission.briefing.goal}</p>
        <p className="mission-workspace__story">{mission.briefing.storySentence}</p>
        <details className="mission-help">
          <summary>How to pass</summary>
          <ol className="mission-steps">
            <li>Write commands that help {agentName} {mission.briefing.goal.toLowerCase()}</li>
            <li>Use only the tools unlocked for this mission.</li>
            <li>Run your code and adjust it until the goal lights up.</li>
          </ol>
        </details>
        <div className="mission-tools" role="group" aria-label="Tools unlocked for this mission" translate="no">
          {commands.map((command) => (
            <code
              className={mission.curriculum.newConcepts.includes(command) ? 'mission-tools__new' : undefined}
              key={command}
            >
              {command}()
            </code>
          ))}
          {predicates.map((predicate) => (
            <code
              className={
                mission.curriculum.newConcepts.includes(predicate)
                  ? 'mission-tools__new mission-tools__ask'
                  : 'mission-tools__ask'
              }
              key={predicate}
            >
              {predicate}()
            </code>
          ))}
        </div>
        {predicates.length > 0 ? (
          <p className="mission-tools__note">The blue tools ask the world a question and answer yes or no.</p>
        ) : null}
      </section>

      <section className="code-workspace" aria-labelledby="mission-workspace-title">
        <div className="code-workspace__header">
          <div>
            <p className="eyebrow">Control {agentName}</p>
            <h2 id="mission-workspace-title">Your code</h2>
            <p className="code-workspace__prompt">Write JavaScript to guide {agentName} through this mission.</p>
          </div>
          {canUndoReset ? (
            <button
              className="reset-code-button"
              onClick={() => {
                setSource(undoSource ?? mission.starterCode);
                setUndoSource(null);
              }}
              type="button"
            >
              <span aria-hidden="true">↶</span> Undo start over
            </button>
          ) : (
            <button
              className="reset-code-button"
              onClick={() => {
                setUndoSource(source);
                setSource(mission.starterCode);
              }}
              type="button"
            >
              <span aria-hidden="true">↺</span> Start code over
            </button>
          )}
        </div>
        <MissionCodeEditor
          commands={commands}
          predicates={predicates}
          label={`JavaScript code editor for ${mission.identity.title}`}
          onChange={setSource}
          source={source}
        />

        <div className="code-workspace__footer">
          <p aria-live="polite">{runStateLabel(runPhase, agentName, isRunnerReady)}</p>
          <div className="run-controls">
            {/* One toggle that stays mounted, so keyboard focus survives the press. */}
            {isPlaying ? (
              <button
                className="secondary-button"
                onClick={runPhase === 'running' ? onPause : onResume}
                type="button"
              >
                <span aria-hidden="true">{runPhase === 'running' ? '⏸' : '▶'}</span>{' '}
                {runPhase === 'running' ? 'Pause' : 'Resume'}
              </button>
            ) : null}
            {runPhase === 'paused' ? (
              <button className="secondary-button" onClick={onStep} type="button">
                <span aria-hidden="true">⤼</span> Step
              </button>
            ) : null}
            {runPhase === 'idle' ? null : (
              <button className="secondary-button" onClick={onResetScene} type="button">
                <span aria-hidden="true">↺</span> Put the world back
              </button>
            )}
            <button
              aria-disabled={runBlocked}
              className="primary-button"
              onClick={() => {
                if (!runBlocked) onRun(source);
              }}
              type="button"
            >
              {runPhase === 'running'
                ? 'Running…'
                : runPhase === 'paused'
                  ? 'Paused'
                  : !isRunnerReady
                    ? 'Getting ready…'
                    : runPhase === 'done'
                      ? 'Run again'
                      : 'Run my code'}
            </button>
          </div>
        </div>

        {outcome ? (
          <div className={`run-outcome run-outcome--${outcome.status}`} role="status">
            {outcome.status === 'success' ? (
              <div aria-hidden="true" className="run-outcome__confetti">
                {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ ['--i' as string]: i }} />)}
              </div>
            ) : null}
            <p className="run-outcome__headline">
              {outcome.status === 'success' ? (
                <>
                  <span aria-hidden="true">🎉</span> Well done, {agentName} made it!
                </>
              ) : (
                outcome.headline
              )}
            </p>
            <p>{outcome.detail}</p>
            {outcome.status === 'success' && mission.rewards.length > 0 ? (
              <p className="run-outcome__reward">
                <span aria-hidden="true">★</span> You earned{' '}
                {mission.rewards.map((reward) => reward.label).join(', ')}.
              </p>
            ) : null}
            {outcome.status === 'success' ? (
              <p className="run-outcome__reflection">{mission.completion.reflectionQuestion}</p>
            ) : null}
            {outcome.status === 'success' ? (
              <div className="run-outcome__actions">
                {nextMissionTitle && onNextMission ? (
                  <button className="primary-button" onClick={onNextMission} type="button">
                    Next mission: {nextMissionTitle} <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <p className="run-outcome__finale">You finished every mission. You are a coder now.</p>
                )}
                <button className="secondary-button" onClick={onReturnToMap} type="button">
                  Back to the map
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {fault && faultCopy ? (
          <div className="run-outcome run-outcome--fault" role="status">
            <p className="run-outcome__headline">{faultCopy.childCopy}</p>
            {fault.sourceLine === undefined ? null : <p>Check line {fault.sourceLine}.</p>}
          </div>
        ) : null}

        {mission.hints.length > 0 ? (
          <div className="mission-hints">
            {hintStage < mission.hints.length ? (
              <button
                className="secondary-button"
                onClick={() => setHintStage((stage) => stage + 1)}
                type="button"
              >
                <span aria-hidden="true">💡</span> {hintStage === 0 ? 'Need a hint?' : 'Another hint'}
              </button>
            ) : (
              <p className="mission-hints__done">That's every hint. You've got this.</p>
            )}
            <ol className="mission-hints__list">
              {revealedHints.map((hint) => (
                <li key={hint.hintId}>
                  <p>{hint.prompt}</p>
                  {hint.scaffold ?? hint.reveal ? (
                    <pre translate="no"><code>{hint.scaffold ?? hint.reveal}</code></pre>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {events.length === 0 ? null : (
          // Never closed by code: the trace matters most after a run ends.
          <details
            className="mission-trace"
            onToggle={(event) => setTraceOpen(event.currentTarget.open)}
            open={traceOpen}
          >
            <summary>What {agentName} did ({events.length})</summary>
            <ol className="mission-trace__list">
              {events.map((event, index) => {
                const line = traceLine(event, agentName);
                return line === null ? null : <li key={`${index}-${line}`}>{line}</li>;
              })}
            </ol>
          </details>
        )}
      </section>
    </aside>
  );
}
