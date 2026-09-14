import { describe, expect, it } from 'vitest';

import {
  apiCapabilityRefSchema,
  completionContractSchema,
  hintSchema,
  missionIdentitySchema,
  missionPackageSchema,
  missionRewardSchema,
  syntaxRuleSchema,
  traceRuleSchema,
} from './mission-package';
import {
  collectibleObjectSchema,
  goalObjectSchema,
  missionObjectSchema,
  spawnObjectSchema,
} from './mission-objects';
import {
  commandAppliedEventSchema,
  commandRejectedEventSchema,
  gameCommandSchema,
  runFaultSchema,
  runLifecycleStateSchema,
} from './commands';
import {
  avatarStateSchema,
  collectedSetSchema,
  simulationStateSchema,
} from './cells';
import {
  apiVersionSchema,
  assetIdSchema,
  hintIdSchema,
  levelIdSchema,
  localeCodeSchema,
  rewardIdSchema,
  runIdSchema,
  zoneIdSchema,
} from './ids-schemas';

describe('ids-schemas', () => {
  it('accepts well-formed identifiers', () => {
    expect(levelIdSchema.safeParse('m01').success).toBe(true);
    expect(zoneIdSchema.safeParse('grove').success).toBe(true);
    expect(apiVersionSchema.safeParse('v1').success).toBe(true);
    expect(assetIdSchema.safeParse('crate-01').success).toBe(true);
    expect(hintIdSchema.safeParse('h1').success).toBe(true);
    expect(rewardIdSchema.safeParse('badge-first-step').success).toBe(true);
    expect(runIdSchema.safeParse('run-2025-01-01T00:00:00Z').success).toBe(true);
  });

  it('rejects empty ids', () => {
    expect(levelIdSchema.safeParse('').success).toBe(false);
  });

  it('rejects ids with whitespace', () => {
    expect(levelIdSchema.safeParse('m 01').success).toBe(false);
  });

  it('accepts standard locale codes and rejects others', () => {
    expect(localeCodeSchema.safeParse('en-US').success).toBe(true);
    expect(localeCodeSchema.safeParse('fr-FR').success).toBe(true);
    expect(localeCodeSchema.safeParse('en-us').success).toBe(false);
    expect(localeCodeSchema.safeParse('EN-US').success).toBe(false);
  });
});

