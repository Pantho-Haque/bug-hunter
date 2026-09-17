import { describe, expect, it } from 'vitest';

import {
  contentRegistry,
  listAllMissions,
  validateContentRegistry,
} from '@codequest/content';
import { levelId, type MissionPackageSchema } from '@codequest/domain';
import {
  replayCommands,
  validateMissionObjectives,
  type CommandInput,
} from '@codequest/simulation';

/**
 * The canonical route for every shipped mission, written the way a child would.
 * Two guarantees, both of which must survive new zones:
 *   1. every route still reaches its goal, so a layout change cannot silently
 *      make a mission unwinnable;
 *   2. every mission in the registry HAS a route here, so a new mission cannot
 *      ship without a proven solution.
 */
const CANONICAL_ROUTES: Readonly<
  Record<string, readonly CommandInput['kind'][]>
> = {
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
  // Echo Forest: the child writes the function, so the route below is what the
  // calls expand to. m07 is crossBridge() twice, m08/m09 are one function
  // called twice, m10 is a shared two-step prefix with different endings, m11
  // is walk(2)/walk(4)/walk(1), m12 is rescueFirefly() three times plus a step.
  m07: [
    'moveForward',
    'moveForward',
    'moveForward',
    'moveForward',
    'moveForward',
    'moveForward',
  ],
  m08: [
    'moveForward',
    'moveForward',
    'interact',
    'turnRight',
    'moveForward',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
  ],
  m09: [
    'moveForward',
    'interact',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
    'moveForward',
  ],
  m10: [
    'moveForward',
    'moveForward',
    'turnLeft',
    'moveForward',
    'collect',
    'turnRight',
    'turnRight',
    'moveForward',
    'turnLeft',
    'moveForward',
    'moveForward',
    'turnRight',
    'moveForward',
    'collect',
    'turnRight',
    'turnRight',
    'moveForward',
    'turnRight',
    'moveForward',
    'moveForward',
    'collect',
    'moveForward',
  ],
  m11: [
    'moveForward',
    'moveForward',
    'collect',
    'moveForward',
    'moveForward',
    'moveForward',
    'moveForward',
    'collect',
    'moveForward',
  ],
  m12: [
    'moveForward',
    'interact',
    'moveForward',
    'turnRight',
    'moveForward',
    'interact',
    'moveForward',
    'turnRight',
    'moveForward',
    'interact',
    'moveForward',
    'turnRight',
    'moveForward',
  ],
  m13: [
    'moveForward',
    'moveForward',
    'moveForward',
    'moveForward',
    'collect',
  ],
  m14: [
    'moveForward',
    'interact',
    'moveForward',
    'interact',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
  ],
  m15: [
    'moveForward',
    'moveForward',
    'interact',
    'turnRight',
    'moveForward',
    'moveForward',
    'interact',
    'turnRight',
    'moveForward',
    'moveForward',
    'interact',
    'turnRight',
    'moveForward',
    'moveForward',
    'interact',
    'turnRight',
    'moveForward',
    'turnRight',
    'moveForward',
    'collect',
  ],
  m16: [
    'moveForward',
    'moveForward',
    'moveForward',
    'moveForward',
    'moveForward',
    'turnLeft',
    'interact',
  ],
  m17: [
    'moveForward',
    'collect',
    'moveForward',
    'moveForward',
    'collect',
    'moveForward',
    'moveForward',
    'collect',
    'moveForward',
  ],
  m18: [
    'moveForward',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
    'moveForward',
  ],
  m19: [
    'turnLeft',
    'moveForward',
    'turnRight',
    'moveForward',
    'moveForward',
    'collect',
    'moveForward',
    'moveForward',
    'turnRight',
    'moveForward',
  ],
  m20: [
    'moveForward',
    'moveForward',
    'turnLeft',
    'moveForward',
    'moveForward',
  ],
  m21: [
    'moveForward',
    'collect',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
    'moveForward',
    'moveForward',
  ],
  m22: [
    'moveForward',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
  ],
  m23: [
    'moveForward',
    'collect',
    'moveForward',
    'moveForward',
    'collect',
    'turnLeft',
    'moveForward',
    'moveForward',
    'collect',
    'interact',
    'moveForward',
    'moveForward',
    'moveForward',
  ],
  m24: [
    'turnLeft',
    'moveForward',
    'turnRight',
    'moveForward',
    'moveForward',
    'moveForward',
    'turnRight',
    'moveForward',
    'collect',
    'turnLeft',
    'moveForward',
    'collect',
    'moveForward',
    'collect',
    'interact',
    'moveForward',
    'moveForward',
    'moveForward',
  ],
  m25: [
    'interact',
    'moveForward',
    'interact',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
  ],
  m26: [
    'moveForward',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
    'moveForward',
    'interact',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
  ],
  m27: [
    'moveForward',
    'moveForward',
    'turnRight',
    'moveForward',
    'moveForward',
    'moveForward',
  ],
  m28: [
    'interact',
    'moveForward',
    'interact',
    'moveForward',
    'interact',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
  ],
  m29: [
    'moveForward',
    'collect',
    'moveForward',
    'turnRight',
    'moveForward',
    'collect',
    'turnLeft',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
    'moveForward',
    'turnLeft',
    'moveForward',
  ],
  m30: [
    'moveForward',
    'collect',
    'moveForward',
    'moveForward',
    'collect',
    'moveForward',
    'moveForward',
    'turnRight',
    'collect',
    'moveForward',
    'moveForward',
    'turnLeft',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
    'interact',
    'moveForward',
    'moveForward',
    'moveForward',
  ],
};

