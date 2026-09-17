import type { MissionPackageSchema } from '@codequest/domain';

/**
 * First array mission: three star pads sit in a row in the order the star list
 * names them, so the list length is the loop count and the index is the pad.
 * The pads are one cell apart, which makes the loop body the smallest it can
 * be — light the pad in front, step on — and leaves the array as the only
 * thing that says "three".
 */
export const m25StarList: MissionPackageSchema = {
  identity: {
    levelId: 'm25',
    zoneId: 'maker-observatory',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 1,
    title: 'Star List',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m24'],
  },
  zoneId: 'maker-observatory',
  curriculum: {
    primaryConcept: 'arrayLiteral',
    newConcepts: ['arrayLiteral', 'arrayIndex', 'arrayLength'],
    priorConcepts: ['forLoop', 'loopBody', 'moveForward', 'interact'],
    transferPrompt: 'How did the list decide how many times the loop ran?',
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
      label: 'Dome floor',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'pad-blue',
      label: 'Blue pad',
      required: true,
      kind: 'interactable',
      cell: { cellX: 1, cellZ: 0 },
      actionKey: 'light',
      range: 1,
      initialState: 'dark',
      stateTransitions: [{ from: 'dark', to: 'lit' }],
    },
    {
      id: 'pad-gold',
      label: 'Gold pad',
      required: true,
      kind: 'interactable',
      cell: { cellX: 2, cellZ: 0 },
      actionKey: 'light',
      range: 1,
      initialState: 'dark',
      stateTransitions: [{ from: 'dark', to: 'lit' }],
    },
    {
      id: 'pad-violet',
      label: 'Violet pad',
      required: true,
      kind: 'interactable',
      cell: { cellX: 3, cellZ: 0 },
      actionKey: 'light',
      range: 1,
      initialState: 'dark',
      stateTransitions: [{ from: 'dark', to: 'lit' }],
    },
    {
      id: 'goal-1',
      label: 'Star cradle',
      required: true,
      kind: 'goal',
      cell: { cellX: 4, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
    {
      id: 'dome-rail',
      label: 'Dome rail',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 5, cellZ: 0 }],
      reasonKey: 'rail.blocks',
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-forward', unlockedFromMissionId: 'm01', apiVersion: 'v1' },
    { capabilityId: 'cap-interact', unlockedFromMissionId: 'm04', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'The star list names three colors. Three pads wait in that same order.',
    goal: 'Light all three pads, then stand on the star cradle.',
    requiredCount: 4,
    optionalCount: 0,
    newConcepts: ['arrayLiteral', 'arrayIndex'],
    priorConcepts: ['forLoop', 'moveForward', 'interact'],
    controls: ['move forward', 'interact'],
    checklist: ['Read the star list.', 'Light the pad in front of you.', 'Step on and do it again.', 'Stop on the cradle.'],
    readAloud: 'Light a pad, then step on. The list tells you how many.',
    locale: 'en-US',
  },
  starterCode:
    'const stars = ["blue", "gold", "violet"];\n\nfor (let i = 0; i < stars.length; i++) {\n  // Light the pad for stars[i], then step on.\n}\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Read the star list out loud. How many colors do you count?',
      reveal: 'Three colors means three pads.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'Light one pad by hand. Write down what you did.',
      scaffold: 'interact();\nmoveForward();',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Let the list count the pads for you.',
      scaffold: 'for (let i = 0; i < stars.length; i++) {\n  interact();\n  moveForward();\n}',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'const stars = ["blue", "gold", "violet"];\n\nfor (let i = 0; i < stars.length; i++) {\n  interact();\n  moveForward();\n}\n\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'The shopping list',
    problem: 'You hold a list of three things. You get each one in turn.',
    source: 'examples/the-shopping-list',
    note: 'The list says what to get and how many. You never count in your head.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'pad-blue', 'pad-gold', 'pad-violet'],
    requiredFlags: {
      'interactable.pad-blue.state': true,
      'interactable.pad-gold.state': true,
      'interactable.pad-violet.state': true,
    },
    requiredCollected: [],
    terminalCell: { cellX: 4, cellZ: 0 },
    reflectionQuestion: 'How did the list tell your loop when to stop?',
  },
  conceptEvidence: [
    { ruleKey: 'rule.arrayIndexed', kind: 'arrayIndexed', threshold: 1 },
    { ruleKey: 'rule.forLoop', kind: 'forLoop', threshold: 1 },
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['interact', 'moveForward', 'interact', 'moveForward'],
    },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m25-indexed-loop',
      source: 'demo/m25-indexed-loop.js',
      expectedCommandCount: 7,
      expectedStepCount: 7,
      notes: 'A loop over stars.length lights each pad, then one step reaches the cradle.',
    },
    {
      solutionId: 'sol-m25-direct-index',
      source: 'demo/m25-direct-index.js',
      expectedCommandCount: 7,
      expectedStepCount: 7,
      notes: 'stars[0], stars[1], stars[2] written out; accepted, and the recap shows the loop is shorter.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m25-wrong-order',
      source: 'tests/m25/wrong-order.js',
      expectedFault: 'outOfRange',
      reasonKey: 'interact.nothing-here',
      notes: 'Steps past a pad before lighting it, so the light lands on empty floor.',
    },
    {
      fixtureId: 'fixture-m25-index-too-far',
      source: 'tests/m25/index-too-far.js',
      expectedFault: 'outOfRange',
      reasonKey: 'interact.nothing-here',
      notes: 'The loop runs four times, one past the end of the list; the fourth light has no pad.',
    },
    {
      fixtureId: 'fixture-m25-two-pads',
      source: 'tests/m25/two-pads.js',
      expectedFault: 'blockedMove',
      reasonKey: 'goal-not-reached',
      notes: 'The loop stops after two pads, so the violet pad stays dark.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move; Enter lights the pad in front; Tab moves focus through the array viewer.',
    touch: 'The array viewer is tappable and each item reads its color name aloud.',
    captions: 'Caption strip names the current list item as "item 2 of 3: gold".',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Pads switch to lit with no glow pulse under reduced motion.',
    screenReader: 'Announces the highlighted list item and the pad it matches.',
  },
  budgets: {
    maxCommands: 12,
    maxStepCount: 12,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 8,
  },
  rewards: [
    { rewardId: 'reward-star-core-1', assetId: 'asset.core.star-one', label: 'Star Core 1', cosmetic: true },
  ],
};
