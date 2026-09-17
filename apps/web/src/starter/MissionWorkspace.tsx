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
  readonly mission: MissionPackageSchema;
  readonly events: readonly RunEventSchema[];
  readonly fault: RunFaultSchema | null;
  readonly faultCopy: FaultPresentation | null;
  readonly outcome: RunOutcome | null;
  readonly runPhase: RunPhase;
  /** False while the sandboxed runner is still booting. */
  readonly isRunnerReady: boolean;
  readonly store: SaveStore;
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

const traceLine = (event: RunEventSchema): string | null => {
  if (event.type === 'runFault') return null;
  const kind = event.type === 'commandApplied' ? event.command.kind : event.kind;
  // instrumentCommandSourceLines emits 1-based authored lines already.
  return `Line ${event.sourceLine} · ${kind}() · ${event.reasonKey.replace(/[.-]/g, ' ')}`;
};

export function MissionWorkspace({
  avatarPresentation,
  commands,
  mission,
  events,
  fault,
  faultCopy,
  isRunnerReady,
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
      store.readLevelCode(mission.identity.levelId, mission.identity.apiVersion)?.source ??
      mission.starterCode,
  );
  const [hintStage, setHintStage] = useState(0);
  const agentName = avatarPresentation === 'girl' ? 'Nova' : 'Kai';
  const isPlaying = runPhase === 'running' || runPhase === 'paused';
  const revealedHints = mission.hints.slice(0, hintStage);

  useEffect(() => {
    // A full or blocked quota must never stop a child from coding, so a failed
    // draft save is reported by the store and otherwise ignored here.
    store.writeLevelCode(
      newLevelCode(mission.identity.levelId, mission.identity.apiVersion, source),
    );
  }, [mission, source, store]);

  return (
    <aside className="mission-workspace" aria-labelledby="mission-workspace-title">
      <section className="mission-workspace__briefing" aria-labelledby="mission-title">
        <p className="eyebrow">Your mission · {mission.identity.levelId}</p>
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
        <div className="mission-tools" aria-label="Tools unlocked for this mission">
          {commands.map((command) => (
            <code
              className={mission.curriculum.newConcepts.includes(command) ? 'mission-tools__new' : undefined}
              key={command}
            >
              {command}()
            </code>
          ))}
        </div>
      </section>

      <section className="code-workspace" aria-labelledby="mission-workspace-title">
        <div className="code-workspace__header">
          <div>
            <p className="eyebrow">Control {agentName}</p>
            <h2 id="mission-workspace-title">Your code</h2>
            <p className="code-workspace__prompt">Write JavaScript to guide {agentName} through this mission.</p>
          </div>
          <button className="reset-code-button" onClick={() => setSource(mission.starterCode)} type="button">↺ Reset code</button>
        </div>
        <MissionCodeEditor
          commands={commands}
          label={`JavaScript code editor for ${mission.identity.title}`}
          onChange={setSource}
          source={source}
        />

        <div className="code-workspace__footer">
          <p aria-live="polite">{runStateLabel(runPhase, agentName, isRunnerReady)}</p>
          <div className="run-controls">
            {runPhase === 'running' ? (
              <button className="secondary-button" onClick={onPause} type="button">⏸ Pause</button>
            ) : null}
            {runPhase === 'paused' ? (
              <>
                <button className="secondary-button" onClick={onResume} type="button">▶ Resume</button>
                <button className="secondary-button" onClick={onStep} type="button">⤼ Step</button>
              </>
            ) : null}
            {runPhase === 'idle' ? null : (
              <button className="secondary-button" onClick={onResetScene} type="button">↺ Reset scene</button>
            )}
            {runPhase === 'paused' ? null : (
              // While paused the primary action is Resume, so a disabled
              // "Running…" button would only compete with it.
              <button
                className="primary-button"
                disabled={runPhase === 'running' || !isRunnerReady}
                onClick={() => onRun(source)}
                type="button"
              >
                {runPhase === 'running'
                  ? 'Running…'
                  : !isRunnerReady
                    ? 'Getting ready…'
                    : runPhase === 'done'
                      ? 'Run again'
                      : 'Run my code'}
              </button>
            )}
          </div>
        </div>

        {outcome ? (
          <div className={`run-outcome run-outcome--${outcome.status}`} role="status">
            <p className="run-outcome__headline">{outcome.headline}</p>
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
          </div>
        ) : null}

        {fault && faultCopy ? (
          <div className="run-outcome run-outcome--fault" role="status">
            <p className="run-outcome__headline">{faultCopy.childCopy}</p>
            {fault.sourceLine === undefined ? null : <p>Check line {fault.sourceLine}.</p>}
          </div>
        ) : null}

        <div className="mission-hints">
          <button
            className="secondary-button"
            disabled={hintStage >= mission.hints.length}
            onClick={() => setHintStage((stage) => stage + 1)}
            type="button"
          >
            {hintStage === 0 ? '💡 Need a hint?' : '💡 Another hint'}
          </button>
          <ol className="mission-hints__list">
            {revealedHints.map((hint) => (
              <li key={hint.hintId}>
                <p>{hint.prompt}</p>
                {hint.scaffold ?? hint.reveal ? <pre><code>{hint.scaffold ?? hint.reveal}</code></pre> : null}
              </li>
            ))}
          </ol>
        </div>

        {events.length === 0 ? null : (
          <details className="mission-trace" open={isPlaying}>
            <summary>What {agentName} did ({events.length})</summary>
            <ol className="mission-trace__list">
              {events.map((event, index) => {
                const line = traceLine(event);
                return line === null ? null : <li key={`${index}-${line}`}>{line}</li>;
              })}
            </ol>
          </details>
        )}
      </section>
    </aside>
  );
}
