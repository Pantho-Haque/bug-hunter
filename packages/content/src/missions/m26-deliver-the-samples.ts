import type { MissionPackageSchema } from '@codequest/domain';

/**
 * Array plus function reuse: the three stations sit at different distances, so
 * the list holds the walk lengths — [2, 3, 1] — and one `deliver(steps)`
 * function turns each item into a walk and a drop. If the stations were evenly
 * spaced the array would be decoration; uneven spacing makes the item the only
 * thing that can say how far.
 */
export const m26DeliverTheSamples: MissionPackageSchema = {
  identity: {
    levelId: 'm26',
    zoneId: 'maker-observatory',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 2,
    title: 'Deliver the Samples',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m25'],
  },
  zoneId: 'maker-observatory',
  curriculum: {
    primaryConcept: 'arrayIteration',
    newConcepts: ['arrayOfNumbers'],
    priorConcepts: ['arrayLiteral', 'arrayIndex', 'forLoop', 'functionDeclaration', 'parameter', 'interact'],
    transferPrompt: 'Which number in the list decided how far each trip went?',
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
      label: 'Sample bench',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'station-1',
      label: 'First station',
      required: true,
      kind: 'interactable',
      cell: { cellX: 3, cellZ: 0 },
      actionKey: 'deliver',
      range: 1,
      initialState: 'empty',
      stateTransitions: [{ from: 'empty', to: 'filled' }],
    },
    {
      id: 'station-2',
      label: 'Second station',
      required: true,
      kind: 'interactable',
      cell: { cellX: 6, cellZ: 0 },
      actionKey: 'deliver',
      range: 1,
      initialState: 'empty',
      stateTransitions: [{ from: 'empty', to: 'filled' }],
    },
    {
      id: 'station-3',
      label: 'Third station',
      required: true,
      kind: 'interactable',
      cell: { cellX: 7, cellZ: 0 },
      actionKey: 'deliver',
      range: 1,
      initialState: 'empty',
      stateTransitions: [{ from: 'empty', to: 'filled' }],
    },
    {
      id: 'goal-1',
      label: 'Lab door',
      required: true,
      kind: 'goal',
      cell: { cellX: 8, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
    {
      id: 'hall-end',
      label: 'End wall',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 9, cellZ: 0 }],
      reasonKey: 'wall.blocks',
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-forward', unlockedFromMissionId: 'm01', apiVersion: 'v1' },
    { capabilityId: 'cap-interact', unlockedFromMissionId: 'm04', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'Three stations need a sample. The list says how far each one is.',
    goal: 'Give a sample to each station, then reach the lab door.',
    requiredCount: 4,
    optionalCount: 0,
    newConcepts: ['arrayOfNumbers'],
    priorConcepts: ['arrayLiteral', 'forLoop', 'functionDeclaration', 'parameter'],
    controls: ['move forward', 'interact'],
    checklist: ['Read the trip list.', 'Walk that many steps.', 'Drop the sample.', 'Do it for each number.'],
    readAloud: 'Walk the number of steps in the list. Then drop a sample.',
    locale: 'en-US',
  },
  starterCode:
    'const trip = [2, 3, 1];\n\nfunction deliver(steps) {\n  // Walk that many steps, then drop one sample.\n}\n\n// Use each number in trip.\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Walk to the first station by hand. How many steps was it?',
      reveal: 'Two steps, then a drop. The list holds that two.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'Teach deliver to walk any number of steps.',
      scaffold: 'function deliver(steps) {\n  for (let i = 0; i < steps; i++) {\n    moveForward();\n  }\n  interact();\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Hand each number in the list to your plan.',
      scaffold: 'for (let i = 0; i < trip.length; i++) {\n  deliver(trip[i]);\n}',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'const trip = [2, 3, 1];\n\nfunction deliver(steps) {\n  for (let i = 0; i < steps; i++) {\n    moveForward();\n  }\n  interact();\n}\n\nfor (let i = 0; i < trip.length; i++) {\n  deliver(trip[i]);\n}\n\nmoveForward();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'The mail round',
    problem: 'You carry mail to three homes. Each home is a different walk away.',
    source: 'examples/the-mail-round',
    note: 'One plan, three numbers. The number changes, the plan does not.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'station-1', 'station-2', 'station-3'],
    requiredFlags: {
      'interactable.station-1.state': true,
      'interactable.station-2.state': true,
      'interactable.station-3.state': true,
    },
    requiredCollected: [],
    terminalCell: { cellX: 8, cellZ: 0 },
    reflectionQuestion: 'Which number in the list decided how far each trip went?',
  },
  conceptEvidence: [
    { ruleKey: 'rule.arrayIndexed', kind: 'arrayIndexed', threshold: 1 },
    { ruleKey: 'rule.functionCalledThrice', kind: 'functionCalledWithArgs', threshold: 3 },
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'moveForward', 'interact', 'moveForward', 'moveForward', 'moveForward', 'interact'],
    },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m26-loop-with-function',
      source: 'demo/m26-loop-with-function.js',
      expectedCommandCount: 11,
      expectedStepCount: 11,
      notes: 'deliver(steps) called once per list item, then two steps to the lab door.',
    },
    {
      solutionId: 'sol-m26-expanded-route',
      source: 'demo/m26-expanded-route.js',
      expectedCommandCount: 11,
      expectedStepCount: 11,
      notes: 'The same eleven commands typed out; valid, and the recap lines them up with the list.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m26-skipped-station',
      source: 'tests/m26/skipped-station.js',
      expectedFault: 'blockedMove',
      reasonKey: 'goal-not-reached',
      notes: 'Only the first two numbers are used, so the third station stays empty.',
    },
    {
      fixtureId: 'fixture-m26-same-distance',
      source: 'tests/m26/same-distance.js',
      expectedFault: 'outOfRange',
      reasonKey: 'interact.nothing-here',
      notes: 'Every trip walks two steps, so the second drop lands between stations.',
    },
    {
      fixtureId: 'fixture-m26-duplicate-delivery',
      source: 'tests/m26/duplicate-delivery.js',
      expectedFault: 'outOfRange',
      reasonKey: 'interact.nothing-here',
      notes: 'A fourth trip is added after the list ends and drops at the end wall.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move; Enter delivers to the station in front; the array viewer is reachable by Tab.',
    touch: 'Tapping a list item pans the camera to the station it matches.',
    captions: 'Caption strip reads "trip 2 of 3: three steps" before each walk.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'The sample handover is an instant swap under reduced motion.',
    screenReader: 'Announces each delivery once and keeps the list item and world marker in sync.',
  },
  budgets: {
    maxCommands: 18,
    maxStepCount: 18,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 9,
  },
  rewards: [
    { rewardId: 'reward-courier-backpack', assetId: 'asset.gear.courier-backpack', label: 'Courier Backpack', cosmetic: true },
  ],
};
