import type { MissionPackageSchema } from '@codequest/domain';

/**
 * First branch in the zone: two bridges span the gorge and only one is safe.
 * `isWindSafe()` reads the authored flag `world.windSafe`, which this mission
 * seeds true, so the safe lane is the north one and the south lane is a wall of
 * gust. The child writes one `if` with both lanes in it; the seeded state picks
 * the lane, not the child.
 *
 * The mirrored seeding (`world.windSafe: false`, gust on the north lane) is the
 * second authored variant named in the solution notes. One mission package holds
 * one startState, so shipping both variants needs a schema change, not a second
 * layout hidden in this file.
 */
export const m19TheWindFlag: MissionPackageSchema = {
  identity: {
    levelId: 'm19',
    zoneId: 'logic-cliffs',
    apiVersion: 'v2',
    contentVersion: '2025.01',
    ordinal: 1,
    title: 'The Wind Flag',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m18'],
  },
  zoneId: 'logic-cliffs',
  curriculum: {
    primaryConcept: 'conditional',
    newConcepts: ['ifStatement', 'booleanState'],
    priorConcepts: ['moveForward', 'turnLeft', 'turnRight', 'collect', 'predicate'],
    transferPrompt: 'Which part of the route did the world choose, and which part did you choose?',
  },
  startState: {
    avatar: { cellX: 0, cellZ: 0, facing: 'east' },
    collected: [],
    inventory: {},
    flags: { 'world.windSafe': true },
    stepCount: 0,
  },
  objects: [
    {
      id: 'spawn-1',
      label: 'Cliff path',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'gorge-1',
      label: 'Open gorge',
      required: false,
      kind: 'blocker',
      occupiedCells: [
        { cellX: 1, cellZ: 0 },
        { cellX: 2, cellZ: 0 },
        { cellX: 3, cellZ: 0 },
      ],
      reasonKey: 'gorge.edge',
    },
    {
      id: 'gust-1',
      label: 'Gusting south bridge',
      required: false,
      kind: 'blocker',
      occupiedCells: [
        { cellX: 1, cellZ: 1 },
        { cellX: 2, cellZ: 1 },
        { cellX: 3, cellZ: 1 },
      ],
      reasonKey: 'wind.gust',
    },
    {
      id: 'shard-1',
      label: 'Compass shard',
      required: true,
      kind: 'collectible',
      cell: { cellX: 2, cellZ: -1 },
      collectionEffect: 'shard',
    },
    {
      id: 'goal-1',
      label: 'Cliff top',
      required: true,
      kind: 'goal',
      cell: { cellX: 4, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-and-turn', unlockedFromMissionId: 'm05', apiVersion: 'v2' },
    { capabilityId: 'cap-collect', unlockedFromMissionId: 'm03', apiVersion: 'v2' },
    { capabilityId: 'cap-sense-wind', unlockedFromMissionId: 'm19', apiVersion: 'v2' },
  ],
  briefing: {
    storySentence: 'Two rope bridges cross the gorge. The wind flag shows which one is safe.',
    goal: 'Take the safe bridge and pick up the compass shard.',
    requiredCount: 2,
    optionalCount: 0,
    newConcepts: ['ifStatement'],
    priorConcepts: ['moveForward', 'turnLeft', 'turnRight', 'collect'],
    controls: ['move forward', 'turn left', 'turn right', 'collect', 'check the wind'],
    checklist: [
      'Ask if the wind is safe.',
      'Walk the bridge the flag picks.',
      'Pick up the compass shard.',
      'Stand on the cliff top.',
    ],
    readAloud: 'Ask the wind flag first. Then walk the safe bridge and grab the shard.',
    locale: 'en-US',
  },
  starterCode:
    '// The wind picks the bridge. Ask first.\nif (isWindSafe()) {\n  // north bridge\n} else {\n  // south bridge\n}\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Walk straight east and watch what stops you.',
      reveal: 'The gorge is in the way. You have to use a bridge.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'You can ask the flag whether the wind is safe.',
      scaffold: 'if (isWindSafe()) {\n  turnLeft();\n  moveForward();\n  turnRight();\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'The safe bridge is the north one. Walk it, grab the shard, then step down to the cliff top.',
      scaffold:
        'if (isWindSafe()) {\n  turnLeft();\n  moveForward();\n  turnRight();\n  moveForward();\n  moveForward();\n  collect();\n}',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'if (isWindSafe()) {\n  turnLeft();\n  moveForward();\n  turnRight();\n  moveForward();\n  moveForward();\n  collect();\n  moveForward();\n  moveForward();\n  turnRight();\n  moveForward();\n}',
    },
  ],
  analogousExample: {
    title: 'Checking the sky',
    problem: 'You look at the sky before you pick a coat. Rain means one coat. Sun means another.',
    source: 'examples/checking-the-sky',
    note: 'You write both choices once. The sky decides which one you use today.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'shard-1'],
    requiredFlags: {},
    requiredCollected: ['shard-1'],
    terminalCell: { cellX: 4, cellZ: 0 },
    reflectionQuestion: 'What would your code do if the wind changed?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['turnLeft', 'moveForward', 'turnRight', 'moveForward', 'moveForward', 'collect'],
    },
    { ruleKey: 'rule.conditionalBranch', kind: 'conditionalBranch', threshold: 1 },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m19-safe-branch',
      source: 'demo/m19-safe-branch.js',
      expectedCommandCount: 10,
      expectedStepCount: 10,
      notes: 'One if/else. The seeded safe wind runs the north lane, grabs the shard, then drops to the cliff top.',
    },
    {
      solutionId: 'sol-m19-collect-ahead',
      source: 'demo/m19-collect-ahead.js',
      expectedCommandCount: 10,
      expectedStepCount: 10,
      notes: 'Same branch, but the shard is taken from the cell in front instead of standing on it.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m19-wrong-bridge',
      source: 'tests/m19/wrong-bridge.js',
      expectedFault: 'blockedMove',
      reasonKey: 'wind.gust',
      notes: 'Takes the south bridge while the seeded wind flag says north; the gust refuses the step.',
    },
    {
      fixtureId: 'fixture-m19-straight-ahead',
      source: 'tests/m19/straight-ahead.js',
      expectedFault: 'blockedMove',
      reasonKey: 'gorge.edge',
      notes: 'Ignores both bridges and walks east into the gorge.',
    },
    {
      fixtureId: 'fixture-m19-no-shard',
      source: 'tests/m19/no-shard.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'goal-not-reached',
      notes: 'Crosses the safe bridge but never collects the shard.',
    },
    {
      fixtureId: 'fixture-m19-mirrored-seed',
      source: 'tests/m19/mirrored-seed.js',
      expectedFault: 'blockedMove',
      reasonKey: 'wind.gust',
      notes:
        'Second authored variant: world.windSafe seeded false with the gust on the north lane. North-only code is refused there. Running it needs a per-variant startState the package format does not have yet.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move and turn; Space collects; the wind panel reads with Tab.',
    touch: 'The wind answer sits next to the bridges so both can be read at once.',
    captions: 'Caption strip prints the wind answer as the words safe or gusting.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'The flag holds one still pose under reduced motion; colour and text still differ.',
    screenReader: 'Announces the wind answer before the branch runs, then the bridge taken.',
  },
  budgets: {
    maxCommands: 16,
    maxStepCount: 18,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 8,
  },
  rewards: [
    { rewardId: 'reward-logic-lens', assetId: 'asset.tool.logic-lens', label: 'Logic Lens', cosmetic: true },
  ],
};
