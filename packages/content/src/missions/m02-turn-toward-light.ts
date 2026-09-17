import type { MissionPackageSchema } from '@codequest/domain';

/**
 * L-shaped garden path: two cells north, then one cell east.
 * The hedge makes the straight-ahead guess fail out loud, so the lesson is
 * "movement depends on facing" rather than "count the steps".
 */
export const m02TurnTowardLight: MissionPackageSchema = {
  identity: {
    levelId: 'm02',
    zoneId: 'meadow-of-moves',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 2,
    title: 'Turn Toward Light',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m01'],
  },
  zoneId: 'meadow-of-moves',
  curriculum: {
    primaryConcept: 'sequence',
    newConcepts: ['turnRight'],
    priorConcepts: ['moveForward'],
    transferPrompt: 'Which command changes the way you face without moving a cell?',
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
      label: 'Garden gate',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'north',
    },
    {
      id: 'goal-1',
      label: 'Beacon',
      required: true,
      kind: 'goal',
      cell: { cellX: 1, cellZ: -2 },
      successConditions: ['avatarAtGoal'],
    },
    {
      id: 'hedge-1',
      label: 'Tall hedge',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 0, cellZ: -3 }],
      reasonKey: 'hedge.blocks',
    },
    {
      id: 'decor-grass-1',
      label: 'Tuft of grass',
      required: false,
      kind: 'decor',
      cells: [{ cellX: 2, cellZ: -1 }],
      assetId: 'asset.grass.tuft',
      interactive: false,
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-forward', unlockedFromMissionId: 'm01', apiVersion: 'v1' },
    { capabilityId: 'cap-turn', unlockedFromMissionId: 'm02', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'The beacon sits around the corner of the garden path. Walk north, then turn toward the light.',
    goal: 'Reach the beacon around the corner.',
    requiredCount: 1,
    optionalCount: 0,
    newConcepts: ['turnRight'],
    priorConcepts: ['moveForward'],
    controls: ['move forward', 'turn right'],
    checklist: ['Walk to the corner.', 'Turn before you walk again.'],
    readAloud: 'Walk two steps north, turn right, then walk one step east.',
    locale: 'en-US',
  },
  starterCode: 'moveForward();\nmoveForward();\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Run your code and watch where the avatar stops.',
      reveal: 'The beacon is not straight ahead, so walking further will not reach it.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'turnRight() changes the way you face. It does not move you a cell.',
      scaffold: 'turnRight();',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Walk to the corner first, then turn, then walk again.',
      scaffold: 'moveForward();\nmoveForward();\nturnRight();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Solution shown below.',
      reveal: 'moveForward();\nmoveForward();\nturnRight();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'Turning at the end of the hall',
    problem: 'Walk to the end of a hallway, then turn into the doorway on your right.',
    source: 'examples/hallway-corner',
    note: 'Say the turn out loud before the step, so the pivot reads as its own action.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1'],
    requiredFlags: {},
    requiredCollected: [],
    terminalCell: { cellX: 1, cellZ: -2 },
    reflectionQuestion: 'What happens if you turn right before you walk at all?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'moveForward', 'turnRight', 'moveForward'],
    },
    { ruleKey: 'rule.turnUsed', kind: 'functionCalledWithArgs', threshold: 1 },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m02-corner',
      source: 'demo/m02-corner.js',
      expectedCommandCount: 4,
      expectedStepCount: 4,
      notes: 'Two north steps, one right turn, one east step.',
    },
    {
      solutionId: 'sol-m02-turn-first',
      source: 'demo/m02-turn-first.js',
      expectedCommandCount: 5,
      expectedStepCount: 5,
      notes: 'Turns right, steps east, turns left, steps north twice; same goal cell.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m02-no-turn',
      source: 'tests/m02/no-turn.js',
      expectedFault: 'wrongFacing',
      reasonKey: 'goal-not-reached',
      notes: 'Starter code walks north only and stops one cell west of the beacon.',
    },
    {
      fixtureId: 'fixture-m02-hedge',
      source: 'tests/m02/hedge.js',
      expectedFault: 'blockedMove',
      reasonKey: 'hedge.blocks',
      notes: 'Three north steps walk into the hedge.',
    },
    {
      fixtureId: 'fixture-m02-extra-turn',
      source: 'tests/m02/extra-turn.js',
      expectedFault: 'wrongFacing',
      reasonKey: 'goal-not-reached',
      notes: 'Two turns face the avatar south and the route leaves the garden.',
    },
  ],
  accessibility: {
    keyboard: 'ArrowUp moves forward; ArrowRight turns right in place.',
    touch: 'Tap the turn button once per 90 degree pivot.',
    captions: 'Caption strip names the new compass direction after every turn.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Pivot snaps instead of sweeping under reduced motion.',
    screenReader: 'Turns announce "now facing east" with the cell coordinates.',
  },
  budgets: {
    maxCommands: 8,
    maxStepCount: 12,
    maxMissionObjects: 6,
    maxTriangles: 8000,
    estimatedActiveMinutes: 4,
  },
  rewards: [
    { rewardId: 'reward-compass', assetId: 'asset.badge.compass', label: 'Compass', cosmetic: true },
  ],
};
