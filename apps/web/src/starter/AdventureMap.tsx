import { useState } from 'react';

interface AdventureMapProps {
  onPlay: () => void;
}

interface Zone {
  concept: string;
  id: string;
  missions: { task: string; title: string }[];
  name: string;
  number: number;
  story: string;
}

const zones: Zone[] = [
  {
    concept: 'Sequences · turns · interactions',
    id: 'meadow',
    missions: [
      { task: 'Walk three tiles to the beacon.', title: 'First Steps' },
      { task: 'Turn onto an L-shaped garden path.', title: 'Turn Toward Light' },
      { task: 'Reach and collect a glowing seed pod.', title: 'Treasure at Your Feet' },
      { task: 'Pull a lever before crossing the gate.', title: 'The Gate Lever' },
      { task: 'Choose a safe route and gather sparks.', title: 'Short Safe Route' },
      { task: 'Wake two sprites in the correct order.', title: 'Meadow Checkpoint' },
    ],
    name: 'Meadow of Moves',
    number: 1,
    story: 'Wake the street beacons and learn how each command changes Nova’s route.',
  },
  {
    concept: 'Functions · parameters · reuse',
    id: 'forest',
    missions: [
      { task: 'Turn a repeated path into a function.', title: 'Name the Trail' },
      { task: 'Reuse one route to wake two lights.', title: 'Two Sleeping Fireflies' },
      { task: 'Ring two bells with reusable code.', title: 'Function Door' },
      { task: 'Share a path, then change each ending.', title: 'Pack a Path' },
      { task: 'Send different distances as parameters.', title: 'Give It a Number' },
      { task: 'Rescue three fireflies around a tree.', title: 'Echo Checkpoint' },
    ],
    name: 'Echo Forest',
    number: 2,
    story: 'Name useful paths and reuse them to guide fireflies through the forest.',
  },
  {
    concept: 'For loops · while loops · patterns',
    id: 'lagoon',
    missions: [
      { task: 'Repeat four steps to reach the shell.', title: 'Tidal Steps' },
      { task: 'Move and light three ocean buoys.', title: 'Light the Buoys' },
      { task: 'Loop around every side of the dock.', title: 'Square Dock' },
      { task: 'Keep moving only while the path is safe.', title: 'Stop at the Reef' },
      { task: 'Collect pearls on alternating tiles.', title: 'Alternate Pearls' },
      { task: 'Repeat a pattern to repair the tide wheel.', title: 'Lagoon Checkpoint' },
    ],
    name: 'Loop Lagoon',
    number: 3,
    story: 'Repair docks and tide machines by turning repeated actions into loops.',
  },
  {
    concept: 'Booleans · if/else · variables',
    id: 'cliffs',
    missions: [
      { task: 'Check the wind before choosing a bridge.', title: 'The Wind Flag' },
      { task: 'Follow either direction shown by a sign.', title: 'Fork in the Path' },
      { task: 'Collect a lantern only when needed.', title: 'Lantern Check' },
      { task: 'Repair broken bridges and pass safe ones.', title: 'Repair or Pass' },
      { task: 'Track three crystals with a variable.', title: 'Count the Crystals' },
      { task: 'Solve flags, light, and a crystal gate.', title: 'Cliffs Checkpoint' },
    ],
    name: 'Logic Cliffs',
    number: 4,
    story: 'Read the world, make safe choices, and open a route across the cliffs.',
  },
  {
    concept: 'Arrays · debugging · planning',
    id: 'observatory',
    missions: [
      { task: 'Activate color pads in array order.', title: 'Star List' },
      { task: 'Deliver samples to every listed station.', title: 'Deliver the Samples' },
      { task: 'Repair a wrong turn using the trace.', title: 'Find the Bug' },
      { task: 'Fix a loop that stops one step early.', title: 'Fix the Loop' },
      { task: 'Plan a route through a mixed rescue arena.', title: 'Plan the Rescue' },
      { task: 'Power and launch the star observatory.', title: 'CodeQuest Finale' },
    ],
    name: 'Maker Observatory',
    number: 5,
    story: 'Combine everything you learned to launch the restored observatory.',
  },
];

