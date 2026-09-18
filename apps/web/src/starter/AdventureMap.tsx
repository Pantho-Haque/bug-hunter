import { useState } from 'react';

import { contentRegistry } from '@codequest/content';
import { zoneId as toZoneId } from '@codequest/domain';

interface AdventureMapProps {
  onPlay: (levelId: string) => void;
  completedLevelIds: readonly string[];
  unlockedRewardIds: readonly string[];
}

interface MissionRow {
  readonly title: string;
  readonly task: string;
  readonly levelId: string;
  readonly number: number;
  readonly state: 'done' | 'ready' | 'locked';
}

/** Rows come from the mission registry, so the map can never promise or hide a mission the content package disagrees with. */
const zoneRows = (registryZoneId: string, completedLevelIds: readonly string[]): MissionRow[] =>
  contentRegistry.listMissionsByZone(toZoneId(registryZoneId)).map((mission) => {
    const id = mission.identity.levelId;
    const unlocked = mission.identity.prerequisiteLevelIds.every((prerequisite) =>
      completedLevelIds.includes(prerequisite),
    );
    return {
      title: mission.identity.title,
      task: mission.briefing.goal,
      levelId: id,
      number: Number.parseInt(id.slice(1), 10),
      state: completedLevelIds.includes(id) ? 'done' : unlocked ? 'ready' : 'locked',
    };
  });

interface Zone {
  concept: string;
  id: string;
  /** The content registry's zone id. */
  registryZoneId: string;
  name: string;
  number: number;
  story: string;
}

const zones: Zone[] = [
  {
    concept: 'Sequences · turns · interactions',
    id: 'meadow',
    registryZoneId: 'meadow-of-moves',
    name: 'Meadow of Moves',
    number: 1,
    story: 'Wake the street beacons and learn how each command changes Nova’s route.',
  },
  {
    concept: 'Functions · parameters · reuse',
    id: 'forest',
    registryZoneId: 'echo-forest',
    name: 'Echo Forest',
    number: 2,
    story: 'Name useful paths and reuse them to guide fireflies through the forest.',
  },
  {
    concept: 'For loops · while loops · patterns',
    id: 'lagoon',
    registryZoneId: 'loop-lagoon',
    name: 'Loop Lagoon',
    number: 3,
    story: 'Repair docks and tide machines by turning repeated actions into loops.',
  },
  {
    concept: 'Booleans · if/else · variables',
    id: 'cliffs',
    registryZoneId: 'logic-cliffs',
    name: 'Logic Cliffs',
    number: 4,
    story: 'Read the world, make safe choices, and open a route across the cliffs.',
  },
  {
    concept: 'Arrays · debugging · planning',
    id: 'observatory',
    registryZoneId: 'maker-observatory',
    name: 'Maker Observatory',
    number: 5,
    story: 'Combine everything you learned to launch the restored observatory.',
  },
];

