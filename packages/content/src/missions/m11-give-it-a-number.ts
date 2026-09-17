import type { MissionPackageSchema } from '@codequest/domain';

/**
 * One rope bridge, two spans of different length, a leaf at the end of each.
 * The ravine on both sides means the only choice left is how far to walk, which
 * is the whole argument for walk(count) over two near-identical functions.
 *
 * The stage 2 and stage 4 scaffolds show a counting loop inside walk(). A count
 * parameter cannot repeat anything without one, so this is the single place
 * where Echo Forest previews a Loop Lagoon (M13) structure. The mission never
 * requires it: two fixed-length functions also pass, and the recap is what makes
 * the parameter the better answer.
 */
export const m11GiveItANumber: MissionPackageSchema = {
  identity: {
    levelId: 'm11',
    zoneId: 'echo-forest',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 5,
    title: 'Give It a Number',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m10'],
  },
  zoneId: 'echo-forest',
  curriculum: {
    primaryConcept: 'parameter',
    newConcepts: ['parameter', 'argument'],
    priorConcepts: ['functionDeclaration', 'functionCall', 'moveForward', 'collect'],
    transferPrompt: 'When two routines differ only by a number, what should that number become?',
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
      label: 'Near bank',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'ravine-north',
      label: 'Ravine edge',
      required: false,
      kind: 'blocker',
      occupiedCells: [
        { cellX: 1, cellZ: -1 },
        { cellX: 2, cellZ: -1 },
        { cellX: 3, cellZ: -1 },
        { cellX: 4, cellZ: -1 },
        { cellX: 5, cellZ: -1 },
        { cellX: 6, cellZ: -1 },
      ],
      reasonKey: 'ravine.blocks',
    },
    {
      id: 'ravine-south',
      label: 'Ravine edge',
      required: false,
      kind: 'blocker',
      occupiedCells: [
        { cellX: 1, cellZ: 1 },
        { cellX: 2, cellZ: 1 },
        { cellX: 3, cellZ: 1 },
        { cellX: 4, cellZ: 1 },
        { cellX: 5, cellZ: 1 },
        { cellX: 6, cellZ: 1 },
      ],
      reasonKey: 'ravine.blocks',
    },
    {
      id: 'leaf-a',
      label: 'Near leaf',
      required: true,
      kind: 'collectible',
      cell: { cellX: 2, cellZ: 0 },
      collectionEffect: 'leaf',
    },
    {
      id: 'leaf-b',
      label: 'Far leaf',
      required: true,
      kind: 'collectible',
      cell: { cellX: 6, cellZ: 0 },
      collectionEffect: 'leaf',
    },
    {
      id: 'goal-1',
      label: 'Far bank',
      required: true,
      kind: 'goal',
      cell: { cellX: 7, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-forward', unlockedFromMissionId: 'm01', apiVersion: 'v1' },
    { capabilityId: 'cap-collect', unlockedFromMissionId: 'm03', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'Two leaves sit on the long bridge. One is close and one is far.',
    goal: 'Pick up both leaves and reach the far bank.',
    requiredCount: 3,
    optionalCount: 0,
    newConcepts: ['parameter', 'argument'],
    priorConcepts: ['functionDeclaration', 'functionCall', 'collect'],
    controls: ['move forward', 'collect'],
    checklist: ['Walk two steps and take the first leaf.', 'Walk four steps and take the next leaf.', 'Step off the bridge.'],
    readAloud: 'Walk two steps and take a leaf. Walk four more steps and take the last one.',
    locale: 'en-US',
  },
  starterCode: 'function walk(count) {\n  // Take that many steps.\n}\n\nwalk(2);\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Count the steps to each leaf. Are the two counts the same?',
      reveal: 'The first leaf is two steps away. The next one is four more.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'A function can take a number. The number goes in the round brackets.',
      scaffold: 'function walk(count) {\n  for (let i = 0; i < count; i += 1) {\n    moveForward();\n  }\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Call the same function twice with two different numbers.',
      scaffold: 'walk(2);\ncollect();\nwalk(4);\ncollect();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'function walk(count) {\n  for (let i = 0; i < count; i += 1) {\n    moveForward();\n  }\n}\n\nwalk(2);\ncollect();\nwalk(4);\ncollect();\nwalk(1);',
    },
  ],
  analogousExample: {
    title: 'Scoops of rice',
    problem: 'You ask for two scoops of rice for lunch and four scoops for dinner.',
    source: 'examples/scoops-of-rice',
    note: 'One word, "scoops", plus a number does the job of two separate requests.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'leaf-a', 'leaf-b'],
    requiredFlags: {},
    requiredCollected: ['leaf-a', 'leaf-b'],
    terminalCell: { cellX: 7, cellZ: 0 },
    reflectionQuestion: 'What number did you give the function each time?',
  },
  conceptEvidence: [
    { ruleKey: 'rule.functionDeclared', kind: 'functionDeclared', threshold: 1 },
    { ruleKey: 'rule.calledWithTwoArguments', kind: 'functionCalledWithArgs', threshold: 2 },
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'moveForward', 'collect', 'moveForward', 'moveForward', 'moveForward', 'moveForward', 'collect'],
    },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m11-parameter',
      source: 'demo/m11-parameter.js',
      expectedCommandCount: 9,
      expectedStepCount: 9,
      notes: 'One walk(count) function called with 2, then 4, then 1.',
    },
    {
      solutionId: 'sol-m11-two-functions',
      source: 'demo/m11-two-functions.js',
      expectedCommandCount: 9,
      expectedStepCount: 9,
      notes: 'Two fixed-length functions; accepted, and the recap shows they differ only by a number.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m11-missing-argument',
      source: 'tests/m11/missing-argument.js',
      expectedFault: 'syntax',
      reasonKey: 'syntax.missing-argument',
      notes: 'Calls walk() with no number, so count is undefined.',
    },
    {
      fixtureId: 'fixture-m11-wrong-count',
      source: 'tests/m11/wrong-count.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'collect.nothing-here',
      notes: 'Calls walk(2) twice, so the second collect happens on an empty cell.',
    },
    {
      fixtureId: 'fixture-m11-one-leaf',
      source: 'tests/m11/one-leaf.js',
      expectedFault: 'blockedMove',
      reasonKey: 'goal-not-reached',
      notes: 'Reaches the far bank with only the near leaf collected.',
    },
  ],
  accessibility: {
    keyboard: 'ArrowRight moves forward; Space takes the leaf under or ahead of you.',
    touch: 'The parameter callout stays pinned above the editor and is tappable.',
    captions: 'Caption strip reads the parameter name and its value at each call.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Bridge sway is switched off under reduced motion.',
    screenReader: 'Announces "walk with count 2" before the grouped steps.',
  },
  budgets: {
    maxCommands: 14,
    maxStepCount: 18,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 8,
  },
  rewards: [
    { rewardId: 'reward-leaf-cape', assetId: 'asset.cape.leaf-cape', label: 'Leaf Cape', cosmetic: true },
  ],
};
