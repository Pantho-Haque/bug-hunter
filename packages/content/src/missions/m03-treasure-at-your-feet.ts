import type { MissionPackageSchema } from '@codequest/domain';

/**
 * Straight east trail with a seed pod two cells along and the beacon one cell
 * past it. Reaching the beacon is not enough: the pod has to be collected, so
 * `collect()` reads as its own action rather than a side effect of walking.
 */
export const m03TreasureAtYourFeet: MissionPackageSchema = {
  identity: {
    levelId: 'm03',
    zoneId: 'meadow-of-moves',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 3,
    title: 'Treasure at Your Feet',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m02'],
  },
  zoneId: 'meadow-of-moves',
  curriculum: {
    primaryConcept: 'sequence',
    newConcepts: ['collect'],
    priorConcepts: ['moveForward', 'turnRight'],
    transferPrompt: 'What has to be true about where you stand before you can pick something up?',
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
      label: 'Trailhead',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'pod-1',
      label: 'Glowing seed pod',
      required: true,
      kind: 'collectible',
      cell: { cellX: 2, cellZ: 0 },
      collectionEffect: 'seed',
    },
    {
      id: 'goal-1',
      label: 'Beacon',
      required: true,
      kind: 'goal',
      cell: { cellX: 3, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
    {
      id: 'decor-grass-1',
      label: 'Tuft of grass',
      required: false,
      kind: 'decor',
      cells: [{ cellX: 1, cellZ: -1 }],
      assetId: 'asset.grass.tuft',
      interactive: false,
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-forward', unlockedFromMissionId: 'm01', apiVersion: 'v1' },
    { capabilityId: 'cap-collect', unlockedFromMissionId: 'm03', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'A seed pod glows on the trail. Pick it up on your way to the beacon.',
    goal: 'Collect the seed pod and reach the beacon.',
    requiredCount: 2,
    optionalCount: 0,
    newConcepts: ['collect'],
    priorConcepts: ['moveForward'],
    controls: ['move forward', 'collect'],
    checklist: ['Stand on or in front of the pod.', 'Collect it before you walk on.'],
    readAloud: 'Walk to the seed pod, collect it, then walk on to the beacon.',
    locale: 'en-US',
  },
  starterCode: 'moveForward();\ncollect();\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Run your code and watch the message when collect() runs.',
      reveal: 'collect() only works when the pod is on your cell or right in front of you.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'Walk until you are standing on the pod, then collect it.',
      scaffold: 'moveForward();\nmoveForward();\ncollect();',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'The beacon is one cell past the pod, so keep walking after you collect.',
      scaffold: 'moveForward();\nmoveForward();\ncollect();\nmoveForward();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal: 'moveForward();\nmoveForward();\ncollect();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'Picking up a dropped glove',
    problem: 'Walk to the glove on the path, pick it up, then carry on.',
    source: 'examples/pick-up-glove',
    note: 'Stopping to pick something up is a separate action from walking past it.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'pod-1'],
    requiredFlags: {},
    requiredCollected: ['pod-1'],
    terminalCell: { cellX: 3, cellZ: 0 },
    reflectionQuestion: 'What does collect() do if there is nothing on your cell?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'moveForward', 'collect', 'moveForward'],
    },
    { ruleKey: 'rule.collectUsed', kind: 'functionCalledWithArgs', threshold: 1 },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m03-stand-on-pod',
      source: 'demo/m03-stand-on-pod.js',
      expectedCommandCount: 4,
      expectedStepCount: 4,
      notes: 'Walks onto the pod cell, collects, then steps to the beacon.',
    },
    {
      solutionId: 'sol-m03-reach-ahead',
      source: 'demo/m03-reach-ahead.js',
      expectedCommandCount: 4,
      expectedStepCount: 4,
      notes: 'Collects the pod from the cell in front, then walks two cells on.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m03-early-collect',
      source: 'tests/m03/early-collect.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'collect.nothing-here',
      notes: 'Starter code collects from the trailhead, two cells short of the pod.',
    },
    {
      fixtureId: 'fixture-m03-walk-past',
      source: 'tests/m03/walk-past.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'goal-not-reached',
      notes: 'Reaches the beacon without ever collecting the pod.',
    },
    {
      fixtureId: 'fixture-m03-double-collect',
      source: 'tests/m03/double-collect.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'collect.already-collected',
      notes: 'Collects the same pod twice; the second call is rejected.',
    },
  ],
  accessibility: {
    keyboard: 'ArrowRight moves forward; Space collects on the current cell.',
    touch: 'Collect button enables only when a pod is in range.',
    captions: 'Caption strip says "seed pod collected" or "nothing here".',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'Pod sparkle is a static highlight under reduced motion.',
    screenReader: 'Collect announces the object label and the cell it came from.',
  },
  budgets: {
    maxCommands: 8,
    maxStepCount: 12,
    maxMissionObjects: 6,
    maxTriangles: 8000,
    estimatedActiveMinutes: 4,
  },
  rewards: [
    { rewardId: 'reward-seed-satchel', assetId: 'asset.cosmetic.seed-satchel', label: 'Seed Satchel', cosmetic: true },
  ],
};
