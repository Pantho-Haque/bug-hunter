import type { MissionPackageSchema } from '@codequest/domain';

/**
 * The count is deliberately withheld: the briefing never says how long the
 * channel is, and the overhead map does not show the reef until the boat is
 * close. A counting loop can still solve it by trial and error, and that is
 * allowed, but the only way to get it right first time is to ask the world —
 * `while (canMoveForward())` — which is the predicate this mission unlocks.
 */
export const m16StopAtTheReef: MissionPackageSchema = {
  identity: {
    levelId: 'm16',
    zoneId: 'loop-lagoon',
    apiVersion: 'v2',
    contentVersion: '2025.01',
    ordinal: 4,
    title: 'Stop at the Reef',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m15'],
  },
  zoneId: 'loop-lagoon',
  curriculum: {
    primaryConcept: 'whileLoop',
    newConcepts: ['whileLoop', 'predicate'],
    priorConcepts: ['forLoop', 'loopBody', 'moveForward', 'turnLeft', 'interact'],
    transferPrompt: 'When you do not know the count, what can you ask the world instead?',
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
      label: 'Channel mouth',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'channel-wall',
      label: 'Channel wall',
      required: false,
      kind: 'blocker',
      occupiedCells: [
        { cellX: 1, cellZ: -1 },
        { cellX: 2, cellZ: -1 },
        { cellX: 3, cellZ: -1 },
        { cellX: 4, cellZ: -1 },
        { cellX: 1, cellZ: 1 },
        { cellX: 2, cellZ: 1 },
        { cellX: 3, cellZ: 1 },
        { cellX: 4, cellZ: 1 },
        { cellX: 5, cellZ: 1 },
      ],
      reasonKey: 'wall.blocks',
    },
    {
      id: 'reef-1',
      label: 'Sharp reef',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 6, cellZ: 0 }],
      reasonKey: 'reef.blocks',
    },
    {
      id: 'signal-1',
      label: 'Reef signal light',
      required: true,
      kind: 'interactable',
      cell: { cellX: 5, cellZ: -1 },
      actionKey: 'signal',
      range: 1,
      initialState: 'off',
      stateTransitions: [{ from: 'off', to: 'on' }],
    },
    {
      id: 'goal-1',
      label: 'Last safe cell',
      required: true,
      kind: 'goal',
      cell: { cellX: 5, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-and-turn', unlockedFromMissionId: 'm05', apiVersion: 'v2' },
    { capabilityId: 'cap-interact', unlockedFromMissionId: 'm04', apiVersion: 'v2' },
    { capabilityId: 'cap-sense-path', unlockedFromMissionId: 'm16', apiVersion: 'v2' },
  ],
  briefing: {
    storySentence: 'The channel ends at a sharp reef. No one has counted the steps.',
    goal: 'Walk until the reef stops you, then turn on the signal light.',
    requiredCount: 1,
    optionalCount: 0,
    newConcepts: ['whileLoop', 'predicate'],
    priorConcepts: ['forLoop', 'moveForward', 'turnLeft', 'interact'],
    controls: ['move forward', 'turn left', 'turn right', 'interact', 'check the way ahead'],
    checklist: ['Step while the way ahead is clear.', 'Stop before the reef.', 'Turn left and press the signal.'],
    readAloud: 'Keep stepping while the way ahead is clear. Then turn left and press the signal.',
    locale: 'en-US',
  },
  starterCode: '// How long is the channel? Ask instead of guessing.\nwhile (canMoveForward()) {\n  // Your step here.\n}\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Nobody tells you the count. What could you ask before each step?',
      reveal: 'You can ask whether the way ahead is clear. It answers yes or no.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'Asking changes nothing. It only reports. Put the step inside the loop.',
      scaffold: 'while (canMoveForward()) {\n  moveForward();\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'The loop stops when the answer is no. The signal light is on your left.',
      scaffold: 'while (canMoveForward()) {\n  moveForward();\n}\nturnLeft();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal: 'while (canMoveForward()) {\n  moveForward();\n}\n\nturnLeft();\ninteract();',
    },
  ],
  analogousExample: {
    title: 'Filling a cup',
    problem: 'You pour water while the cup is not full. You stop as soon as it is full.',
    source: 'examples/filling-a-cup',
    note: 'You never count the pours. You keep checking the thing itself.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'signal-1'],
    requiredFlags: {
      'interactable.signal-1.state': true,
    },
    requiredCollected: [],
    terminalCell: { cellX: 5, cellZ: 0 },
    reflectionQuestion: 'When did your check turn from yes to no?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'moveForward', 'moveForward', 'moveForward', 'moveForward', 'turnLeft', 'interact'],
    },
    { ruleKey: 'rule.whileLoop', kind: 'whileLoop', threshold: 1 },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m16-while-predicate',
      source: 'demo/m16-while-predicate.js',
      expectedCommandCount: 7,
      expectedStepCount: 7,
      notes: 'A while loop on canMoveForward stops at the reef, then turnLeft and interact.',
    },
    {
      solutionId: 'sol-m16-fixed-count',
      source: 'demo/m16-fixed-count.js',
      expectedCommandCount: 7,
      expectedStepCount: 7,
      notes: 'A for loop of five steps found by trial and error; valid, and the recap contrasts it.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m16-six-steps',
      source: 'tests/m16/six-steps.js',
      expectedFault: 'blockedMove',
      reasonKey: 'reef.blocks',
      notes: 'A counting loop guesses six and the last step is refused by the reef.',
    },
    {
      fixtureId: 'fixture-m16-runaway',
      source: 'tests/m16/runaway.js',
      expectedFault: 'runawayLoop',
      reasonKey: 'loop.budget-exceeded',
      notes: 'The while loop has no step in its body, so the check never changes.',
    },
    {
      fixtureId: 'fixture-m16-no-signal',
      source: 'tests/m16/no-signal.js',
      expectedFault: 'closedGate',
      reasonKey: 'goal-not-reached',
      notes: 'Stops in the right cell but never turns to press the signal.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move and turn; Enter presses the signal.',
    touch: 'The condition panel sits above the action buttons so both stay in reach.',
    captions: 'Caption strip prints the check result as yes or no before every step.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Reef spray and the signal beam are still images under reduced motion.',
    screenReader: 'Every check reads out its answer, then the step that followed.',
  },
  budgets: {
    maxCommands: 12,
    maxStepCount: 14,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 8,
  },
  rewards: [
    { rewardId: 'reward-reef-compass', assetId: 'asset.gear.reef-compass', label: 'Reef Compass', cosmetic: true },
  ],
};
