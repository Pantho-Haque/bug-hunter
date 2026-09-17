import type { MissionPackageSchema } from '@codequest/domain';

/**
 * The bridge level: a loop that does the same thing every pass is no longer
 * enough, because half the boards are empty. `isPearlHere()` reads the board
 * under the avatar, so the collect has to sit behind a question rather than run
 * blind. Grabbing at every board really does fail here — the empty boards sit
 * in front of pearls, so a blind loop picks one up early and then grabs at a
 * board it has already emptied.
 */
export const m17PearlsOnAlternateTiles: MissionPackageSchema = {
  identity: {
    levelId: 'm17',
    zoneId: 'loop-lagoon',
    apiVersion: 'v2',
    contentVersion: '2025.01',
    ordinal: 5,
    title: 'Pearls on Alternate Tiles',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m16'],
  },
  zoneId: 'loop-lagoon',
  curriculum: {
    primaryConcept: 'conditionInLoop',
    newConcepts: ['ifStatement'],
    priorConcepts: ['forLoop', 'whileLoop', 'predicate', 'moveForward', 'collect'],
    transferPrompt: 'When a step should only sometimes happen, what goes around it?',
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
      id: 'lagoon-water',
      label: 'Open water',
      required: false,
      kind: 'blocker',
      occupiedCells: [
        { cellX: 1, cellZ: -1 },
        { cellX: 2, cellZ: -1 },
        { cellX: 3, cellZ: -1 },
        { cellX: 4, cellZ: -1 },
        { cellX: 5, cellZ: -1 },
        { cellX: 6, cellZ: -1 },
        { cellX: 1, cellZ: 1 },
        { cellX: 2, cellZ: 1 },
        { cellX: 3, cellZ: 1 },
        { cellX: 4, cellZ: 1 },
        { cellX: 5, cellZ: 1 },
        { cellX: 6, cellZ: 1 },
        { cellX: 7, cellZ: 0 },
      ],
      reasonKey: 'water.blocks',
    },
    {
      id: 'pearl-1',
      label: 'First pearl',
      required: true,
      kind: 'collectible',
      cell: { cellX: 1, cellZ: 0 },
      collectionEffect: 'pearl',
    },
    {
      id: 'pearl-2',
      label: 'Second pearl',
      required: true,
      kind: 'collectible',
      cell: { cellX: 3, cellZ: 0 },
      collectionEffect: 'pearl',
    },
    {
      id: 'pearl-3',
      label: 'Third pearl',
      required: true,
      kind: 'collectible',
      cell: { cellX: 5, cellZ: 0 },
      collectionEffect: 'pearl',
    },
    {
      id: 'goal-1',
      label: 'Boardwalk end',
      required: true,
      kind: 'goal',
      cell: { cellX: 6, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-forward', unlockedFromMissionId: 'm01', apiVersion: 'v2' },
    { capabilityId: 'cap-collect', unlockedFromMissionId: 'm03', apiVersion: 'v2' },
    { capabilityId: 'cap-sense-pearl', unlockedFromMissionId: 'm17', apiVersion: 'v2' },
  ],
  briefing: {
    storySentence: 'Six boards cross the lagoon. Only some of them hold a pearl.',
    goal: 'Pick up all three pearls without grabbing at an empty board.',
    requiredCount: 3,
    optionalCount: 0,
    newConcepts: ['ifStatement'],
    priorConcepts: ['forLoop', 'predicate', 'moveForward', 'collect'],
    controls: ['move forward', 'collect', 'check for a pearl'],
    checklist: ['Step onto each board.', 'Ask if a pearl is here.', 'Pick up only when the answer is yes.'],
    readAloud: 'Step onto a board. Ask if a pearl is here. Pick it up only then.',
    locale: 'en-US',
  },
  starterCode:
    '// Six boards. Ask before you grab.\nfor (let i = 0; i < 6; i++) {\n  moveForward();\n  // Only pick up when a pearl is here.\n}\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Try grabbing on every board. Watch which grab gets refused.',
      reveal: 'Some boards are empty. A grab there is refused and your run stops.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'You can ask whether a pearl is on the board under you.',
      scaffold: 'if (isPearlHere()) {\n  collect();\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Put that question inside the loop, right after the step.',
      scaffold: 'for (let i = 0; i < 6; i++) {\n  moveForward();\n  if (isPearlHere()) {\n    collect();\n  }\n}',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal: 'for (let i = 0; i < 6; i++) {\n  moveForward();\n  if (isPearlHere()) {\n    collect();\n  }\n}',
    },
  ],
  analogousExample: {
    title: 'Lockers in a row',
    problem: 'You walk past six lockers. You open only the ones with your name on them.',
    source: 'examples/lockers-in-a-row',
    note: 'You still walk past every locker. The question only decides whether you open it.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'pearl-1', 'pearl-2', 'pearl-3'],
    requiredFlags: {},
    requiredCollected: ['pearl-1', 'pearl-2', 'pearl-3'],
    terminalCell: { cellX: 6, cellZ: 0 },
    reflectionQuestion: 'Which boards made your question say no?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'collect', 'moveForward', 'moveForward', 'collect'],
    },
    { ruleKey: 'rule.conditionalBranch', kind: 'conditionalBranch', threshold: 1 },
    { ruleKey: 'rule.forLoop', kind: 'forLoop', threshold: 1 },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m17-condition-in-loop',
      source: 'demo/m17-condition-in-loop.js',
      expectedCommandCount: 9,
      expectedStepCount: 9,
      notes: 'A six-pass loop that steps every pass and collects only when isPearlHere is true.',
    },
    {
      solutionId: 'sol-m17-counted-pairs',
      source: 'demo/m17-counted-pairs.js',
      expectedCommandCount: 9,
      expectedStepCount: 9,
      notes: 'Three passes of step, collect, step; valid, and the recap compares it with the question.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m17-grab-everywhere',
      source: 'tests/m17/grab-everywhere.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'collect.already-collected',
      notes: 'Collecting on every pass takes the next pearl early, then grabs at the emptied board.',
    },
    {
      fixtureId: 'fixture-m17-missed-pearl',
      source: 'tests/m17/missed-pearl.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'goal-not-reached',
      notes: 'The question is asked before the step, so the first pearl is walked past.',
    },
    {
      fixtureId: 'fixture-m17-short-loop',
      source: 'tests/m17/short-loop.js',
      expectedFault: 'closedGate',
      reasonKey: 'goal-not-reached',
      notes: 'The loop runs five times, so the run ends one board short of the end.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move; Space collects; Step mode advances one board at a time.',
    touch: 'The yes or no panel sits beside the board so both can be read at once.',
    captions: 'Caption strip prints the pearl check for every board before the grab.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Pearl shine and water ripple are still images under reduced motion.',
    screenReader: 'Each board announces its check result and whether a pearl was taken.',
  },
  budgets: {
    maxCommands: 16,
    maxStepCount: 18,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 9,
  },
  rewards: [
    { rewardId: 'reward-tide-map', assetId: 'asset.map.tide-reveal', label: 'Tide Map', cosmetic: true },
  ],
};
