import { describe, expect, it } from 'vitest';

import { contentRegistry, listAllMissions } from '@codequest/content';
import { levelId, type MissionPackageSchema } from '@codequest/domain';
import {
  replayCommands,
  validateMissionObjectives,
  type CommandInput,
} from '@codequest/simulation';

/**
 * The canonical route for every Meadow mission, written the way a child would.
 * If a mission layout drifts, the route stops reaching the goal and this fails
 * before anyone plays it.
 */
const CANONICAL_ROUTES: Readonly<Record<string, readonly CommandInput['kind'][]>> = {
  m01: ['moveForward', 'moveForward', 'moveForward'],
  m02: ['moveForward', 'moveForward', 'turnRight', 'moveForward'],
  m03: ['moveForward', 'moveForward', 'collect', 'moveForward'],
  m04: ['interact', 'moveForward', 'moveForward', 'moveForward'],
  m05: [
    'turnLeft',
    'moveForward',
    'turnRight',
    'moveForward',
    'collect',
    'moveForward',
    'collect',
    'moveForward',
  ],
  m06: [
    'interact',
    'moveForward',
    'moveForward',
    'collect',
    'interact',
    'moveForward',
    'moveForward',
    'moveForward',
  ],
};

const toCommands = (kinds: readonly CommandInput['kind'][]): CommandInput[] =>
  kinds.map((kind, index) => ({ commandId: `c-${index}`, sourceLine: index + 1, kind }));

const meadow = (): readonly MissionPackageSchema[] =>
  listAllMissions().filter((mission) => mission.identity.zoneId === 'meadow-of-moves');

describe('Meadow of Moves M01–M06', () => {
  it('registers six missions in ordinal order', () => {
    const ordinals = meadow().map((mission) => mission.identity.ordinal);
    expect(ordinals).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it.each(Object.keys(CANONICAL_ROUTES))('%s is solvable by its canonical route', (id) => {
    const mission = contentRegistry.getMission(levelId(id));
    expect(mission).toBeDefined();
    if (!mission) return;

    const result = replayCommands(mission, toCommands(CANONICAL_ROUTES[id]));
    expect(result.rejectedCount).toBe(0);

    const objectives = validateMissionObjectives(mission, result.finalState);
    expect(objectives.issues).toEqual([]);
    expect(objectives.ok).toBe(true);
  });

  it.each(Object.keys(CANONICAL_ROUTES))('%s canonical route fits the mission command budget', (id) => {
    const mission = contentRegistry.getMission(levelId(id));
    if (!mission) throw new Error(`missing mission ${id}`);
    expect(CANONICAL_ROUTES[id].length).toBeLessThanOrEqual(mission.budgets.maxCommands);
  });

  it('unlocks each mission from the one before it', () => {
    const missions = meadow();
    for (let i = 1; i < missions.length; i += 1) {
      expect(missions[i].identity.prerequisiteLevelIds).toEqual([missions[i - 1].identity.levelId]);
    }
    expect(missions[0].identity.prerequisiteLevelIds).toEqual([]);
  });

  it('only asks for commands the mission actually unlocks', () => {
    const capabilityCommands: Readonly<Record<string, readonly string[]>> = {
      'cap-move-forward': ['moveForward'],
      'cap-turn': ['turnLeft', 'turnRight'],
      'cap-collect': ['collect'],
      'cap-interact': ['interact'],
      'cap-move-and-turn': ['moveForward', 'turnLeft', 'turnRight'],
      'cap-everything': ['moveForward', 'turnLeft', 'turnRight', 'collect', 'interact'],
    };
    for (const mission of meadow()) {
      const allowed = new Set(
        mission.allowedApi.flatMap((ref) => capabilityCommands[ref.capabilityId] ?? []),
      );
      for (const kind of CANONICAL_ROUTES[mission.identity.levelId]) {
        expect(allowed.has(kind)).toBe(true);
      }
    }
  });
});
