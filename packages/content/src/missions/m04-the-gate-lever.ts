import type { MissionPackageSchema } from '@codequest/domain';

/**
 * A lever one cell ahead, a closed gate two cells past it, the beacon beyond.
 * The gate only opens once the lever flag is set, so walking first fails at the
 * gate and the ordering is the lesson: use the lever, then cross.
 */
export const m04TheGateLever: MissionPackageSchema = {
  identity: {
    levelId: 'm04',
    zoneId: 'meadow-of-moves',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 4,
    title: 'The Gate Lever',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m03'],
  },
  zoneId: 'meadow-of-moves',
  curriculum: {
    primaryConcept: 'sequence',
    newConcepts: ['interact'],
    priorConcepts: ['moveForward', 'collect'],
    transferPrompt: 'Why does the same set of commands work in one order and fail in another?',
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
      label: 'Yard gate',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'lever-1',
      label: 'Gate lever',
      required: true,
      kind: 'interactable',
      cell: { cellX: 1, cellZ: 0 },
      actionKey: 'pull',
      range: 1,
      initialState: 'down',
      stateTransitions: [{ from: 'down', to: 'up' }],
    },
    {
      id: 'gate-1',
      label: 'Closed gate',
      required: true,
      kind: 'blocker',
      occupiedCells: [{ cellX: 2, cellZ: 0 }],
      reasonKey: 'gate.closed',
      unlockedByFlag: 'interactable.lever-1.state',
    },
    {
      id: 'goal-1',
      label: 'Beacon',
      required: true,
      kind: 'goal',
      cell: { cellX: 3, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-forward', unlockedFromMissionId: 'm01', apiVersion: 'v1' },
    { capabilityId: 'cap-interact', unlockedFromMissionId: 'm04', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'The gate across the yard is shut. The lever in front of you opens it.',
    goal: 'Open the gate, then reach the beacon.',
    requiredCount: 2,
    optionalCount: 0,
    newConcepts: ['interact'],
    priorConcepts: ['moveForward'],
    controls: ['move forward', 'interact'],
    checklist: ['Use the lever while it is in front of you.', 'Then walk through the open gate.'],
    readAloud: 'Use the lever, then walk three steps east to the beacon.',
    locale: 'en-US',
  },
  starterCode: 'moveForward();\nmoveForward();\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Run your code and read the message when the avatar stops.',
      reveal: 'The gate is closed, so moveForward() is refused at that cell.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'interact() uses whatever is in the cell right in front of you.',
      scaffold: 'interact();',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'The lever starts in front of you, so use it before you walk anywhere.',
      scaffold: 'interact();\nmoveForward();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Solution shown below.',
      reveal: 'interact();\nmoveForward();\nmoveForward();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'Switching on the hall lantern',
    problem: 'Turn on the lantern by the door before you walk down the dark hall.',
    source: 'examples/hall-lantern',
    note: 'The action that changes the world has to happen before the action that depends on it.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'lever-1'],
    requiredFlags: { 'interactable.lever-1.state': true },
    requiredCollected: [],
    terminalCell: { cellX: 3, cellZ: 0 },
    reflectionQuestion: 'What happens if you walk first and use the lever afterwards?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['interact', 'moveForward', 'moveForward', 'moveForward'],
    },
    { ruleKey: 'rule.interactUsed', kind: 'functionCalledWithArgs', threshold: 1 },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m04-lever-first',
      source: 'demo/m04-lever-first.js',
      expectedCommandCount: 4,
      expectedStepCount: 4,
      notes: 'Pulls the lever from the start cell, then walks three cells east.',
    },
    {
      solutionId: 'sol-m04-step-then-lever',
      source: 'demo/m04-step-then-lever.js',
      expectedCommandCount: 5,
      expectedStepCount: 4,
      notes: 'One refused walk into the gate, then the lever, then the route; still completes.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m04-closed-gate',
      source: 'tests/m04/closed-gate.js',
      expectedFault: 'closedGate',
      reasonKey: 'gate.closed',
      notes: 'Starter code walks into the closed gate because the lever was never used.',
    },
    {
      fixtureId: 'fixture-m04-interact-nothing',
      source: 'tests/m04/interact-nothing.js',
      expectedFault: 'outOfRange',
      reasonKey: 'interact.nothing-here',
      notes: 'Calls interact() from a cell with no object in front.',
    },
    {
      fixtureId: 'fixture-m04-stops-short',
      source: 'tests/m04/stops-short.js',
      expectedFault: 'closedGate',
      reasonKey: 'goal-not-reached',
      notes: 'Opens the gate but stops before the beacon.',
    },
  ],
  accessibility: {
    keyboard: 'ArrowRight moves forward; Enter uses the object in front.',
    touch: 'Interact button enables only when an object is in range and facing.',
    captions: 'Caption strip says "gate opened" or names why the interaction failed.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Gate opens as an instant state change under reduced motion.',
    screenReader: 'Announces "gate open" and the new traversable cell.',
  },
  budgets: {
    maxCommands: 8,
    maxStepCount: 12,
    maxMissionObjects: 6,
    maxTriangles: 8000,
    estimatedActiveMinutes: 5,
  },
  rewards: [
    { rewardId: 'reward-gate-path', assetId: 'asset.map.restored-path', label: 'Restored Path', cosmetic: true },
  ],
};