export function AdventureMap({ onPlay, completedLevelIds, unlockedRewardIds }: AdventureMapProps) {
  // Open on the zone that holds the next playable mission: that is where the
  // child left off, and it is the answer to "where am I?"
  const [selectedZoneId, setSelectedZoneId] = useState(() => {
    const next = zones.find((zone) =>
      zoneRows(zone.registryZoneId, completedLevelIds).some((row) => row.state === 'ready'),
    );
    return next?.id ?? 'meadow';
  });
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? zones[0];
  // A zone becomes playable the moment the registry ships missions for it, so
  // the map can never promise or hide a mission the content package disagrees with.
  const rows = zoneRows(selectedZone.registryZoneId, completedLevelIds);
  const nextMission = zones
    .flatMap((zone) => zoneRows(zone.registryZoneId, completedLevelIds))
    .find((row) => row.state === 'ready');
  const nextZone = zones.find((zone) =>
    zoneRows(zone.registryZoneId, completedLevelIds).some((row) => row.state === 'ready'),
  );
  const totalMissions = contentRegistry.missions.size;
  const collection = contentRegistry
    .listMissionsByZone(toZoneId(selectedZone.registryZoneId))
    .flatMap((mission) => mission.rewards);

  return (
    <section className="world-map-screen" aria-labelledby="map-title">
      <header className="map-intro">
        <div>
          <p className="eyebrow">Choose your next coding adventure</p>
          <h1 id="map-title">The Spark Isles</h1>
        </div>
        <section className="map-tracker" aria-label="Where you are">
          {nextMission ? (
            <>
              <p className="map-tracker__where">
                <span aria-hidden="true">📍</span> You are in <strong>{nextZone?.name}</strong>
                {' · '}{completedLevelIds.length} of {totalMissions} missions done
              </p>
              <p className="map-tracker__next">Next up: <strong>{nextMission.title}</strong> — {nextMission.task}</p>
              <button className="primary-button" onClick={() => onPlay(nextMission.levelId)} type="button">
                Play Mission {nextMission.number}: {nextMission.title} <span aria-hidden="true">→</span>
              </button>
            </>
          ) : (
            <p className="map-tracker__where"><span aria-hidden="true">🏆</span> All {totalMissions} missions done. Replay any of them from a region.</p>
          )}
        </section>
      </header>

      <div className="map-layout">
        <div className="map-stage" role="group" aria-label="Interactive map of the five Spark Isles regions">

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
            // A pointer-only target: the zone marker is the accessible control.
            <button
              aria-hidden="true"
              className={`map-hit-region map-hit-region--${zone.id}`}
              key={`region-${zone.id}`}
              onClick={() => setSelectedZoneId(zone.id)}
              tabIndex={-1}
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
              {nextZone?.id === zone.id ? <span className="zone-marker__here">You are here</span> : null}
              <span className="zone-marker__landmark" aria-hidden="true" />
              <strong>{zone.name}</strong>
              <small>{zone.concept}</small>
            </button>
          ))}

          <div className="map-compass" aria-hidden="true"><b>N</b><span>✦</span></div>
        </div>

        <aside className={`zone-dossier zone-dossier--${selectedZone.id}`}>
          <p className="sr-only" role="status">Showing Zone {selectedZone.number}: {selectedZone.name}</p>
          <div className="zone-dossier__heading">
            <span className="zone-number">Zone {selectedZone.number}</span>
            <span className="zone-status">{rows.every((row) => row.state === 'done') ? 'Complete' : 'Playable'}</span>
          </div>
          <h2>{selectedZone.name}</h2>
          <p>{selectedZone.story}</p>
          <div className="concept-ribbon"><span>JavaScript focus</span><strong>{selectedZone.concept}</strong></div>
          <ol className="mission-list">
            {rows.map((mission) => {
              const number = String(mission.number).padStart(2, '0');
              return (
                <li className={mission.state === 'ready' ? 'mission-list__ready' : ''} key={mission.levelId}>
                  {mission.state !== 'locked' ? (
                    <button
                      aria-label={`Play Mission ${number}: ${mission.title}`}
                      className="mission-list__play"
                      onClick={() => onPlay(mission.levelId)}
                      type="button"
                    >
                      <span>{number}</span>
                      <div><strong>{mission.title}</strong><span className="mission-task">{mission.task}</span></div>
                      <small>{mission.state === 'done' ? 'Replay ✓' : 'Play'} <span aria-hidden="true">→</span></small>
                    </button>
                  ) : (
                    <div className="mission-list__planned">
                      <span>{number}</span>
                      <div><strong>{mission.title}</strong><span className="mission-task">{mission.task}</span></div>
                      <small>Finish Mission {mission.number - 1} first</small>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <section className="collection" aria-labelledby="collection-title">
              <h3 id="collection-title">
                Your collection · {unlockedRewardIds.length} of {collection.length}
              </h3>
              <ul className="collection__list">
                {collection.map((reward) => {
                  const earned = unlockedRewardIds.includes(reward.rewardId);
                  return (
                    <li
                      className={earned ? 'collection__item collection__item--earned' : 'collection__item'}
                      key={reward.rewardId}
                    >
                      <span aria-hidden="true">{earned ? '★' : '☆'}</span>
                      <strong>{earned ? reward.label : 'Not found yet'}</strong>
                      <small>{earned ? 'Earned' : 'Finish the mission to unlock'}</small>
                    </li>
                  );
                })}
              </ul>
            </section>
        </aside>
      </div>
    </section>
  );
}
