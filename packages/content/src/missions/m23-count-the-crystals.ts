import type { MissionPackageSchema } from '@codequest/domain';

/**
 * A variable the child owns. Three crystals sit along an L-shaped ledge and the
 * console only deserves to be pressed once all three are in the bag, so the
 * learner keeps `let crystals = 0`, adds one per pickup, and compares before the
 * interact. The world cannot count for them: nothing here reads the bag, so the
 * number only exists in their program.
 */
export const m23CountTheCrystals: MissionPackageSchema = {
  identity: {
    levelId: 'm23',
    zoneId: 'logic-cliffs',
    apiVersion: 'v2',
    contentVersion: '2025.01',
    ordinal: 5,
    title: 'Count the Crystals',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m22'],
  },
  zoneId: 'logic-cliffs',
  curriculum: {
    primaryConcept: 'variable',
    newConcepts: ['counter', 'comparison'],
    priorConcepts: ['ifStatement', 'moveForward', 'turnLeft', 'collect', 'interact'],
    transferPrompt: 'Where does a number live when nothing in the world is holding it?',
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
      label: 'Ledge start',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'crystal-1',
      label: 'First crystal',
      required: true,
      kind: 'collectible',
      cell: { cellX: 1, cellZ: 0 },
      collectionEffect: 'crystal',
    },
    {
      id: 'crystal-2',
      label: 'Second crystal',
      required: true,
      kind: 'collectible',
      cell: { cellX: 3, cellZ: 0 },
      collectionEffect: 'crystal',
    },
    {
      id: 'crystal-3',
      label: 'Third crystal',
      required: true,
      kind: 'collectible',
      cell: { cellX: 3, cellZ: -2 },
      collectionEffect: 'crystal',
    },
    {
      id: 'console-1',
      label: 'Crystal console',
      required: true,
      kind: 'interactable',
      cell: { cellX: 3, cellZ: -3 },
      actionKey: 'press',
      range: 1,
      initialState: 'dim',
      stateTransitions: [{ from: 'dim', to: 'bright' }],
    },
    {
      id: 'crystal-gate',
      label: 'Crystal gate',
      required: true,
      kind: 'blocker',
      occupiedCells: [{ cellX: 3, cellZ: -4 }],
      reasonKey: 'gate.dim',
      unlockedByFlag: 'interactable.console-1.state',
    },
    {
      id: 'goal-1',
      label: 'Upper ledge',
      required: true,
      kind: 'goal',
      cell: { cellX: 3, cellZ: -5 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-and-turn', unlockedFromMissionId: 'm05', apiVersion: 'v2' },
    { capabilityId: 'cap-collect', unlockedFromMissionId: 'm03', apiVersion: 'v2' },
    { capabilityId: 'cap-interact', unlockedFromMissionId: 'm04', apiVersion: 'v2' },
  ],
  briefing: {
    storySentence: 'Three crystals lie along the ledge. The console wakes up when you have all three.',
    goal: 'Pick up three crystals, then press the console and go through the gate.',
    requiredCount: 4,
    optionalCount: 0,
    newConcepts: ['counter'],
    priorConcepts: ['ifStatement', 'moveForward', 'turnLeft', 'collect', 'interact'],
    controls: ['move forward', 'turn left', 'turn right', 'collect', 'interact'],
    checklist: ['Start your count at zero.', 'Add one for each crystal.', 'Press the console at three.', 'Go through the gate.'],
    readAloud: 'Start at zero. Add one each time you grab a crystal. Press the console at three.',
    locale: 'en-US',
  },
  starterCode: 'let crystals = 0;\nmoveForward();\ncollect();\ncrystals = crystals + 1;\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Count out loud as you plan. How many crystals before the console?',
      reveal: 'Three. The gate stays shut until the console is pressed.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'A box called a variable can hold your count while the run goes on.',
      scaffold: 'let crystals = 0;\ncollect();\ncrystals = crystals + 1;',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Add one right after every pickup. Then check the number before you press.',
      scaffold: 'if (crystals === 3) {\n  interact();\n}',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'let crystals = 0;\nmoveForward();\ncollect();\ncrystals = crystals + 1;\nmoveForward();\nmoveForward();\ncollect();\ncrystals = crystals + 1;\nturnLeft();\nmoveForward();\nmoveForward();\ncollect();\ncrystals = crystals + 1;\nif (crystals === 3) {\n  interact();\n}\nmoveForward();\nmoveForward();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'Counting cups',
    problem: 'You set the table for three. You count each cup as you put it down, then stop at three.',
    source: 'examples/counting-cups',
    note: 'The table does not know the number. You do, and you keep it while you work.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'crystal-1', 'crystal-2', 'crystal-3', 'console-1'],
    requiredFlags: { 'interactable.console-1.state': true },
    requiredCollected: ['crystal-1', 'crystal-2', 'crystal-3'],
    terminalCell: { cellX: 3, cellZ: -5 },
    reflectionQuestion: 'What was in your count box right before you pressed the console?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'collect', 'moveForward', 'moveForward', 'collect', 'turnLeft'],
    },
    { ruleKey: 'rule.variableUpdate', kind: 'variableUpdate', threshold: 3 },
    { ruleKey: 'rule.conditionalBranch', kind: 'conditionalBranch', threshold: 1 },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m23-count-up',
      source: 'demo/m23-count-up.js',
      expectedCommandCount: 13,
      expectedStepCount: 13,
      notes: 'East ledge for two crystals, north ledge for the third, press at three, then three steps through the gate.',
    },
    {
      solutionId: 'sol-m23-collect-ahead',
      source: 'demo/m23-collect-ahead.js',
      expectedCommandCount: 13,
      expectedStepCount: 13,
      notes: 'Same count and same route, taking each crystal from the cell in front instead of standing on it.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m23-two-crystals',
      source: 'tests/m23/two-crystals.js',
      expectedFault: 'blockedMove',
      reasonKey: 'gate.dim',
      notes: 'Counts to two, so the console press never runs and the gate stays shut.',
    },
    {
      fixtureId: 'fixture-m23-stale-variable',
      source: 'tests/m23/stale-variable.js',
      expectedFault: 'staleVariable',
      reasonKey: 'gate.dim',
      notes: 'Adds one only after the first pickup, so the count is stuck at one when the check runs.',
    },
    {
      fixtureId: 'fixture-m23-grab-empty-ledge',
      source: 'tests/m23/grab-empty-ledge.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'collect.nothing-here',
      notes: 'Collects on every cell along the ledge, including the empty one between the first two crystals.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move and turn; Space collects; Enter presses the console.',
    touch: 'The count panel stays on screen beside the ledge during the run.',
    captions: 'Caption strip prints the count before and after each change.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Crystal glow and console light are still images under reduced motion.',
    screenReader: 'Reads the new count each time it changes, and the value used in the check.',
  },
  budgets: {
    maxCommands: 20,
    maxStepCount: 22,
    maxMissionObjects: 10,
    maxTriangles: 8000,
    estimatedActiveMinutes: 9,
  },
  rewards: [
    { rewardId: 'reward-crystal-trail', assetId: 'asset.effect.crystal-trail', label: 'Crystal Trail', cosmetic: true },
  ],
};
