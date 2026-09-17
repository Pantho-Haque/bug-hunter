import type { MissionPackageSchema } from '@codequest/domain';

/**
 * A trunk running east with two side branches and a marker at the far end.
 * Every leg starts with the same two steps and then turns a different way, so
 * the shared part is worth a name and the endings have to stay at the call
 * sites. Same beginning, different ending.
 */
export const m10PackAPath: MissionPackageSchema = {
  identity: {
    levelId: 'm10',
    zoneId: 'echo-forest',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 4,
    title: 'Pack a Path',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m09'],
  },
  zoneId: 'echo-forest',
  curriculum: {
    primaryConcept: 'functionReuse',
    newConcepts: ['sharedPrefix'],
    priorConcepts: ['functionDeclaration', 'functionCall', 'moveForward', 'turnLeft', 'turnRight', 'collect'],
    transferPrompt: 'Which part of the three routes belongs inside the function, and which part does not?',
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
      label: 'Trail head',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'trees-1',
      label: 'Tall pines',
      required: false,
      kind: 'blocker',
      occupiedCells: [
        { cellX: 1, cellZ: -1 },
        { cellX: 3, cellZ: -1 },
        { cellX: 5, cellZ: -1 },
        { cellX: 1, cellZ: 1 },
        { cellX: 3, cellZ: 1 },
        { cellX: 5, cellZ: 1 },
      ],
      reasonKey: 'trees.block',
    },
    {
      id: 'marker-a',
      label: 'North marker',
      required: true,
      kind: 'collectible',
      cell: { cellX: 2, cellZ: -1 },
      collectionEffect: 'marker',
    },
    {
      id: 'marker-b',
      label: 'South marker',
      required: true,
      kind: 'collectible',
      cell: { cellX: 4, cellZ: 1 },
      collectionEffect: 'marker',
    },
    {
      id: 'marker-c',
      label: 'End marker',
      required: true,
      kind: 'collectible',
      cell: { cellX: 6, cellZ: 0 },
      collectionEffect: 'marker',
    },
    {
      id: 'goal-1',
      label: 'Map stone',
      required: true,
      kind: 'goal',
      cell: { cellX: 7, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-and-turn', unlockedFromMissionId: 'm05', apiVersion: 'v1' },
    { capabilityId: 'cap-collect', unlockedFromMissionId: 'm03', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'Three markers hide along the trail. Each one starts with the same two steps.',
    goal: 'Pick up all three markers and reach the map stone.',
    requiredCount: 4,
    optionalCount: 0,
    newConcepts: ['sharedPrefix'],
    priorConcepts: ['functionDeclaration', 'functionCall', 'collect'],
    controls: ['move forward', 'turn left', 'turn right', 'collect'],
    checklist: ['Walk two steps up the trail.', 'Turn the right way for this branch.', 'Pick up the marker.', 'Come back to the trail.'],
    readAloud: 'Walk two steps, turn, and take the marker. Then come back and do it again.',
    locale: 'en-US',
  },
  starterCode: 'function walkTrail() {\n  // The two steps every branch shares.\n}\n\nwalkTrail();\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Trace all three routes with your finger. Where do they split?',
      reveal: 'Every branch starts with the same two steps. Only the turn is new.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'Put the two shared steps in a function. Leave the turns outside it.',
      scaffold: 'function walkTrail() {\n  moveForward();\n  moveForward();\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'After each marker, turn twice to face back and return to the trail.',
      scaffold: 'walkTrail();\nturnLeft();\nmoveForward();\ncollect();\nturnRight();\nturnRight();\nmoveForward();\nturnLeft();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'function walkTrail() {\n  moveForward();\n  moveForward();\n}\n\nwalkTrail();\nturnLeft();\nmoveForward();\ncollect();\nturnRight();\nturnRight();\nmoveForward();\nturnLeft();\nwalkTrail();\nturnRight();\nmoveForward();\ncollect();\nturnRight();\nturnRight();\nmoveForward();\nturnRight();\nwalkTrail();\ncollect();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'Three stops on one street',
    problem: 'You walk the same block to the shop, the park, and a friend. Only the last turn is new.',
    source: 'examples/three-stops',
    note: 'The walk is shared; only the last turn tells the three trips apart.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'marker-a', 'marker-b', 'marker-c'],
    requiredFlags: {},
    requiredCollected: ['marker-a', 'marker-b', 'marker-c'],
    terminalCell: { cellX: 7, cellZ: 0 },
    reflectionQuestion: 'Which steps were the same on all three branches?',
  },
  conceptEvidence: [
    { ruleKey: 'rule.functionDeclared', kind: 'functionDeclared', threshold: 1 },
    { ruleKey: 'rule.sharedPrefixCalled', kind: 'functionCalledWithArgs', threshold: 3 },
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'moveForward', 'turnLeft', 'moveForward', 'collect'],
    },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m10-shared-prefix',
      source: 'demo/m10-shared-prefix.js',
      expectedCommandCount: 22,
      expectedStepCount: 22,
      notes: 'walkTrail() called three times, with the branch turns written at each call site.',
    },
    {
      solutionId: 'sol-m10-south-first',
      source: 'demo/m10-south-first.js',
      expectedCommandCount: 26,
      expectedStepCount: 26,
      notes: 'Takes the south branch before the north one; longer, but the same shared function.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m10-wrong-final-turn',
      source: 'tests/m10/wrong-final-turn.js',
      expectedFault: 'blockedMove',
      reasonKey: 'trees.block',
      notes: 'Turns the same way on every branch and walks into the pines.',
    },
    {
      fixtureId: 'fixture-m10-skipped-marker',
      source: 'tests/m10/skipped-marker.js',
      expectedFault: 'blockedMove',
      reasonKey: 'goal-not-reached',
      notes: 'Runs straight to the map stone with only the end marker collected.',
    },
    {
      fixtureId: 'fixture-m10-turn-inside-function',
      source: 'tests/m10/turn-inside-function.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'collect.nothing-here',
      notes: 'Puts the branch turn inside walkTrail(), so the second branch lands on empty ground.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move and turn; Space picks up the marker under or ahead of you.',
    touch: 'Minimap marks collected branches so the child can see which are done.',
    captions: 'Caption strip says which branch is finished and how many markers remain.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Marker pickup is an instant swap with no spin under reduced motion.',
    screenReader: 'Announces "marker 2 of 3" after each pickup.',
  },
  budgets: {
    maxCommands: 30,
    maxStepCount: 34,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 9,
  },
  rewards: [
    { rewardId: 'reward-forest-map', assetId: 'asset.map.forest-restored', label: 'Forest Map', cosmetic: true },
  ],
};
