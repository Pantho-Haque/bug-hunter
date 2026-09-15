import { useState } from 'react';

import type { MissionPackageSchema } from '@codequest/domain';
import type { AvatarPresentation } from '@codequest/renderer';

import { MissionCodeEditor } from './MissionCodeEditor';

export interface MissionWorkspaceProps {
  readonly avatarPresentation: AvatarPresentation;
  readonly mission: MissionPackageSchema;
  readonly isRunning: boolean;
  readonly runStateLabel: string;
  readonly onRun: (source: string) => void;
}

export function MissionWorkspace({ avatarPresentation, mission, isRunning, runStateLabel, onRun }: MissionWorkspaceProps) {
  const [source, setSource] = useState(mission.starterCode);
  const agentName = avatarPresentation === 'girl' ? 'Nova' : 'Kai';

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
          {mission.curriculum.newConcepts.map((concept) => <code key={concept}>{concept}()</code>)}
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
          commands={mission.curriculum.newConcepts}
          label={`JavaScript code editor for ${mission.identity.title}`}
          onChange={setSource}
          source={source}
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
