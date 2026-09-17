import type { MissionPackageSchema } from '@codequest/domain';

/**
 * Planning mission. Nothing here is new: two crystals, a rock to go around, a
 * tide wheel that opens the gate. What is new is that the order is the child's
 * to choose — the rock splits the floor into a north way and a south way, and
 * both reach every objective, so the starter code is a list of plan comments
 * rather than a shape to fill in.
 */
export const m29PlanTheRescue: MissionPackageSchema = {
  identity: {
    levelId: 'm29',
    zoneId: 'maker-observatory',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 5,
    title: 'Plan the Rescue',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m28'],
  },
  zoneId: 'maker-observatory',
  curriculum: {
    primaryConcept: 'planning',
    newConcepts: ['planComments', 'decompose'],
    priorConcepts: ['forLoop', 'functionDeclaration', 'arrayLiteral', 'collect', 'interact', 'turnLeft', 'turnRight'],
    transferPrompt: 'Did writing the plan first change how many times you had to run the code?',
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
      label: 'Work floor',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'crystal-1',
      label: 'Near crystal',
      required: true,
      kind: 'collectible',
      cell: { cellX: 1, cellZ: 0 },
      collectionEffect: 'crystal',
    },
    {
      id: 'crystal-2',
      label: 'Low crystal',
      required: true,
      kind: 'collectible',
      cell: { cellX: 2, cellZ: 2 },
      collectionEffect: 'crystal',
    },
    {
      id: 'rock-pile',
      label: 'Rock pile',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 3, cellZ: 0 }],
      reasonKey: 'rock.blocks',
    },
    {
      id: 'wheel-1',
      label: 'Tide wheel',
      required: true,
      kind: 'interactable',
      cell: { cellX: 4, cellZ: 1 },
      actionKey: 'turn',
      range: 1,
      initialState: 'still',
      stateTransitions: [{ from: 'still', to: 'turning' }],
    },
    {
      id: 'gate-1',
      label: 'Water gate',
      required: true,
      kind: 'blocker',
      occupiedCells: [{ cellX: 5, cellZ: 0 }],
      reasonKey: 'gate.closed',
      unlockedByFlag: 'interactable.wheel-1.state',
    },
    {
      id: 'goal-1',
      label: 'Rescue exit',
      required: true,
      kind: 'goal',
      cell: { cellX: 6, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
    {
      id: 'lane-end',
      label: 'Far wall',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 7, cellZ: 0 }],
      reasonKey: 'wall.blocks',
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-everything', unlockedFromMissionId: 'm06', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'Two crystals, one rock in the way, and a wheel that opens the gate.',
    goal: 'Take both crystals, turn the wheel, and reach the exit.',
    requiredCount: 4,
    optionalCount: 0,
    newConcepts: ['planComments'],
    priorConcepts: ['forLoop', 'functionDeclaration', 'collect', 'interact'],
    controls: ['move forward', 'turn left', 'turn right', 'collect', 'interact'],
    checklist: ['Write your plan as comments.', 'Take both crystals.', 'Turn the tide wheel.', 'Walk out the open gate.'],
    readAloud: 'Write the plan first. Then turn each line into code.',
    locale: 'en-US',
  },
  starterCode:
    '// Write your plan first. One line for each thing you must do.\n// 1. Take the near crystal.\n// 2. Take the low crystal.\n// 3. Turn the tide wheel.\n// 4. Walk out the open gate.\n\n// Now turn each line into code.\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Name the four things you must do. Which one must come last?',
      reveal: 'The gate is last, because the wheel must turn first.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'Start with the near crystal. It is right in front of you.',
      scaffold: 'collect();\nmoveForward();\nmoveForward();',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'The rock is in the way. Go around it and reach the wheel.',
      scaffold: 'turnRight();\nmoveForward();\ncollect();\nturnLeft();\nmoveForward();\ninteract();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is one full answer.',
      reveal:
        'collect();\nmoveForward();\nmoveForward();\nturnRight();\nmoveForward();\ncollect();\nturnLeft();\nmoveForward();\ninteract();\nmoveForward();\nturnLeft();\nmoveForward();\nturnRight();\nmoveForward();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'Packing for a trip',
    problem: 'You make a list before you pack. Then you tick off each line.',
    source: 'examples/packing-for-a-trip',
    note: 'The list is not the packing. It is what keeps you from missing a sock.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'crystal-1', 'crystal-2', 'wheel-1', 'gate-1'],
    requiredFlags: {
      'interactable.wheel-1.state': true,
    },
    requiredCollected: ['crystal-1', 'crystal-2'],
    terminalCell: { cellX: 6, cellZ: 0 },
    reflectionQuestion: 'Which part of your plan did you have to do before the others?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['collect', 'collect', 'interact'],
    },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m29-south-first',
      source: 'demo/m29-south-first.js',
      expectedCommandCount: 15,
      expectedStepCount: 15,
      notes: 'Near crystal, south around the rock for the low crystal, wheel, then back up to the gate.',
    },
    {
      solutionId: 'sol-m29-wheel-first',
      source: 'demo/m29-wheel-first.js',
      expectedCommandCount: 25,
      expectedStepCount: 25,
      notes: 'North around the rock to the wheel, back west for the low crystal, then out; longer but valid.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m29-gate-first',
      source: 'tests/m29/gate-first.js',
      expectedFault: 'closedGate',
      reasonKey: 'gate.closed',
      notes: 'The route heads for the exit before the wheel turns, so the water gate is still shut.',
    },
    {
      fixtureId: 'fixture-m29-one-crystal',
      source: 'tests/m29/one-crystal.js',
      expectedFault: 'blockedMove',
      reasonKey: 'goal-not-reached',
      notes: 'The low crystal is skipped; the avatar stands on the exit with one crystal missing.',
    },
    {
      fixtureId: 'fixture-m29-through-the-rock',
      source: 'tests/m29/through-the-rock.js',
      expectedFault: 'blockedMove',
      reasonKey: 'rock.blocks',
      notes: 'The plan walks straight east and meets the rock pile instead of going around it.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move and turn; Enter turns the wheel; the plan comments keep editor focus order.',
    touch: 'Plan cards can be dragged into the editor as comment lines before any code is typed.',
    captions: 'Caption strip ticks each plan line as its objective completes.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'The wheel turn and the gate opening are instant under reduced motion.',
    screenReader: 'Announces crystals held, wheel state, and whether the gate is open.',
  },
  budgets: {
    maxCommands: 26,
    maxStepCount: 26,
    maxMissionObjects: 12,
    maxTriangles: 9000,
    estimatedActiveMinutes: 12,
  },
  rewards: [
    { rewardId: 'reward-observatory-restored', assetId: 'asset.scene.observatory-restored', label: 'Restored Dome', cosmetic: true },
  ],
};
