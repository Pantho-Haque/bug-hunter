import type { MissionPackageSchema } from '@codequest/domain';

/**
 * Checkpoint: three state checks on one route. The wind picks the bridge, the
 * bag decides whether a lantern is worth grabbing, and a count of two crystals
 * decides when the console is worth pressing. Seeded safe wind and an empty bag,
 * so every check takes the branch that does the work.
 *
 * The second authored combination is unsafe wind with a lantern already carried;
 * both of its branches exist in the child's program either way, but running it
 * needs a per-variant startState the package format does not have yet.
 */
export const m24CliffsCheckpoint: MissionPackageSchema = {
  identity: {
    levelId: 'm24',
    zoneId: 'logic-cliffs',
    apiVersion: 'v2',
    contentVersion: '2025.01',
    ordinal: 6,
    title: 'Cliffs Checkpoint',
    isCheckpoint: true,
    prerequisiteLevelIds: ['m23'],
  },
  zoneId: 'logic-cliffs',
  curriculum: {
    primaryConcept: 'conditional',
    newConcepts: [],
    priorConcepts: ['ifStatement', 'elseBranch', 'counter', 'comparison', 'predicate'],
    transferPrompt: 'Which choices did the world make for your program, and which ones did you make?',
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
      label: 'Cliffs gate',
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
      ],
      reasonKey: 'gorge.edge',
    },
    {
      id: 'gust-1',
      label: 'Gusting south lane',
      required: false,
      kind: 'blocker',
      occupiedCells: [
        { cellX: 1, cellZ: 1 },
        { cellX: 2, cellZ: 1 },
      ],
      reasonKey: 'wind.gust',
    },
    {
      id: 'lantern-1',
      label: 'Spare lantern',
      required: true,
      kind: 'collectible',
      cell: { cellX: 3, cellZ: 0 },
      collectionEffect: 'lantern',
    },
    {
      id: 'crystal-1',
      label: 'First crystal',
      required: true,
      kind: 'collectible',
      cell: { cellX: 4, cellZ: 0 },
      collectionEffect: 'crystal',
    },
    {
      id: 'crystal-2',
      label: 'Second crystal',
      required: true,
      kind: 'collectible',
      cell: { cellX: 5, cellZ: 0 },
      collectionEffect: 'crystal',
    },
    {
      id: 'console-1',
      label: 'Cliffs console',
      required: true,
      kind: 'interactable',
      cell: { cellX: 6, cellZ: 0 },
      actionKey: 'press',
      range: 1,
      initialState: 'dim',
      stateTransitions: [{ from: 'dim', to: 'bright' }],
    },
    {
      id: 'exit-gate',
      label: 'Cliffs gate door',
      required: true,
      kind: 'blocker',
      occupiedCells: [{ cellX: 7, cellZ: 0 }],
      reasonKey: 'gate.dim',
      unlockedByFlag: 'interactable.console-1.state',
    },
    {
      id: 'goal-1',
      label: 'Cliffs exit',
      required: true,
      kind: 'goal',
      cell: { cellX: 8, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-everything', unlockedFromMissionId: 'm06', apiVersion: 'v2' },
    { capabilityId: 'cap-sense-wind', unlockedFromMissionId: 'm19', apiVersion: 'v2' },
    { capabilityId: 'cap-sense-lantern', unlockedFromMissionId: 'm21', apiVersion: 'v2' },
  ],
  briefing: {
    storySentence: 'The way out of the cliffs has three checks: the wind, your bag, and two crystals.',
    goal: 'Pass all three checks and reach the cliffs exit.',
    requiredCount: 4,
    optionalCount: 0,
    newConcepts: [],
    priorConcepts: ['ifStatement', 'elseBranch', 'counter', 'moveForward', 'collect', 'interact'],
    controls: ['move forward', 'turn left', 'turn right', 'collect', 'interact', 'check the wind', 'check your bag'],
    checklist: ['Ask the wind and take the safe lane.', 'Grab a lantern only if you need one.', 'Count two crystals.', 'Press the console and leave.'],
    readAloud: 'Ask the wind. Ask your bag. Count two crystals. Then press the console and walk out.',
    locale: 'en-US',
  },
  starterCode:
    '// Three checks. Plan them in order.\nlet crystals = 0;\nif (isWindSafe()) {\n  // north lane\n} else {\n  // south lane\n}\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Write your three checks as comments before any code.',
      reveal: 'Wind first, then the bag, then the crystal count.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'The wind check comes first because it picks the lane you walk.',
      scaffold:
        'if (isWindSafe()) {\n  turnLeft();\n  moveForward();\n  turnRight();\n} else {\n  turnRight();\n  moveForward();\n  turnLeft();\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Grab a lantern only if your bag is empty. Count each crystal as you take it.',
      scaffold:
        'if (!hasLantern()) {\n  collect();\n}\nmoveForward();\ncollect();\ncrystals = crystals + 1;',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'let crystals = 0;\nif (isWindSafe()) {\n  turnLeft();\n  moveForward();\n  turnRight();\n  moveForward();\n  moveForward();\n  moveForward();\n  turnRight();\n  moveForward();\n} else {\n  turnRight();\n  moveForward();\n  turnLeft();\n  moveForward();\n  moveForward();\n  moveForward();\n  turnLeft();\n  moveForward();\n}\nif (!hasLantern()) {\n  collect();\n}\nturnLeft();\nmoveForward();\ncollect();\ncrystals = crystals + 1;\nmoveForward();\ncollect();\ncrystals = crystals + 1;\nif (crystals === 2) {\n  interact();\n}\nmoveForward();\nmoveForward();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'Getting out the door',
    problem: 'You check the rain, then your bag, then count your two lunch boxes. Then you go.',
    source: 'examples/getting-out-the-door',
    note: 'Each check changes one small thing. You still do them in the same order every day.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'lantern-1', 'crystal-1', 'crystal-2', 'console-1'],
    requiredFlags: { 'interactable.console-1.state': true },
    requiredCollected: ['lantern-1', 'crystal-1', 'crystal-2'],
    terminalCell: { cellX: 8, cellZ: 0 },
    reflectionQuestion: 'Which check changed your route, and which one only changed your bag?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['turnLeft', 'moveForward', 'turnRight', 'moveForward', 'moveForward', 'moveForward', 'turnRight', 'moveForward'],
    },
    { ruleKey: 'rule.conditionalBranch', kind: 'conditionalBranch', threshold: 3 },
    { ruleKey: 'rule.variableUpdate', kind: 'variableUpdate', threshold: 2 },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m24-three-checks',
      source: 'demo/m24-three-checks.js',
      expectedCommandCount: 18,
      expectedStepCount: 18,
      notes: 'Safe wind takes the north lane, the empty bag takes the lantern, two crystals press the console, then three steps out.',
    },
    {
      solutionId: 'sol-m24-collect-ahead',
      source: 'demo/m24-collect-ahead.js',
      expectedCommandCount: 18,
      expectedStepCount: 18,
      notes: 'Same eighteen commands, taking the lantern and each crystal from the cell in front.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m24-wrong-lane',
      source: 'tests/m24/wrong-lane.js',
      expectedFault: 'blockedMove',
      reasonKey: 'wind.gust',
      notes: 'Skips the wind check and takes the south lane into the gust.',
    },
    {
      fixtureId: 'fixture-m24-one-crystal',
      source: 'tests/m24/one-crystal.js',
      expectedFault: 'blockedMove',
      reasonKey: 'gate.dim',
      notes: 'Counts one crystal, so the console press is skipped and the exit gate stays shut.',
    },
    {
      fixtureId: 'fixture-m24-no-lantern',
      source: 'tests/m24/no-lantern.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'goal-not-reached',
      notes: 'Reaches the exit with the console pressed but never picked the lantern up.',
    },
    {
      fixtureId: 'fixture-m24-second-combination',
      source: 'tests/m24/second-combination.js',
      expectedFault: 'blockedMove',
      reasonKey: 'wind.gust',
      notes:
        'Second authored combination: unsafe wind with a lantern already carried. North-lane-only code is refused there, and that seed also needs a completion contract without lantern-1 in requiredCollected.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move and turn; Space collects; Enter presses; Tab reads each check answer.',
    touch: 'Wind, bag and count panels stay side by side through the whole run.',
    captions: 'Caption strip names each check, its answer, and the branch that ran.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Flag, lantern light and gate all change state with no motion.',
    screenReader: 'Announces all three check answers in order, then the replay of the route.',
  },
  budgets: {
    maxCommands: 26,
    maxStepCount: 28,
    maxMissionObjects: 12,
    maxTriangles: 8000,
    estimatedActiveMinutes: 12,
  },
  rewards: [
    { rewardId: 'reward-cliffs-badge', assetId: 'asset.badge.logic-cliffs', label: 'Logic Cliffs Explorer', cosmetic: true },
  ],
};
