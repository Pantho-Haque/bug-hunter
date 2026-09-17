import type { MissionPackageSchema } from '@codequest/domain';

/**
 * The branch picks an action rather than a road: repair the plank, or walk
 * straight over it. `canMoveForward()` is the only sensing call that reads the
 * world in front of the avatar, so the fallen plank at (3,0) is authored twice —
 * once as the interactable a child can lift, once as the gate that is solid
 * until it is lifted. `occupiedCellsByKind` keeps the last object written for a
 * cell, so `plank-gap` MUST stay after `plank-1` in this list or the gap stops
 * blocking and the check always answers yes.
 *
 * The second authored variant seeds `flags: { 'interactable.plank-1.state':
 * true }`, which is the intact bridge: the same conditional skips the repair and
 * the completion contract below still holds, because the flag it requires is
 * already set. Both seeds sharing one contract is deliberate; running both still
 * needs a per-variant startState the package format does not have yet.
 */
export const m22RepairOrPass: MissionPackageSchema = {
  identity: {
    levelId: 'm22',
    zoneId: 'logic-cliffs',
    apiVersion: 'v2',
    contentVersion: '2025.01',
    ordinal: 4,
    title: 'Repair or Pass',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m21'],
  },
  zoneId: 'logic-cliffs',
  curriculum: {
    primaryConcept: 'conditional',
    newConcepts: ['conditionalAction'],
    priorConcepts: ['ifStatement', 'elseBranch', 'predicate', 'moveForward', 'interact'],
    transferPrompt: 'When does a program do extra work, and when does it skip that work?',
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
      label: 'Near bank',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'plank-1',
      label: 'Fallen plank',
      required: true,
      kind: 'interactable',
      cell: { cellX: 3, cellZ: 0 },
      actionKey: 'lift',
      range: 1,
      initialState: 'fallen',
      stateTransitions: [{ from: 'fallen', to: 'fixed' }],
    },
    {
      id: 'plank-gap',
      label: 'Gap in the bridge',
      required: true,
      kind: 'blocker',
      occupiedCells: [{ cellX: 3, cellZ: 0 }],
      reasonKey: 'bridge.broken',
      unlockedByFlag: 'interactable.plank-1.state',
    },
    {
      id: 'goal-1',
      label: 'Far bank',
      required: true,
      kind: 'goal',
      cell: { cellX: 4, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-forward', unlockedFromMissionId: 'm01', apiVersion: 'v2' },
    { capabilityId: 'cap-interact', unlockedFromMissionId: 'm04', apiVersion: 'v2' },
    { capabilityId: 'cap-sense-path', unlockedFromMissionId: 'm16', apiVersion: 'v2' },
  ],
  briefing: {
    storySentence: 'One plank in the bridge may be down. Some days it is fine.',
    goal: 'Cross the bridge, and fix the plank only when it is down.',
    requiredCount: 1,
    optionalCount: 0,
    newConcepts: ['conditionalAction'],
    priorConcepts: ['ifStatement', 'moveForward', 'interact'],
    controls: ['move forward', 'interact', 'check the path'],
    checklist: ['Walk to the plank.', 'Ask if the way ahead is clear.', 'Fix it only if it is not.', 'Cross to the far bank.'],
    readAloud: 'Walk up to the plank. Ask if the way is clear. Fix it only if it is not.',
    locale: 'en-US',
  },
  starterCode:
    '// Walk up to the plank, then ask.\nmoveForward();\nmoveForward();\nif (!canMoveForward()) {\n  interact();\n}\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Walk straight across with no check and watch where you stop.',
      reveal: 'The step onto the plank is refused while the plank is down.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'You can ask whether the way in front of you is clear.',
      scaffold: 'if (!canMoveForward()) {\n  interact();\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Ask from the cell right before the plank, so the answer is about the plank.',
      scaffold: 'moveForward();\nmoveForward();\nif (!canMoveForward()) {\n  interact();\n}\nmoveForward();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'moveForward();\nmoveForward();\nif (!canMoveForward()) {\n  interact();\n}\nmoveForward();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'The garden gate',
    problem: 'You push the garden gate. If it does not move, you lift the latch first. Then you walk through.',
    source: 'examples/the-garden-gate',
    note: 'Lifting the latch is extra work. You only do it on the days the gate is stuck.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'plank-1'],
    requiredFlags: { 'interactable.plank-1.state': true },
    requiredCollected: [],
    terminalCell: { cellX: 4, cellZ: 0 },
    reflectionQuestion: 'On a day the plank is fine, which line of your code does nothing?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'moveForward', 'interact', 'moveForward', 'moveForward'],
    },
    { ruleKey: 'rule.conditionalBranch', kind: 'conditionalBranch', threshold: 1 },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m22-repair-branch',
      source: 'demo/m22-repair-branch.js',
      expectedCommandCount: 5,
      expectedStepCount: 5,
      notes: 'Broken seed: two steps, the check answers no, the plank is lifted, then two steps to the far bank.',
    },
    {
      solutionId: 'sol-m22-intact-seed',
      source: 'demo/m22-intact-seed.js',
      expectedCommandCount: 4,
      expectedStepCount: 4,
      notes:
        'Same program on the second authored variant, which seeds interactable.plank-1.state true: the check answers yes, the repair is skipped, and four steps cross.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m22-skipped-repair',
      source: 'tests/m22/skipped-repair.js',
      expectedFault: 'blockedMove',
      reasonKey: 'bridge.broken',
      notes: 'Walks the whole span with no check, so the step onto the fallen plank is refused.',
    },
    {
      fixtureId: 'fixture-m22-early-interact',
      source: 'tests/m22/early-interact.js',
      expectedFault: 'outOfRange',
      reasonKey: 'interact.nothing-here',
      notes: 'Lifts before walking, from a cell with nothing in front of it.',
    },
    {
      fixtureId: 'fixture-m22-stops-short',
      source: 'tests/m22/stops-short.js',
      expectedFault: 'closedGate',
      reasonKey: 'goal-not-reached',
      notes: 'Fixes the plank but stops on it instead of stepping to the far bank.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move; Enter lifts the plank; Tab reads the path check answer.',
    touch: 'The path check answer appears over the plank while the avatar stands beside it.',
    captions: 'Caption strip says whether the way was clear, then whether a repair happened.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'The plank snaps into place with no swing under reduced motion.',
    screenReader: 'Announces the check answer and names the branch that ran.',
  },
  budgets: {
    maxCommands: 10,
    maxStepCount: 12,
    maxMissionObjects: 6,
    maxTriangles: 8000,
    estimatedActiveMinutes: 7,
  },
  rewards: [
    { rewardId: 'reward-repair-sparks', assetId: 'asset.effect.repair-sparks', label: 'Repair Sparks', cosmetic: true },
  ],
};
