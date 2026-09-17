import type { MissionPackageSchema } from '@codequest/domain';

/**
 * The zone opens on the smallest honest loop: one command, repeated a count the
 * child can see on the board. Four stones, four steps, a shell on the last one.
 * Deep water on every other side means the only decision left is how many times
 * to repeat, which is the whole point of a counting loop.
 */
export const m13TidalSteps: MissionPackageSchema = {
  identity: {
    levelId: 'm13',
    zoneId: 'loop-lagoon',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 1,
    title: 'Tidal Steps',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m12'],
  },
  zoneId: 'loop-lagoon',
  curriculum: {
    primaryConcept: 'countingLoop',
    newConcepts: ['forLoop', 'loopCount'],
    priorConcepts: ['moveForward', 'collect', 'functionCall'],
    transferPrompt: 'When the same step repeats, what should the code say instead of repeating it?',
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
      label: 'Tide pool edge',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'tide-water',
      label: 'Deep water',
      required: false,
      kind: 'blocker',
      occupiedCells: [
        { cellX: 1, cellZ: -1 },
        { cellX: 2, cellZ: -1 },
        { cellX: 3, cellZ: -1 },
        { cellX: 4, cellZ: -1 },
        { cellX: 5, cellZ: -1 },
        { cellX: 1, cellZ: 1 },
        { cellX: 2, cellZ: 1 },
        { cellX: 3, cellZ: 1 },
        { cellX: 4, cellZ: 1 },
        { cellX: 5, cellZ: 1 },
        { cellX: 5, cellZ: 0 },
      ],
      reasonKey: 'water.blocks',
    },
    {
      id: 'decor-stones-1',
      label: 'Stepping stones',
      required: false,
      kind: 'decor',
      cells: [
        { cellX: 1, cellZ: 0 },
        { cellX: 2, cellZ: 0 },
        { cellX: 3, cellZ: 0 },
        { cellX: 4, cellZ: 0 },
      ],
      assetId: 'asset.lagoon.stepping-stone',
      interactive: false,
    },
    {
      id: 'shell-1',
      label: 'Tide shell',
      required: true,
      kind: 'collectible',
      cell: { cellX: 4, cellZ: 0 },
      collectionEffect: 'shell',
    },
    {
      id: 'goal-1',
      label: 'Last stone',
      required: true,
      kind: 'goal',
      cell: { cellX: 4, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-forward', unlockedFromMissionId: 'm01', apiVersion: 'v1' },
    { capabilityId: 'cap-collect', unlockedFromMissionId: 'm03', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'Four flat stones cross the tide pool. A shell rests on the last one.',
    goal: 'Step across all four stones and pick up the shell.',
    requiredCount: 1,
    optionalCount: 0,
    newConcepts: ['forLoop', 'loopCount'],
    priorConcepts: ['moveForward', 'collect'],
    controls: ['move forward', 'collect'],
    checklist: ['Use a loop to step four times.', 'Pick up the shell.', 'Stop on the last stone.'],
    readAloud: 'Take four steps east. Then pick up the shell under your feet.',
    locale: 'en-US',
  },
  starterCode: '// One step is not enough. How many do you need?\nmoveForward();\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Count the stones. How many steps is that?',
      reveal: 'Four stones means four steps, then one pick up.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'A loop runs the same line again and again. Start it at zero.',
      scaffold: 'for (let i = 0; i < 2; i++) {\n  moveForward();\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Change the number so the loop runs four times, then pick up the shell.',
      scaffold: 'for (let i = 0; i < 4; i++) {\n  moveForward();\n}\ncollect();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal: 'for (let i = 0; i < 4; i++) {\n  moveForward();\n}\n\ncollect();',
    },
  ],
  analogousExample: {
    title: 'Steps to the sink',
    problem: 'You take four steps to the sink. Each step is the same size.',
    source: 'examples/steps-to-the-sink',
    note: 'Counting the steps once beats saying "step" four times out loud.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'shell-1'],
    requiredFlags: {},
    requiredCollected: ['shell-1'],
    terminalCell: { cellX: 4, cellZ: 0 },
    reflectionQuestion: 'How many times did your loop run?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'moveForward', 'moveForward', 'moveForward', 'collect'],
    },
    { ruleKey: 'rule.forLoop', kind: 'forLoop', threshold: 1 },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m13-counting-loop',
      source: 'demo/m13-counting-loop.js',
      expectedCommandCount: 5,
      expectedStepCount: 5,
      notes: 'A for loop of four moveForward calls, then one collect on the last stone.',
    },
    {
      solutionId: 'sol-m13-written-out',
      source: 'demo/m13-written-out.js',
      expectedCommandCount: 5,
      expectedStepCount: 5,
      notes: 'The same route typed as four separate calls; still valid, and the recap compares them.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m13-three-steps',
      source: 'tests/m13/three-steps.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'collect.nothing-here',
      notes: 'Loop runs three times, so the collect happens one stone short of the shell.',
    },
    {
      fixtureId: 'fixture-m13-five-steps',
      source: 'tests/m13/five-steps.js',
      expectedFault: 'blockedMove',
      reasonKey: 'water.blocks',
      notes: 'Loop runs five times and the fifth step walks into deep water.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move; Space collects; Step mode advances one loop pass at a time.',
    touch: 'Step mode has its own large button so a loop can be watched pass by pass.',
    captions: 'Caption strip reads the loop count as "step 1 of 4" on every pass.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Water shimmer and shell glint are disabled under reduced motion.',
    screenReader: 'Each loop pass announces the count and the new cell.',
  },
  budgets: {
    maxCommands: 10,
    maxStepCount: 12,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 6,
  },
  rewards: [
    { rewardId: 'reward-tide-pearl', assetId: 'asset.collectible.tide-pearl', label: 'Tide Pearl', cosmetic: true },
  ],
};
