import type { MissionPackageSchema } from '@codequest/domain';

/**
 * Checkpoint: one loop of path around the old tree with a firefly on each
 * corner, so the route is the same four-command shape three times over —
 * step, wake, step, turn — then one last step to the gate. Everything the zone
 * taught, with the tree making the circle the only route.
 */
export const m12EchoCheckpoint: MissionPackageSchema = {
  identity: {
    levelId: 'm12',
    zoneId: 'echo-forest',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 6,
    title: 'Echo Checkpoint',
    isCheckpoint: true,
    prerequisiteLevelIds: ['m11'],
  },
  zoneId: 'echo-forest',
  curriculum: {
    primaryConcept: 'functionReuse',
    newConcepts: [],
    priorConcepts: ['functionDeclaration', 'functionCall', 'parameter', 'moveForward', 'turnRight', 'interact'],
    transferPrompt: 'Which part of your code did you write once and use three times?',
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
      label: 'Clearing edge',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'tree-1',
      label: 'Old echo tree',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 1, cellZ: 1 }],
      reasonKey: 'tree.blocks',
    },
    {
      id: 'firefly-1',
      label: 'First firefly',
      required: true,
      kind: 'interactable',
      cell: { cellX: 2, cellZ: 0 },
      actionKey: 'wake',
      range: 1,
      initialState: 'asleep',
      stateTransitions: [{ from: 'asleep', to: 'awake' }],
    },
    {
      id: 'firefly-2',
      label: 'Second firefly',
      required: true,
      kind: 'interactable',
      cell: { cellX: 2, cellZ: 2 },
      actionKey: 'wake',
      range: 1,
      initialState: 'asleep',
      stateTransitions: [{ from: 'asleep', to: 'awake' }],
    },
    {
      id: 'firefly-3',
      label: 'Third firefly',
      required: true,
      kind: 'interactable',
      cell: { cellX: 0, cellZ: 2 },
      actionKey: 'wake',
      range: 1,
      initialState: 'asleep',
      stateTransitions: [{ from: 'asleep', to: 'awake' }],
    },
    {
      id: 'goal-1',
      label: 'Forest gate',
      required: true,
      kind: 'goal',
      cell: { cellX: 0, cellZ: 1 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-everything', unlockedFromMissionId: 'm06', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'Three fireflies rest around the old tree. The gate is on the far side.',
    goal: 'Wake all three fireflies and reach the forest gate.',
    requiredCount: 4,
    optionalCount: 0,
    newConcepts: [],
    priorConcepts: ['functionDeclaration', 'functionCall', 'parameter', 'interact'],
    controls: ['move forward', 'turn left', 'turn right', 'collect', 'interact'],
    checklist: ['Write your plan as comments first.', 'Wake each firefly as you pass it.', 'Turn right at the end of each side.', 'Stop on the gate.'],
    readAloud: 'Walk around the tree. Wake each firefly, then stop at the gate.',
    locale: 'en-US',
  },
  starterCode: '// Plan first: what happens at each corner?\nfunction rescueFirefly() {\n  // Your steps here.\n}\n\nrescueFirefly();\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Walk one corner in your head. Write down what you did.',
      reveal: 'Each corner is the same: step, wake, step, turn.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'Put those four things in one function.',
      scaffold: 'function rescueFirefly() {\n  moveForward();\n  interact();\n  moveForward();\n  turnRight();\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'There are three fireflies, so call it three times. Then one step is left.',
      scaffold: 'rescueFirefly();\nrescueFirefly();\nrescueFirefly();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'function rescueFirefly() {\n  moveForward();\n  interact();\n  moveForward();\n  turnRight();\n}\n\nrescueFirefly();\nrescueFirefly();\nrescueFirefly();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'Watering the pots',
    problem: 'You walk around the yard and give each of the three pots the same drink.',
    source: 'examples/watering-the-pots',
    note: 'One routine, three pots, one lap: the plan is the same at every stop.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'firefly-1', 'firefly-2', 'firefly-3'],
    requiredFlags: {
      'interactable.firefly-1.state': true,
      'interactable.firefly-2.state': true,
      'interactable.firefly-3.state': true,
    },
    requiredCollected: [],
    terminalCell: { cellX: 0, cellZ: 1 },
    reflectionQuestion: 'What did you do the same way at each corner?',
  },
  conceptEvidence: [
    { ruleKey: 'rule.functionDeclared', kind: 'functionDeclared', threshold: 1 },
    { ruleKey: 'rule.functionCalledThrice', kind: 'functionCalledWithArgs', threshold: 3 },
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'interact', 'moveForward', 'turnRight'],
    },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m12-one-lap',
      source: 'demo/m12-one-lap.js',
      expectedCommandCount: 13,
      expectedStepCount: 13,
      notes: 'rescueFirefly() called three times, then one step onto the gate.',
    },
    {
      solutionId: 'sol-m12-linear',
      source: 'demo/m12-linear.js',
      expectedCommandCount: 13,
      expectedStepCount: 13,
      notes: 'The same lap written out command by command; accepted, and the recap counts the repeats.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m12-one-firefly',
      source: 'tests/m12/one-firefly.js',
      expectedFault: 'blockedMove',
      reasonKey: 'goal-not-reached',
      notes: 'Wakes the first firefly, then walks the rest of the lap without interacting.',
    },
    {
      fixtureId: 'fixture-m12-cuts-the-corner',
      source: 'tests/m12/cuts-the-corner.js',
      expectedFault: 'blockedMove',
      reasonKey: 'tree.blocks',
      notes: 'Turns one cell early and walks into the old echo tree.',
    },
    {
      fixtureId: 'fixture-m12-extra-lap',
      source: 'tests/m12/extra-lap.js',
      expectedFault: 'outOfRange',
      reasonKey: 'interact.nothing-here',
      notes: 'A fourth call interacts with a corner that has no firefly on it.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move and turn; Enter wakes the firefly in front.',
    touch: 'Action buttons keep the zone order; the trace list groups each call.',
    captions: 'Caption strip lists which checklist items are done.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Firefly wake is an instant light change under reduced motion.',
    screenReader: 'Announces "firefly 2 of 3 awake" and names the current corner.',
  },
  budgets: {
    maxCommands: 20,
    maxStepCount: 24,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 10,
  },
  rewards: [
    { rewardId: 'reward-echo-badge', assetId: 'asset.badge.echo-forest', label: 'Echo Explorer', cosmetic: true },
  ],
};
