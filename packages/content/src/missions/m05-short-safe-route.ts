import type { MissionPackageSchema } from '@codequest/domain';

/**
 * The straight line east is a pond. The working route is the lane one cell
 * north, which also carries both required sparks, so "shortest looking" and
 * "actually passable" come apart.
 */
export const m05ShortSafeRoute: MissionPackageSchema = {
  identity: {
    levelId: 'm05',
    zoneId: 'meadow-of-moves',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 5,
    title: 'Short Safe Route',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m04'],
  },
  zoneId: 'meadow-of-moves',
  curriculum: {
    primaryConcept: 'sequence',
    newConcepts: ['turnLeft'],
    priorConcepts: ['moveForward', 'turnRight', 'collect'],
    transferPrompt: 'How do you plan a route when the straight line is blocked?',
  },
  startState: {
    avatar: { cellX: 0, cellZ: 0, facing: 'east' },
    collected: [],
    inventory: {},
    flags: {},
    stepCount: 0,
  },
  objects: [
    {
      id: 'spawn-1',
      label: 'Meadow path',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'pond-1',
      label: 'Shallow pond',
      required: false,
      kind: 'blocker',
      occupiedCells: [
        { cellX: 1, cellZ: 0 },
        { cellX: 2, cellZ: 0 },
      ],
      reasonKey: 'pond.blocks',
    },
    {
      id: 'spark-1',
      label: 'First spark',
      required: true,
      kind: 'collectible',
      cell: { cellX: 1, cellZ: -1 },
      collectionEffect: 'spark',
    },
    {
      id: 'spark-2',
      label: 'Second spark',
      required: true,
      kind: 'collectible',
      cell: { cellX: 2, cellZ: -1 },
      collectionEffect: 'spark',
    },
    {
      id: 'goal-1',
      label: 'Meadow exit',
      required: true,
      kind: 'goal',
      cell: { cellX: 3, cellZ: -1 },
      successConditions: ['avatarAtGoal'],
    },
    {
      id: 'decor-reeds-1',
      label: 'Reeds',
      required: false,
      kind: 'decor',
      cells: [{ cellX: 1, cellZ: 1 }],
      assetId: 'asset.grass.reeds',
      interactive: false,
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-and-turn', unlockedFromMissionId: 'm05', apiVersion: 'v1' },
    { capabilityId: 'cap-collect', unlockedFromMissionId: 'm03', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'The pond blocks the straight path. The lane above it holds both sparks.',
    goal: 'Collect both sparks and reach the meadow exit.',
    requiredCount: 3,
    optionalCount: 0,
    newConcepts: ['turnLeft'],
    priorConcepts: ['moveForward', 'turnRight', 'collect'],
    controls: ['move forward', 'turn left', 'turn right', 'collect'],
    checklist: ['Go around the pond.', 'Collect both sparks.', 'Finish on the exit.'],
    readAloud: 'Turn left, step north, turn right, then collect both sparks on your way east.',
    locale: 'en-US',
  },
  starterCode: 'moveForward();\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Run your code and read why the first step is refused.',
      reveal: 'The pond fills the two cells straight ahead, so that route never works.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'turnLeft() faces you north. Step up one lane before you head east.',
      scaffold: 'turnLeft();\nmoveForward();\nturnRight();',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Both sparks sit on that upper lane. Collect each one as you reach it.',
      scaffold: 'turnLeft();\nmoveForward();\nturnRight();\nmoveForward();\ncollect();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'turnLeft();\nmoveForward();\nturnRight();\nmoveForward();\ncollect();\nmoveForward();\ncollect();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'Walking around a puddle',
    problem: 'The path is full of water. Step on the grass and keep going.',
    source: 'examples/around-the-puddle',
    note: 'Ask which way to step aside before counting how many steps forward.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'spark-1', 'spark-2'],
    requiredFlags: {},
    requiredCollected: ['spark-1', 'spark-2'],
    terminalCell: { cellX: 3, cellZ: -1 },
    reflectionQuestion: 'Which command changed your direction, and which one changed your cell?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['turnLeft', 'moveForward', 'turnRight', 'moveForward', 'collect'],
    },
    { ruleKey: 'rule.turnLeftUsed', kind: 'functionCalledWithArgs', threshold: 1 },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m05-upper-lane',
      source: 'demo/m05-upper-lane.js',
      expectedCommandCount: 8,
      expectedStepCount: 8,
      notes: 'Left, north, right, then east collecting both sparks on the way to the exit.',
    },
    {
      solutionId: 'sol-m05-three-rights',
      source: 'demo/m05-three-rights.js',
      expectedCommandCount: 10,
      expectedStepCount: 10,
      notes: 'Same route using three turnRight() calls instead of one turnLeft().',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m05-into-pond',
      source: 'tests/m05/into-pond.js',
      expectedFault: 'blockedMove',
      reasonKey: 'pond.blocks',
      notes: 'Starter code walks straight into the pond.',
    },
    {
      fixtureId: 'fixture-m05-one-spark',
      source: 'tests/m05/one-spark.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'goal-not-reached',
      notes: 'Reaches the exit with only the first spark collected.',
    },
    {
      fixtureId: 'fixture-m05-overshoot',
      source: 'tests/m05/overshoot.js',
      expectedFault: 'outOfBounds',
      reasonKey: 'goal-not-reached',
      notes: 'Collects both sparks but walks one cell past the exit.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move and turn; Space collects.',
    touch: 'Turn buttons are separate from the move button to avoid mis-taps.',
    captions: 'Caption strip names the blocked cell and the spark count so far.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Pond shimmer and spark pulse are disabled under reduced motion.',
    screenReader: 'Blocked moves announce "pond blocks the path" with the cell.',
  },
  budgets: {
    maxCommands: 14,
    maxStepCount: 18,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 6,
  },
  rewards: [
    { rewardId: 'reward-trail-color', assetId: 'asset.cosmetic.trail-color', label: 'Trail Colour', cosmetic: true },
  ],
};
