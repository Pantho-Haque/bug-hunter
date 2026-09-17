import type { MissionPackageSchema } from '@codequest/domain';

/**
 * Two lamps sit the same distance from the hub: two steps, then the lamp is in
 * front of you. The thicket makes the second approach an L instead of a
 * straight line, so the shared shape is "two steps and wake", not "go east".
 */
export const m08TwoSleepingFireflies: MissionPackageSchema = {
  identity: {
    levelId: 'm08',
    zoneId: 'echo-forest',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 2,
    title: 'Two Sleeping Fireflies',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m07'],
  },
  zoneId: 'echo-forest',
  curriculum: {
    primaryConcept: 'functionReuse',
    newConcepts: ['functionReuse'],
    priorConcepts: ['functionDeclaration', 'functionCall', 'moveForward', 'turnRight', 'interact'],
    transferPrompt: 'When two jobs have the same shape, what can you write once instead of twice?',
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
      label: 'Forest hub',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'lamp-a',
      label: 'First firefly lamp',
      required: true,
      kind: 'interactable',
      cell: { cellX: 3, cellZ: 0 },
      actionKey: 'wake',
      range: 1,
      initialState: 'asleep',
      stateTransitions: [{ from: 'asleep', to: 'awake' }],
    },
    {
      id: 'lamp-b',
      label: 'Second firefly lamp',
      required: true,
      kind: 'interactable',
      cell: { cellX: 2, cellZ: 3 },
      actionKey: 'wake',
      range: 1,
      initialState: 'asleep',
      stateTransitions: [{ from: 'asleep', to: 'awake' }],
    },
    {
      id: 'thicket-1',
      label: 'Thorn thicket',
      required: false,
      kind: 'blocker',
      occupiedCells: [
        { cellX: 3, cellZ: 1 },
        { cellX: 3, cellZ: 2 },
        { cellX: 3, cellZ: 3 },
      ],
      reasonKey: 'thicket.blocks',
    },
    {
      id: 'goal-1',
      label: 'Forest clearing',
      required: true,
      kind: 'goal',
      cell: { cellX: 2, cellZ: 4 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-and-turn', unlockedFromMissionId: 'm05', apiVersion: 'v1' },
    { capabilityId: 'cap-interact', unlockedFromMissionId: 'm04', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'Two lamps sleep in the trees. The walk to each one is the same.',
    goal: 'Wake both lamps and reach the clearing.',
    requiredCount: 3,
    optionalCount: 0,
    newConcepts: ['functionReuse'],
    priorConcepts: ['functionDeclaration', 'functionCall', 'interact'],
    controls: ['move forward', 'turn left', 'turn right', 'interact'],
    checklist: ['Wake the first lamp.', 'Turn to face the second lamp.', 'Wake it the same way.', 'Walk out to the clearing.'],
    readAloud: 'Walk two steps and wake the lamp. Turn right, then do the same thing again.',
    locale: 'en-US',
  },
  starterCode: 'function wakeLamp() {\n  // Two steps, then wake what is in front.\n}\n\nwakeLamp();\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Look at both lamps. How far is each one from where you turn?',
      reveal: 'Both lamps are two steps away. Only the turn is different.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'Put the shared part inside one function.',
      scaffold: 'function wakeLamp() {\n  moveForward();\n  moveForward();\n  interact();\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Call the function, turn right, then call the same function again.',
      scaffold: 'wakeLamp();\nturnRight();\nwakeLamp();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'function wakeLamp() {\n  moveForward();\n  moveForward();\n  interact();\n}\n\nwakeLamp();\nturnRight();\nwakeLamp();\nmoveForward();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'Feeding two pets',
    problem: 'You fill a bowl and add water for the cat, then do the same for the dog.',
    source: 'examples/feed-two-pets',
    note: 'One routine, two pets: the steps do not change, only who you point them at.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'lamp-a', 'lamp-b'],
    requiredFlags: {
      'interactable.lamp-a.state': true,
      'interactable.lamp-b.state': true,
    },
    requiredCollected: [],
    terminalCell: { cellX: 2, cellZ: 4 },
    reflectionQuestion: 'What was the same about waking each lamp?',
  },
  conceptEvidence: [
    { ruleKey: 'rule.functionDeclared', kind: 'functionDeclared', threshold: 1 },
    { ruleKey: 'rule.functionCalledTwice', kind: 'functionCalledWithArgs', threshold: 2 },
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'moveForward', 'interact', 'turnRight', 'moveForward', 'moveForward', 'interact'],
    },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m08-reused-function',
      source: 'demo/m08-reused-function.js',
      expectedCommandCount: 9,
      expectedStepCount: 9,
      notes: 'One wakeLamp() function called twice, with a right turn between the calls.',
    },
    {
      solutionId: 'sol-m08-linear',
      source: 'demo/m08-linear.js',
      expectedCommandCount: 9,
      expectedStepCount: 9,
      notes: 'The same nine commands written out twice; accepted, and the recap points at the repeat.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m08-one-lamp',
      source: 'tests/m08/one-lamp.js',
      expectedFault: 'blockedMove',
      reasonKey: 'goal-not-reached',
      notes: 'Wakes the first lamp, then walks to the clearing without the second call.',
    },
    {
      fixtureId: 'fixture-m08-missing-turn',
      source: 'tests/m08/missing-turn.js',
      expectedFault: 'outOfRange',
      reasonKey: 'interact.nothing-here',
      notes: 'Calls wakeLamp() twice with no turn, so the second interact faces empty forest.',
    },
    {
      fixtureId: 'fixture-m08-extra-call',
      source: 'tests/m08/extra-call.js',
      expectedFault: 'blockedMove',
      reasonKey: 'thicket.blocks',
      notes: 'A third call walks the avatar into the thorn thicket.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move and turn; Enter wakes the lamp in front.',
    touch: 'Action buttons keep the M06 order so the interact button stays in place.',
    captions: 'Caption strip says which lamp woke and how many are left.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Lamp glow appears at once instead of fading in.',
    screenReader: 'Announces "lamp 1 of 2 awake" after each successful interact.',
  },
  budgets: {
    maxCommands: 16,
    maxStepCount: 20,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 7,
  },
  rewards: [
    { rewardId: 'reward-firefly-trail', assetId: 'asset.trail.firefly-glow', label: 'Firefly Trail', cosmetic: true },
  ],
};