const toCommands = (kinds: readonly CommandInput['kind'][]): CommandInput[] =>
  kinds.map((kind, index) => ({
    commandId: `c-${index}`,
    sourceLine: index + 1,
    kind,
  }));

const meadow = (): readonly MissionPackageSchema[] =>
  listAllMissions().filter(
    (mission) => mission.identity.zoneId === 'meadow-of-moves',
  );

describe('shipped mission catalogue', () => {
  it('passes whole-catalogue validation', () => {
    expect(validateContentRegistry(listAllMissions()).issues).toEqual([]);
  });

  it('proves a canonical route for every mission it ships', () => {
    const missing = listAllMissions()
      .map((mission) => mission.identity.levelId)
      .filter((id) => CANONICAL_ROUTES[id] === undefined);
    // Adding a mission without adding its route here is content debt: the
    // mission would ship with nobody having proved it can be finished.
    expect(missing).toEqual([]);
  });

  it('registers the Meadow missions in ordinal order', () => {
    const ordinals = meadow().map((mission) => mission.identity.ordinal);
    expect(ordinals).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it.each(listAllMissions().map((mission) => mission.identity.levelId))(
    '%s is solvable by its canonical route',
    (id) => {
      const mission = contentRegistry.getMission(levelId(id));
      expect(mission).toBeDefined();
      if (!mission) return;

      const result = replayCommands(mission, toCommands(CANONICAL_ROUTES[id]));
      expect(result.rejectedCount).toBe(0);

      const objectives = validateMissionObjectives(mission, result.finalState);
      expect(objectives.issues).toEqual([]);
      expect(objectives.ok).toBe(true);
    },
  );

  it.each(Object.keys(CANONICAL_ROUTES))(
    '%s canonical route fits the mission command budget',
    (id) => {
      const mission = contentRegistry.getMission(levelId(id));
      if (!mission) throw new Error(`missing mission ${id}`);
      expect(CANONICAL_ROUTES[id].length).toBeLessThanOrEqual(
        mission.budgets.maxCommands,
      );
    },
  );

  it('unlocks each mission from the one before it', () => {
    const missions = meadow();
    for (let i = 1; i < missions.length; i += 1) {
      expect(missions[i].identity.prerequisiteLevelIds).toEqual([
        missions[i - 1].identity.levelId,
      ]);
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
      'cap-everything': [
        'moveForward',
        'turnLeft',
        'turnRight',
        'collect',
        'interact',
      ],
    };
    for (const mission of listAllMissions()) {
      const allowed = new Set(
        mission.allowedApi.flatMap(
          (ref) => capabilityCommands[ref.capabilityId] ?? [],
        ),
      );
      for (const kind of CANONICAL_ROUTES[mission.identity.levelId]) {
        expect(allowed.has(kind)).toBe(true);
      }
    }
  });
});
