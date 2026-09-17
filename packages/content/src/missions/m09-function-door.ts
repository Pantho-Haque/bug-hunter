import type { MissionPackageSchema } from '@codequest/domain';

/**
 * Two bells one cell apart, so the same "step up and ring" shape works for
 * both. The door watches the second bell, but completion requires both flags,
 * which is what makes skipping the first bell fail at the contract rather than
 * at the door.
 */
export const m09FunctionDoor: MissionPackageSchema = {
  identity: {
    levelId: 'm09',
    zoneId: 'echo-forest',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 3,
    title: 'Function Door',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m08'],
  },
  zoneId: 'echo-forest',
  curriculum: {
    primaryConcept: 'functionReuse',
    newConcepts: ['functionWithSideEffect'],
    priorConcepts: ['functionDeclaration', 'functionCall', 'moveForward', 'interact'],
    transferPrompt: 'What changes in the world when a function runs, and what stays the same?',
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
      label: 'Bell path',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'bell-1',
      label: 'First bell',
      required: true,
      kind: 'interactable',
      cell: { cellX: 2, cellZ: 0 },
      actionKey: 'ring',
      range: 1,
      initialState: 'silent',
      stateTransitions: [{ from: 'silent', to: 'ringing' }],
    },
    {
      id: 'bell-2',
      label: 'Second bell',
      required: true,
      kind: 'interactable',
      cell: { cellX: 3, cellZ: 0 },
      actionKey: 'ring',
      range: 1,
      initialState: 'silent',
      stateTransitions: [{ from: 'silent', to: 'ringing' }],
    },
    {
      id: 'door-1',
      label: 'Stone door',
      required: true,
      kind: 'blocker',
      occupiedCells: [{ cellX: 4, cellZ: 0 }],
      reasonKey: 'door.closed',
      unlockedByFlag: 'interactable.bell-2.state',
    },
    {
      id: 'goal-1',
      label: 'Echo hollow',
      required: true,
      kind: 'goal',
      cell: { cellX: 5, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-and-turn', unlockedFromMissionId: 'm05', apiVersion: 'v1' },
    { capabilityId: 'cap-interact', unlockedFromMissionId: 'm04', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'Two bells hang on the path. The stone door opens when the second bell rings.',
    goal: 'Ring both bells, then walk through the door.',
    requiredCount: 3,
    optionalCount: 0,
    newConcepts: ['functionWithSideEffect'],
    priorConcepts: ['functionDeclaration', 'functionCall', 'interact'],
    controls: ['move forward', 'turn left', 'turn right', 'interact'],
    checklist: ['Ring the first bell.', 'Ring the second bell.', 'Walk through the open door.'],
    readAloud: 'Step up to a bell and ring it. Do that twice, then walk to the hollow.',
    locale: 'en-US',
  },
  starterCode: 'function ringBell() {\n  // Step up to the bell, then ring it.\n}\n\nringBell();\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Try walking to the door first and read the message.',
      reveal: 'The door stays shut until the second bell rings.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'A function can hold an action, not just steps.',
      scaffold: 'function ringBell() {\n  moveForward();\n  interact();\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'The bells are one cell apart, so the same call works for both.',
      scaffold: 'ringBell();\nringBell();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'function ringBell() {\n  moveForward();\n  interact();\n}\n\nringBell();\nringBell();\nmoveForward();\nmoveForward();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'Two light switches',
    problem: 'The hall light only comes on when both switches are flipped up.',
    source: 'examples/two-switches',
    note: 'The same small routine runs twice, and only the second one finishes the job.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'bell-1', 'bell-2', 'door-1'],
    requiredFlags: {
      'interactable.bell-1.state': true,
      'interactable.bell-2.state': true,
    },
    requiredCollected: [],
    terminalCell: { cellX: 5, cellZ: 0 },
    reflectionQuestion: 'What did ringing the second bell change in the world?',
  },
  conceptEvidence: [
    { ruleKey: 'rule.functionDeclared', kind: 'functionDeclared', threshold: 1 },
    { ruleKey: 'rule.interactInsideFunction', kind: 'functionCalledWithArgs', threshold: 2 },
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'interact', 'moveForward', 'interact'],
    },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m09-function-bells',
      source: 'demo/m09-function-bells.js',
      expectedCommandCount: 7,
      expectedStepCount: 7,
      notes: 'ringBell() called twice, then three steps through the open door.',
    },
    {
      solutionId: 'sol-m09-linear',
      source: 'demo/m09-linear.js',
      expectedCommandCount: 7,
      expectedStepCount: 7,
      notes: 'The same seven commands written out; accepted, and the recap names the repeated pair.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m09-second-bell-missing',
      source: 'tests/m09/second-bell-missing.js',
      expectedFault: 'closedGate',
      reasonKey: 'door.closed',
      notes: 'Rings only the first bell, so the door never opens.',
    },
    {
      fixtureId: 'fixture-m09-early-door-move',
      source: 'tests/m09/early-door-move.js',
      expectedFault: 'closedGate',
      reasonKey: 'door.closed',
      notes: 'Walks the whole path before ringing anything.',
    },
    {
      fixtureId: 'fixture-m09-repeated-bell',
      source: 'tests/m09/repeated-bell.js',
      expectedFault: 'outOfRange',
      reasonKey: 'interact.nothing-here',
      notes: 'Rings the same bell twice from the same cell instead of stepping on.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move; Enter rings the bell in front.',
    touch: 'Interact button enables only when a bell is in range.',
    captions: 'Caption strip names each bell and says whether the door moved.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'The door opens as an instant state change under reduced motion.',
    screenReader: 'Announces "bell rung" and "door open" as separate events.',
  },
  budgets: {
    maxCommands: 12,
    maxStepCount: 16,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 7,
  },
  rewards: [
    { rewardId: 'reward-echo-key', assetId: 'asset.key.echo-key', label: 'Echo Key', cosmetic: true },
  ],
};
