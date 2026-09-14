import { lazy, Suspense, useCallback, useState } from 'react';

import { AdventureMap } from './AdventureMap';
import type { AvatarPresentation, ManualDirection } from './ThirdPersonWorld';

const ThirdPersonWorld = lazy(() =>
  import('./ThirdPersonWorld').then((module) => ({ default: module.ThirdPersonWorld })),
);

const PhaseTwoLab = import.meta.env.DEV
  ? lazy(() =>
      import('./phase-two/PhaseTwoLab').then((module) => ({ default: module.PhaseTwoLab })),
    )
  : null;

const starterCode = `// Guide Nova along the street to the beacon.
moveForward();
moveForward();
moveForward();`;

export function App() {
  if (PhaseTwoLab && window.location.pathname === '/spikes/phase-2') {
    return (
      <Suspense fallback={<div className="scene-loading">Loading Phase 2 evidence lab…</div>}>
        <PhaseTwoLab />
      </Suspense>
    );
  }

  return <StarterApp />;
}

function StarterApp() {
  const [avatarPresentation, setAvatarPresentation] = useState<AvatarPresentation>('girl');
  const [code, setCode] = useState(starterCode);
  const [commandCount, setCommandCount] = useState(3);
  const [hasReducedEffects, setHasReducedEffects] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [manualMove, setManualMove] = useState<{ direction: ManualDirection; id: number }>({
    direction: 'forward',
    id: 0,
  });
  const [runId, setRunId] = useState(0);
  const [runMessage, setRunMessage] = useState(
    'Explore with WASD, arrow keys, or the direction pad. Preview movement cannot finish the mission.',
  );
  const [showMap, setShowMap] = useState(true);

  function handleRun() {
    const commands = code
      .split('\n')
      .filter((line) => /^\s*moveForward\s*\(\s*\)\s*;?\s*$/.test(line));
    setCommandCount(commands.length);
    setIsRunning(true);
    setRunMessage(`Nova is following ${commands.length} move command${commands.length === 1 ? '' : 's'}…`);
    setRunId((value) => value + 1);
  }

  const handleProgramComplete = useCallback((reachedGoal: boolean) => {
    setIsRunning(false);
    setRunMessage(
      reachedGoal
        ? 'Goal reached by code: three commands moved Nova onto the beacon.'
        : 'The run stopped away from the beacon. Change the number of move commands and try again.',
    );
  }, []);

  function nudgeAvatar(direction: ManualDirection) {
    setRunMessage('Exploring manually. Run the code to test the mission route.');
    setManualMove((move) => ({ direction, id: move.id + 1 }));
  }

  function showWorldMap() {
    setIsRunning(false);
    setShowMap(true);
  }

  return (
    <div className={hasReducedEffects ? 'app quiet-mode' : 'app'}>
      <a className="skip-link" href="#main-content">Skip to game</a>
      <header className="topbar">
        <button className="brand" onClick={showWorldMap} type="button">
          <span aria-hidden="true">✦</span> CodeQuest 3D
        </button>
        <div className="topbar-actions">
          <button
            aria-pressed={hasReducedEffects}
            className="text-button"
            onClick={() => setHasReducedEffects((value) => !value)}
            type="button"
          >
            {hasReducedEffects ? 'Restore effects' : 'Reduce effects'}
          </button>
          <span className="avatar-button">
            {avatarPresentation === 'girl' ? 'Girl' : 'Boy'} preset
          </span>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {showMap ? (
          <AdventureMap onPlay={() => setShowMap(false)} />
        ) : (
          <section className="game-screen" aria-labelledby="mission-title">
            <div className="playground">
              <div className="mission-bar">
                <div>
                  <p className="eyebrow">Mission 01 · Meadow of Moves</p>
                  <h1 id="mission-title">Reach the street beacon</h1>
                  <p className="mission-copy">Explore the route, then use exactly three move commands.</p>
                </div>
                <button className="text-button" onClick={showWorldMap} type="button">Map</button>
              </div>

              <fieldset className="avatar-picker">
                <legend>Choose Nova:</legend>
                <button
                  aria-pressed={avatarPresentation === 'boy'}
                  onClick={() => setAvatarPresentation('boy')}
                  type="button"
                >
                  Boy preset
                </button>
                <button
                  aria-pressed={avatarPresentation === 'girl'}
                  onClick={() => setAvatarPresentation('girl')}
                  type="button"
                >
                  Girl preset
                </button>
              </fieldset>

              <section className="scene-shell" aria-labelledby="scene-view-title">
                <h2 className="sr-only" id="scene-view-title">Third-person training street</h2>
                <Suspense fallback={<div className="scene-loading">Building the 3D street…</div>}>
                  <ThirdPersonWorld
                    commandCount={commandCount}
                    manualMove={manualMove}
                    onProgramComplete={handleProgramComplete}
                    presentation={avatarPresentation}
                    reducedEffects={hasReducedEffects}
                    runId={runId}
                  />
                </Suspense>
                <div className="scene-mode"><span aria-hidden="true">🎮</span> Explore preview</div>
                <div className="goal-chip"><span aria-hidden="true">✦</span> Beacon: 3 tiles ahead</div>
                <div className="direction-pad" aria-label="Explore movement controls" role="group">
                  <button aria-label="Move Nova forward" onClick={() => nudgeAvatar('forward')} type="button">↑</button>
                  <button aria-label="Move Nova left" onClick={() => nudgeAvatar('left')} type="button">←</button>
                  <button aria-label="Move Nova backward" onClick={() => nudgeAvatar('backward')} type="button">↓</button>
                  <button aria-label="Move Nova right" onClick={() => nudgeAvatar('right')} type="button">→</button>
                </div>
              </section>

              <p className="scene-description" id="scene-description">
                A low-poly third-person street. Nova starts behind three path tiles and faces a glowing beacon.
              </p>
              <p aria-live="polite" className="run-status">{runMessage}</p>
            </div>

            <aside className="editor-panel" aria-labelledby="editor-title">
              <div className="editor-heading">
                <div>
                  <p className="eyebrow">Your code</p>
                  <h2 id="editor-title">Program Nova’s route</h2>
                </div>
                <span className="save-status">Starter preview</span>
              </div>
              <div className="learning-goal">
                <strong>Code changes the world</strong>
                <span>Each <code>moveForward()</code> crosses one street tile.</span>
              </div>
              <label className="sr-only" htmlFor="code-editor">JavaScript code</label>
              <textarea
                aria-describedby="code-help"
                id="code-editor"
                spellCheck="false"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
              <div className="editor-help" id="code-help">
                Use three <code>moveForward();</code> commands to land on the beacon. This Starter recognizes that command only.
              </div>
              <div className="run-controls">
                <button className="secondary-button" onClick={() => setCode(starterCode)} type="button">Reset code</button>
                <button className="primary-button" disabled={isRunning} onClick={handleRun} type="button">
                  {isRunning ? 'Running route…' : 'Run code in 3D'}
                </button>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}
