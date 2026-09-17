import type { MissionPackageSchema } from '@codequest/domain';

/**
 * Six cells of boardwalk, built as the same three-step span twice, with a
 * railing one cell past the lamp so an extra span is refused instead of
 * wandering. The child writes crossBridge() themselves; the engine still only
 * knows moveForward, which is the point — a name for steps they already have.
 */
export const m07NameTheTrail: MissionPackageSchema = {
  identity: {
    levelId: 'm07',
    zoneId: 'echo-forest',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 1,
    title: 'Name the Trail',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m06'],
  },
  zoneId: 'echo-forest',
  curriculum: {
    primaryConcept: 'functionDeclaration',
    newConcepts: ['functionDeclaration', 'functionCall'],
    priorConcepts: ['moveForward'],
    transferPrompt: 'What do you gain by naming a group of steps instead of repeating them?',
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
      label: 'Boardwalk start',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'goal-1',
      label: 'Firefly lamp',
      required: true,
      kind: 'goal',
      cell: { cellX: 6, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
    {
      id: 'railing-1',
      label: 'End railing',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 7, cellZ: 0 }],
      reasonKey: 'railing.blocks',
    },
    {
      id: 'decor-ferns-1',
      label: 'Ferns',
      required: false,
      kind: 'decor',
      cells: [{ cellX: 3, cellZ: 1 }],
      assetId: 'asset.forest.ferns',
      interactive: false,
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-forward', unlockedFromMissionId: 'm01', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'A long boardwalk crosses the forest. The same three steps repeat twice.',
    goal: 'Reach the firefly lamp at the end of the boardwalk.',
    requiredCount: 1,
    optionalCount: 0,
    newConcepts: ['functionDeclaration', 'functionCall'],
    priorConcepts: ['moveForward'],
    controls: ['move forward'],
    checklist: ['Name the three steps of one span.', 'Call that name twice.'],
    readAloud: 'One span is three steps. Give it a name, then use the name two times.',
    locale: 'en-US',
  },
  starterCode: 'function crossBridge() {\n  // The three steps of one span go here.\n}\n\ncrossBridge();\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Count the steps in one span before you write any code.',
      reveal: 'One span is three steps. The trail has two spans.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'A function gives one name to a group of steps.',
      scaffold: 'function crossBridge() {\n  moveForward();\n  moveForward();\n  moveForward();\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Writing a function does not run it. You have to call it.',
      scaffold: 'crossBridge();\ncrossBridge();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'function crossBridge() {\n  moveForward();\n  moveForward();\n  moveForward();\n}\n\ncrossBridge();\ncrossBridge();',
    },
  ],
  analogousExample: {
    title: 'Setting one place at the table',
    problem: 'You lay out a plate, a fork, and a cup for each person at the table.',
    source: 'examples/set-the-table',
    note: 'Naming the three-item routine lets you ask for it once per seat instead of listing it again.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1'],
    requiredFlags: {},
    requiredCollected: [],
    terminalCell: { cellX: 6, cellZ: 0 },
    reflectionQuestion: 'Which three steps did you give a name to?',
  },
  conceptEvidence: [
    { ruleKey: 'rule.functionDeclared', kind: 'functionDeclared', threshold: 1 },
    { ruleKey: 'rule.functionCalled', kind: 'functionCalledWithArgs', threshold: 1 },
    {
      ruleKey: 'rule.sequence',
      expectedSequence: [
        'moveForward',
        'moveForward',
        'moveForward',
        'moveForward',
        'moveForward',
        'moveForward',
      ],
    },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m07-function',
      source: 'demo/m07-function.js',
      expectedCommandCount: 6,
      expectedStepCount: 6,
      notes: 'Declares crossBridge() as three steps and calls it twice.',
    },
    {
      solutionId: 'sol-m07-linear',
      source: 'demo/m07-linear.js',
      expectedCommandCount: 6,
      expectedStepCount: 6,
      notes: 'Six separate moveForward() calls; accepted, but the recap names the repeat.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m07-uncalled-function',
      source: 'tests/m07/uncalled-function.js',
      expectedFault: 'blockedMove',
      reasonKey: 'goal-not-reached',
      notes: 'Declares crossBridge() but never calls it, so no command ever runs.',
    },
    {
      fixtureId: 'fixture-m07-invalid-declaration',
      source: 'tests/m07/invalid-declaration.js',
      expectedFault: 'syntax',
      reasonKey: 'syntax.function-declaration',
      notes: 'Missing braces on the function body.',
    },
    {
      fixtureId: 'fixture-m07-extra-call',
      source: 'tests/m07/extra-call.js',
      expectedFault: 'blockedMove',
      reasonKey: 'railing.blocks',
      notes: 'Calls crossBridge() three times and walks into the end railing.',
    },
  ],
  accessibility: {
    keyboard: 'ArrowRight moves forward; the trace panel takes Tab focus per function call.',
    touch: 'Function calls group as one expandable row in the trace list.',
    captions: 'Caption strip names the function each command came from.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Span crossings play as instant cell changes under reduced motion.',
    screenReader: 'Announces "crossBridge, step 1 of 3" for each grouped command.',
  },
  budgets: {
    maxCommands: 10,
    maxStepCount: 12,
    maxMissionObjects: 6,
    maxTriangles: 8000,
    estimatedActiveMinutes: 6,
  },
  rewards: [
    { rewardId: 'reward-memory-leaf', assetId: 'asset.leaf.memory-leaf', label: 'Memory Leaf', cosmetic: true },
  ],
};