export function AdventureMap({ onPlay }: AdventureMapProps) {
  const [selectedZoneId, setSelectedZoneId] = useState('meadow');
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? zones[0];

  return (
    <section className="world-map-screen" aria-labelledby="map-title">
      <header className="map-intro">
        <div>
          <p className="eyebrow">Choose your next coding adventure</p>
          <h1 id="map-title">The Spark Isles</h1>
        </div>
        <p>Thirty missions connect one living world. Select a region to see what Nova will learn and accomplish there.</p>
      </header>

      <div className="map-layout">
        <div className="map-stage" aria-label="Interactive map of the five Spark Isles regions">
          <div className="map-stage__hud">
            <span><i className="map-key map-key--ready" /> Playable starter</span>
            <span><i className="map-key map-key--planned" /> Planned mission</span>
          </div>

          <svg aria-hidden="true" className="map-terrain" viewBox="0 0 1000 650">
            <defs>
              <linearGradient id="ocean" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#123c68" />
                <stop offset=".55" stopColor="#0a284d" />
                <stop offset="1" stopColor="#071b39" />
              </linearGradient>
              <linearGradient id="meadowLand" x1="0" x2="0" y1="0" y2="1">
                <stop stopColor="#b7e66f" />
                <stop offset="1" stopColor="#4c9c55" />
              </linearGradient>
              <linearGradient id="forestLand" x1="0" x2="1" y1="0" y2="1">
                <stop stopColor="#57b67b" />
                <stop offset="1" stopColor="#1d664f" />
              </linearGradient>
              <linearGradient id="lagoonLand" x1="0" x2="0" y1="0" y2="1">
                <stop stopColor="#5ed4d0" />
                <stop offset="1" stopColor="#3182a9" />
              </linearGradient>
              <linearGradient id="cliffLand" x1="0" x2="1" y1="0" y2="1">
                <stop stopColor="#f0b15e" />
                <stop offset="1" stopColor="#9b5a4e" />
              </linearGradient>
              <linearGradient id="starLand" x1="0" x2="1" y1="0" y2="1">
                <stop stopColor="#b794ea" />
                <stop offset="1" stopColor="#6647a5" />
              </linearGradient>
              <filter id="islandShadow" x="-30%" y="-30%" width="160%" height="180%">
                <feDropShadow dx="0" dy="16" floodColor="#020b1d" floodOpacity=".65" stdDeviation="13" />
              </filter>
              <pattern id="waves" height="32" patternUnits="userSpaceOnUse" width="64">
                <path d="M0 18 Q16 5 32 18 T64 18" fill="none" opacity=".13" stroke="#c8eeff" strokeWidth="3" />
              </pattern>
            </defs>
            <rect fill="url(#ocean)" height="650" rx="34" width="1000" />
            <rect fill="url(#waves)" height="650" rx="34" width="1000" />
            <path className="map-route" d="M195 475 C260 390 285 330 390 325 S535 415 600 360 S685 185 788 170 S850 280 825 400" />

            <g filter="url(#islandShadow)">
              <path d="M72 505 L98 424 L164 378 L250 392 L296 452 L270 532 L195 564 L112 548 Z" fill="#285f45" />
              <path d="M72 489 L98 408 L164 362 L250 376 L296 436 L270 516 L195 548 L112 532 Z" fill="url(#meadowLand)" />
              <path d="M287 346 L310 266 L378 220 L458 242 L500 306 L467 373 L385 399 L320 380 Z" fill="#164b3f" />
              <path d="M287 330 L310 250 L378 204 L458 226 L500 290 L467 357 L385 383 L320 364 Z" fill="url(#forestLand)" />
              <path d="M506 478 L530 390 L600 351 L688 369 L728 434 L690 504 L610 535 L544 516 Z" fill="#205d75" />
              <path d="M506 462 L530 374 L600 335 L688 353 L728 418 L690 488 L610 519 L544 500 Z" fill="url(#lagoonLand)" />
              <path d="M715 514 L744 421 L814 377 L906 395 L947 463 L918 538 L837 574 L760 554 Z" fill="#754443" />
              <path d="M715 498 L744 405 L814 361 L906 379 L947 447 L918 522 L837 558 L760 538 Z" fill="url(#cliffLand)" />
              <path d="M664 250 L694 135 L764 76 L856 102 L904 170 L870 257 L786 294 L708 278 Z" fill="#493779" />
              <path d="M664 234 L694 119 L764 60 L856 86 L904 154 L870 241 L786 278 L708 262 Z" fill="url(#starLand)" />
            </g>

            <g className="map-details" fill="none" strokeLinecap="round">
              <path d="M112 462 C156 430 211 435 260 463" stroke="#f6e7a0" strokeWidth="12" />
              <path d="M326 310 C365 271 419 267 467 300" stroke="#9ad59e" strokeWidth="8" />
              <path d="M550 432 Q610 389 684 426" stroke="#c4f8f0" strokeDasharray="9 14" strokeWidth="8" />
              <path d="M770 474 L809 426 L895 458" stroke="#f9d68d" strokeWidth="10" />
              <circle cx="790" cy="162" fill="#efe2ff" r="54" stroke="#4b377f" strokeWidth="8" />
              <path d="M790 110 V214 M738 162 H842 M754 126 L826 198 M826 126 L754 198" stroke="#8a68c2" strokeWidth="6" />
            </g>
          </svg>

          {zones.map((zone) => (
            <button
              aria-label={`Explore ${zone.name}`}
              aria-pressed={selectedZone.id === zone.id}
              className={`map-hit-region map-hit-region--${zone.id}`}
              key={`region-${zone.id}`}
              onClick={() => setSelectedZoneId(zone.id)}
              type="button"
            />
          ))}

          {zones.map((zone) => (
            <button
              aria-label={`${zone.name}: ${zone.concept}`}
              aria-pressed={selectedZone.id === zone.id}
              className={`zone-marker zone-marker--${zone.id}`}
              key={zone.id}
              onClick={() => setSelectedZoneId(zone.id)}
              type="button"
            >
              <span className="zone-marker__number">{zone.number}</span>
              <span className="zone-marker__landmark" aria-hidden="true" />
              <strong>{zone.name}</strong>
              <small>{zone.concept}</small>
            </button>
          ))}

          <div className="map-compass" aria-hidden="true"><b>N</b><span>✦</span></div>
        </div>

        <aside className={`zone-dossier zone-dossier--${selectedZone.id}`} aria-live="polite">
          <div className="zone-dossier__heading">
            <span className="zone-number">Zone {selectedZone.number}</span>
            <span className="zone-status">{selectedZone.id === 'meadow' ? 'Starter playable' : 'World plan'}</span>
          </div>
          <h2>{selectedZone.name}</h2>
          <p>{selectedZone.story}</p>
          <div className="concept-ribbon"><span>JavaScript focus</span><strong>{selectedZone.concept}</strong></div>
          <ol className="mission-list">
            {selectedZone.missions.map((mission, index) => (
              <li className={selectedZone.id === 'meadow' && index === 0 ? 'mission-list__ready' : ''} key={mission.title}>
                {selectedZone.id === 'meadow' && index === 0 ? (
                  <button aria-label={`Play Mission 01: ${mission.title}`} className="mission-list__play" onClick={onPlay} type="button">
                    <span>{String((selectedZone.number - 1) * 6 + index + 1).padStart(2, '0')}</span>
                    <div><strong>{mission.title}</strong><span className="mission-task">{mission.task}</span></div>
                    <small>Play <span aria-hidden="true">→</span></small>
                  </button>
                ) : (
                  <div className="mission-list__planned">
                    <span>{String((selectedZone.number - 1) * 6 + index + 1).padStart(2, '0')}</span>
                    <div><strong>{mission.title}</strong><span className="mission-task">{mission.task}</span></div>
                    <small>Planned</small>
                  </div>
                )}
              </li>
            ))}
          </ol>
          <button className="primary-button map-play-button" onClick={onPlay} type="button">
            Play Mission 01 · First Steps <span aria-hidden="true">→</span>
          </button>
          {selectedZone.id !== 'meadow' && <p className="map-note">This preliminary map previews the full journey. Mission 01 is the current playable 3D starter.</p>}
        </aside>
      </div>
    </section>
  );
}
