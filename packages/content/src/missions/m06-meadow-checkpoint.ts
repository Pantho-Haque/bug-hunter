import type { MissionPackageSchema } from '@codequest/domain';

/**
 * Checkpoint arena: wake the near sprite, collect the spark, wake the far
 * sprite whose flag opens the arch, then leave. Everything the zone taught in
 * one route, with the arch making the ordering non-negotiable.
 */
export const m06MeadowCheckpoint: MissionPackageSchema = {
  identity: {
    levelId: 'm06',
    zoneId: 'meadow-of-moves',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 6,
    title: 'Meadow Checkpoint',
    isCheckpoint: true,
    prerequisiteLevelIds: ['m05'],
  },
  zoneId: 'meadow-of-moves',
  curriculum: {
    primaryConcept: 'sequence',
    newConcepts: [],
    priorConcepts: ['moveForward', 'turnLeft', 'turnRight', 'collect', 'interact'],
    transferPrompt: 'Which command changed direction, and which one changed the world?',
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
      label: 'Arena entrance',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'sprite-a',
      label: 'Sleeping sprite',
      required: true,
      kind: 'interactable',
      cell: { cellX: 1, cellZ: 0 },
      actionKey: 'wake',
      range: 1,
      initialState: 'asleep',
      stateTransitions: [{ from: 'asleep', to: 'awake' }],
    },
    {
      id: 'spark-1',
      label: 'Meadow spark',
      required: true,
      kind: 'collectible',
      cell: { cellX: 2, cellZ: 0 },
      collectionEffect: 'spark',
    },
    {
      id: 'sprite-b',
      label: 'Second sleeping sprite',
      required: true,
      kind: 'interactable',
      cell: { cellX: 3, cellZ: 0 },
      actionKey: 'wake',
      range: 1,
      initialState: 'asleep',
      stateTransitions: [{ from: 'asleep', to: 'awake' }],
    },
    {
      id: 'arch-1',
      label: 'Sprite arch',
      required: true,
      kind: 'blocker',
      occupiedCells: [{ cellX: 4, cellZ: 0 }],
      reasonKey: 'arch.closed',
      unlockedByFlag: 'interactable.sprite-b.state',
    },
    {
      id: 'goal-1',
      label: 'Meadow exit',
      required: true,
      kind: 'goal',
      cell: { cellX: 5, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-everything', unlockedFromMissionId: 'm06', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'Two sprites are asleep along the arena lane. The arch opens when the far one wakes.',
    goal: 'Wake both sprites, collect the spark, and reach the exit.',
    requiredCount: 4,
    optionalCount: 0,
    newConcepts: [],
    priorConcepts: ['moveForward', 'collect', 'interact'],
    controls: ['move forward', 'turn left', 'turn right', 'collect', 'interact'],
    checklist: ['Wake the near sprite.', 'Collect the spark.', 'Wake the far sprite.', 'Leave through the arch.'],
    readAloud: 'Wake the sprite in front of you, walk on, collect the spark, wake the second sprite, then leave.',
    locale: 'en-US',
  },
  starterCode: '// Plan your route first, then write it.\ninteract();\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Write your plan as comments before you write any commands.',
      reveal: 'Four things have to happen: wake, collect, wake, leave.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'interact() and collect() both act on what is in front of you or under you.',
      scaffold: 'interact();\nmoveForward();\nmoveForward();\ncollect();',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'The arch stays shut until the second sprite is awake, so wake it before you walk on.',
      scaffold: 'interact();\nmoveForward();\nmoveForward();\ncollect();\ninteract();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Solution shown below.',
      reveal:
        'interact();\nmoveForward();\nmoveForward();\ncollect();\ninteract();\nmoveForward();\nmoveForward();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'Morning checklist',
    problem: 'Wake your sister, pack the lunch, wake your brother, then leave for school.',
    source: 'examples/morning-checklist',
    note: 'The door only opens once the last person is up, so order decides whether you get out.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'sprite-a', 'sprite-b', 'spark-1'],
    requiredFlags: {
      'interactable.sprite-a.state': true,
      'interactable.sprite-b.state': true,
    },
    requiredCollected: ['spark-1'],
    terminalCell: { cellX: 5, cellZ: 0 },
    reflectionQuestion: 'Which command changed direction, and which one changed the world?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['interact', 'moveForward', 'moveForward', 'collect', 'interact'],
    },
    { ruleKey: 'rule.orderedActions', kind: 'functionCalledWithArgs', threshold: 2 },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m06-straight-lane',
      source: 'demo/m06-straight-lane.js',
      expectedCommandCount: 8,
      expectedStepCount: 8,
      notes: 'Wake, walk twice, collect, wake, then three cells through the open arch.',
    },
    {
      solutionId: 'sol-m06-collect-ahead',
      source: 'demo/m06-collect-ahead.js',
      expectedCommandCount: 8,
      expectedStepCount: 8,
      notes: 'Collects the spark from the cell in front instead of standing on it.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m06-wrong-order',
      source: 'tests/m06/wrong-order.js',
      expectedFault: 'closedGate',
      reasonKey: 'arch.closed',
      notes: 'Walks the whole lane first; the arch is still shut at the far end.',
    },
    {
      fixtureId: 'fixture-m06-missing-sprite',
      source: 'tests/m06/missing-sprite.js',
      expectedFault: 'closedGate',
      reasonKey: 'goal-not-reached',
      notes: 'Wakes only the far sprite, so the first required flag is never set.',
    },
    {
      fixtureId: 'fixture-m06-no-spark',
      source: 'tests/m06/no-spark.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'goal-not-reached',
      notes: 'Reaches the exit with both sprites awake but no spark collected.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move and turn; Enter interacts; Space collects.',
    touch: 'Action buttons stay in a fixed order so muscle memory carries from M04.',
    captions: 'Caption strip lists which checklist items are done.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Sprite wake and arch opening are instant under reduced motion.',
    screenReader: 'Each completed checklist item is announced once.',
  },
  budgets: {
    maxCommands: 14,
    maxStepCount: 18,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 7,
  },
  rewards: [
    { rewardId: 'reward-meadow-complete', assetId: 'asset.badge.meadow', label: 'Meadow Explorer', cosmetic: true },
  ],
};