describe('cells', () => {
  it('round-trips a simulation state', () => {
    const result = simulationStateSchema.safeParse({
      avatar: { cellX: 0, cellZ: 0, facing: 'north' },
      collected: [],
      inventory: {},
      flags: {},
      stepCount: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown facing', () => {
    const result = avatarStateSchema.safeParse({
      cellX: 0,
      cellZ: 0,
      facing: 'up',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative stepCount', () => {
    const result = simulationStateSchema.safeParse({
      avatar: { cellX: 0, cellZ: 0, facing: 'north' },
      collected: [],
      inventory: {},
      flags: {},
      stepCount: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-array collected', () => {
    expect(collectedSetSchema.safeParse({}).success).toBe(false);
  });
});

describe('commands + events', () => {
  it('accepts every command kind', () => {
    const kinds: Array<ReturnType<typeof gameCommandSchema.parse>['kind']> = [
      'moveForward',
      'turnLeft',
      'turnRight',
      'collect',
      'interact',
    ];
    for (const kind of kinds) {
      const result = gameCommandSchema.safeParse({
        commandId: 'c1',
        kind,
        sourceLine: 1,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects unknown command kind', () => {
    expect(
      gameCommandSchema.safeParse({
        commandId: 'c1',
        kind: 'teleport',
        sourceLine: 1,
      }).success,
    ).toBe(false);
  });

  it('accepts runLifecycleState enums', () => {
    for (const state of [
      'idle',
      'booting',
      'running',
      'paused',
      'stepping',
      'complete',
      'fault',
      'cancelled',
    ] as const) {
      expect(runLifecycleStateSchema.safeParse(state).success).toBe(true);
    }
  });

  it('discriminates run events', () => {
    expect(
      commandAppliedEventSchema.safeParse({
        type: 'commandApplied',
        commandId: 'c1',
        sourceLine: 1,
        command: {
          commandId: 'c1',
          kind: 'moveForward',
          sourceLine: 1,
        },
        before: {},
        after: {},
        reasonKey: 'moved.forward',
      }).success,
    ).toBe(true);

    expect(
      commandRejectedEventSchema.safeParse({
        type: 'commandRejected',
        commandId: 'c1',
        sourceLine: 1,
        kind: 'moveForward',
        reasonKey: 'blocked.forward',
      }).success,
    ).toBe(true);

    expect(
      runFaultSchema.safeParse({
        type: 'runFault',
        code: 'timeout',
        reasonKey: 'run.timeout',
      }).success,
    ).toBe(true);
  });
});

describe('mission objects', () => {
  it('requires a kind literal match', () => {
    expect(
      spawnObjectSchema.safeParse({
        id: 'spawn-1',
        label: 'start',
        kind: 'spawn',
        cell: { cellX: 0, cellZ: 0 },
        facing: 'north',
      }).success,
    ).toBe(true);

    expect(
      goalObjectSchema.safeParse({
        id: 'goal-1',
        label: 'finish',
        kind: 'goal',
        cell: { cellX: 1, cellZ: 1 },
        successConditions: ['reached'],
      }).success,
    ).toBe(true);
  });

  it('rejects mismatched kind vs shape', () => {
    const result = missionObjectSchema.safeParse({
      id: 'obj-1',
      label: 'broken',
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      successConditions: ['whoops'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts collectible objects', () => {
    const result = collectibleObjectSchema.safeParse({
      id: 'col-1',
      label: 'gem',
      kind: 'collectible',
      cell: { cellX: 2, cellZ: 2 },
      collectionEffect: 'sparkle',
    });
    expect(result.success).toBe(true);
  });
});

describe('mission package building blocks', () => {
  it('validates missionIdentityShape', () => {
    const result = missionIdentitySchema.safeParse({
      levelId: 'm01',
      zoneId: 'grove',
      apiVersion: 'v1',
      contentVersion: '2025.01',
      ordinal: 1,
      title: 'First Steps',
      isCheckpoint: false,
      prerequisiteLevelIds: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects ordinal zero', () => {
    const result = missionIdentitySchema.safeParse({
      levelId: 'm01',
      zoneId: 'grove',
      apiVersion: 'v1',
      contentVersion: '2025.01',
      ordinal: 0,
      title: 'First Steps',
      isCheckpoint: false,
      prerequisiteLevelIds: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts apiCapabilityRefSchema', () => {
    expect(
      apiCapabilityRefSchema.safeParse({
        capabilityId: 'cap-move',
        unlockedFromMissionId: 'm01',
        apiVersion: 'v1',
      }).success,
    ).toBe(true);
  });

  it('rejects completionContract with no invariants', () => {
    expect(
      completionContractSchema.safeParse({
        stateInvariants: [],
      }).success,
    ).toBe(false);
  });

  it('treats concept evidence as a union of syntax and trace rules', () => {
    expect(
      syntaxRuleSchema.safeParse({
        ruleKey: 'r.for',
        kind: 'forLoop',
        threshold: 1,
      }).success,
    ).toBe(true);

    expect(
      traceRuleSchema.safeParse({
        ruleKey: 'r.walk',
        expectedSequence: ['moveForward', 'moveForward'],
      }).success,
    ).toBe(true);
  });

  it('constrains hint stage', () => {
    expect(
      hintSchema.safeParse({
        hintId: 'h1',
        stage: 5,
        prompt: 'too far',
      }).success,
    ).toBe(false);
    expect(
      hintSchema.safeParse({
        hintId: 'h1',
        stage: 1,
        prompt: 'start by moving',
      }).success,
    ).toBe(true);
  });

  it('validates missionRewardSchema defaults', () => {
    const result = missionRewardSchema.safeParse({
      rewardId: 'reward-1',
      assetId: 'badge',
      label: 'First Step',
    });
    expect(result.success).toBe(true);
  });
});

const baseMission = {
  identity: {
    levelId: 'm01',
    zoneId: 'grove',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 1,
    title: 'First Steps',
    isCheckpoint: false,
    prerequisiteLevelIds: [],
  },
  zoneId: 'grove',
  curriculum: {
    primaryConcept: 'sequence',
    newConcepts: [],
    priorConcepts: [],
  },
  startState: {
    avatar: { cellX: 0, cellZ: 0, facing: 'north' },
    collected: [],
    inventory: {},
    flags: {},
    stepCount: 0,
  },
  objects: [
    {
      id: 'spawn-1',
      label: 'start',
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'north',
    },
    {
      id: 'goal-1',
      label: 'finish',
      kind: 'goal',
      cell: { cellX: 1, cellZ: 0 },
      successConditions: ['reached'],
    },
  ],
  allowedApi: [
    {
      capabilityId: 'cap-move',
      unlockedFromMissionId: 'm01',
      apiVersion: 'v1',
    },
  ],
  briefing: {
    storySentence: 'Walk one step east to wake the gatekeeper.',
    goal: 'Reach the goal cell.',
    requiredCount: 1,
    optionalCount: 0,
    newConcepts: [],
    priorConcepts: [],
    controls: ['move forward', 'turn left', 'turn right'],
    checklist: ['tap run'],
  },
  starterCode: "moveForward();\n",
  hints: [
    { hintId: 'h1', stage: 1, prompt: 'Try moveForward.' },
    { hintId: 'h2', stage: 2, prompt: 'Facing matters.', reveal: 'east' },
    { hintId: 'h3', stage: 3, prompt: 'Use moveForward() once.', scaffold: 'moveForward' },
    { hintId: 'h4', stage: 4, prompt: 'Solution shown.', reveal: 'moveForward();' },
  ],
  analogousExample: {
    title: 'Reach the checkpoint',
    problem: 'Walk to the marker',
    source: 'demo/analog',
    note: 'Pair this with the goal story.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1'],
    requiredFlags: {},
    requiredCollected: [],
  },
  conceptEvidence: [
    {
      ruleKey: 'r.moveOnce',
      kind: 'functionCalledWithArgs',
      threshold: 1,
    },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-1',
      source: 'demo/sol-1',
      expectedCommandCount: 1,
      expectedStepCount: 1,
    },
  ],
  expectedFailures: [],
  accessibility: {
    keyboard: 'Arrow keys move and turn.',
    reducedMotion: 'No screen shake.',
    screenReader: 'Speaks tile actions.',
  },
  budgets: {
    maxCommands: 4,
    maxStepCount: 8,
    estimatedActiveMinutes: 4,
  },
  rewards: [
    {
      rewardId: 'reward-first',
      assetId: 'badge-step',
      label: 'First Step',
    },
  ],
};

describe('missionPackageSchema', () => {
  it('accepts a fully populated mission', () => {
    expect(missionPackageSchema.safeParse(baseMission).success).toBe(true);
  });

  it('rejects fewer than four hints', () => {
    const result = missionPackageSchema.safeParse({
      ...baseMission,
      hints: [
        { hintId: 'h1', stage: 1, prompt: 'one' },
        { hintId: 'h2', stage: 2, prompt: 'two' },
        { hintId: 'h3', stage: 3, prompt: 'three' },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a mission with no objects', () => {
    const result = missionPackageSchema.safeParse({
      ...baseMission,
      objects: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a mission with no allowed API calls', () => {
    const result = missionPackageSchema.safeParse({
      ...baseMission,
      allowedApi: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a mission with no known solutions', () => {
    const result = missionPackageSchema.safeParse({
      ...baseMission,
      knownSolutions: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a briefing without controls', () => {
    const result = missionPackageSchema.safeParse({
      ...baseMission,
      briefing: {
        ...baseMission.briefing,
        controls: [],
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects budgets over 15 minutes', () => {
    const result = missionPackageSchema.safeParse({
      ...baseMission,
      budgets: {
        ...baseMission.budgets,
        estimatedActiveMinutes: 30,
      },
    });
    expect(result.success).toBe(false);
  });
});
