import { useState } from 'react';

import type { MissionPackageSchema } from '@codequest/domain';

export interface MissionWorkspaceProps {
  readonly mission: MissionPackageSchema;
  readonly isRunning: boolean;
  readonly runStateLabel: string;
  readonly onRun: (source: string) => void;
}

export function MissionWorkspace({ mission, isRunning, runStateLabel, onRun }: MissionWorkspaceProps) {
  const [source, setSource] = useState(mission.starterCode);

  return (
    <aside className="mission-workspace" aria-labelledby="mission-workspace-title">
      <section className="mission-workspace__briefing" aria-labelledby="how-to-pass-title">
        <p className="eyebrow">Your mission</p>
        <h2 id="how-to-pass-title">How to pass</h2>
        <p>{mission.briefing.storySentence}</p>
        <ol className="mission-steps">
          <li>Write commands that help Nova {mission.briefing.goal.toLowerCase()}</li>
          <li>Use only the tools unlocked for this mission.</li>
          <li>Run your code and adjust it until the goal lights up.</li>
        </ol>
        <div className="mission-tools" aria-label="Tools unlocked for this mission">
          {mission.curriculum.newConcepts.map((concept) => <code key={concept}>{concept}()</code>)}
        </div>
      </section>

      <section className="code-workspace" aria-labelledby="mission-workspace-title">
        <div className="code-workspace__header">
          <div>
            <p className="eyebrow">Control Nova</p>
            <h2 id="mission-workspace-title">Your code</h2>
          </div>
          <button className="text-button" onClick={() => setSource(mission.starterCode)} type="button">Reset</button>
        </div>
        <label className="sr-only" htmlFor={`mission-source-${mission.identity.levelId}`}>
          JavaScript code for {mission.identity.title}
        </label>
        <textarea
          id={`mission-source-${mission.identity.levelId}`}
          onChange={(event) => setSource(event.target.value)}
          spellCheck={false}
          value={source}
        />
        <div className="code-workspace__footer">
          <p>{runStateLabel}</p>
          <button
            className="primary-button"
            disabled={isRunning}
            onClick={() => onRun(source)}
            type="button"
          >
            {isRunning ? 'Running…' : 'Run my code'}
          </button>
        </div>
      </section>
    </aside>
  );
}