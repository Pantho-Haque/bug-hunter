import { useState } from 'react';

const starterCode = `// Guide Nova to the first beacon.\nmoveForward();\nmoveForward();\nmoveForward();`;

export function App() {
  const [code, setCode] = useState(starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [isQuietMode, setIsQuietMode] = useState(false);

  function handleRun() {
    setIsRunning(true);
    window.setTimeout(() => setIsRunning(false), 900);
  }

  return (
    <main className={isQuietMode ? 'app quiet-mode' : 'app'}>
      <header className="topbar">
        <button className="brand" onClick={() => setShowMap(true)} type="button">
          <span aria-hidden="true">✦</span> CodeQuest 3D
        </button>
        <div className="topbar-actions">
          <button className="text-button" onClick={() => setIsQuietMode((value) => !value)} type="button">
            {isQuietMode ? 'Sound on' : 'Quiet mode'}
          </button>
          <button className="avatar-button" aria-label="Open avatar settings" type="button">
            Nova
          </button>
        </div>
      </header>

      {showMap ? (
        <section className="map-screen" aria-labelledby="map-title">
          <div className="map-copy">
            <p className="eyebrow">Your adventure map</p>
            <h1 id="map-title">The Spark Isles</h1>
            <p>Follow the glowing trail. Your first mission teaches your avatar how to move.</p>
            <button className="primary-button" onClick={() => setShowMap(false)} type="button">
              Play Meadow of Moves
            </button>
          </div>
          <div className="map-art" aria-label="Illustrated map showing five adventure islands" role="img">
            <span className="island meadow">1<br />Meadow</span>
            <span className="island forest">2<br />Forest</span>
            <span className="island lagoon">3<br />Lagoon</span>
            <span className="island cliffs">4<br />Cliffs</span>
            <span className="island observatory">5<br />Observatory</span>
          </div>
        </section>
      ) : (
        <section className="game-screen" aria-label="Meadow of Moves level">
          <div className="playground">
            <div className="mission-bar">
              <div>
                <p className="eyebrow">Mission 01 · Meadow of Moves</p>
                <h1>Reach the beacon</h1>
              </div>
              <button className="text-button" onClick={() => setShowMap(true)} type="button">Map</button>
            </div>

            <div className="scene-placeholder" role="img" aria-label="A third-person 3D meadow placeholder with Nova facing a glowing beacon">
              <div className="beacon">✦<span>Beacon</span></div>
              <div className={isRunning ? 'avatar walking' : 'avatar'}>●<span>Nova</span></div>
              <div className="path path-one" />
              <div className="path path-two" />
              <p className="scene-note">3D scene placeholder — the real Three.js scene comes in the vertical slice.</p>
            </div>

            <aside className="mini-map" aria-label="Mini map">
              <span className="mini-avatar">▲</span>
              <span className="mini-beacon">✦</span>
              <strong>Mini map</strong>
            </aside>
          </div>

          <aside className="editor-panel" aria-label="Code editor">
            <div className="editor-heading">
              <div>
                <p className="eyebrow">Your code</p>
                <h2>Tell Nova what to do</h2>
              </div>
              <span className="save-status">Saved on this device</span>
            </div>
            <label className="sr-only" htmlFor="code-editor">JavaScript code</label>
            <textarea id="code-editor" spellCheck="false" value={code} onChange={(event) => setCode(event.target.value)} />
            <div className="editor-help">
              <strong>Try this:</strong> `moveForward();` walks Nova one tile.
            </div>
            <div className="run-controls">
              <button className="secondary-button" onClick={() => setCode(starterCode)} type="button">Reset code</button>
              <button className="primary-button" disabled={isRunning} onClick={handleRun} type="button">
                {isRunning ? 'Running…' : 'Run code'}
              </button>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}
