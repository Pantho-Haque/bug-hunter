import type { MissionPackageSchema } from '@codequest/domain';

/**
 * The `else` mission. A sign at the fork points one way each run, and
 * `signPointsLeft()` reads the authored flag `world.signPointsLeft`, seeded true
 * here. The left arm ends at the bell tower; the right arm ends at a broken
 * ledge, so left-only code passes this seeding and right-only code walks off the
 * end of a path that goes nowhere.
 *
 * The second authored variant seeds `world.signPointsLeft: false` with the goal
 * and the broken ledge swapped. One package holds one startState, so proving a
 * single conditional across both seeds needs a variants field in the schema; it
 * is declared in the notes below rather than faked here.
 */
export const m20ForkInThePath: MissionPackageSchema = {
  identity: {
    levelId: 'm20',
    zoneId: 'logic-cliffs',
    apiVersion: 'v2',
    contentVersion: '2025.01',
    ordinal: 2,
    title: 'Fork in the Path',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m19'],
  },
  zoneId: 'logic-cliffs',
  curriculum: {
    primaryConcept: 'conditional',
    newConcepts: ['elseBranch'],
    priorConcepts: ['ifStatement', 'booleanState', 'moveForward', 'turnLeft', 'turnRight'],
    transferPrompt: 'Why does one program have to hold both roads at once?',
  },
  startState: {
    avatar: { cellX: 0, cellZ: 0, facing: 'north' },
    collected: [],
    inventory: {},
    flags: { 'world.signPointsLeft': true },
    stepCount: 0,
  },
  objects: [
    {
      id: 'spawn-1',
      label: 'Trail head',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'north',
    },
    {
      id: 'sign-1',
      label: 'Turning sign',
      required: false,
      kind: 'decor',
      cells: [{ cellX: 0, cellZ: -3 }],
      assetId: 'asset.prop.turning-sign',
      interactive: false,
    },
    {
      id: 'ledge-1',
      label: 'Broken ledge',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 2, cellZ: -2 }],
      reasonKey: 'ledge.broken',
    },
    {
      id: 'goal-1',
      label: 'Bell tower',
      required: true,
      kind: 'goal',
      cell: { cellX: -2, cellZ: -2 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-and-turn', unlockedFromMissionId: 'm05', apiVersion: 'v2' },
    { capabilityId: 'cap-sense-sign', unlockedFromMissionId: 'm20', apiVersion: 'v2' },
  ],
  briefing: {
    storySentence: 'The trail splits at a sign. Each run the sign points a new way.',
    goal: 'Follow the sign and reach the bell tower.',
    requiredCount: 1,
    optionalCount: 0,
    newConcepts: ['elseBranch'],
    priorConcepts: ['ifStatement', 'moveForward', 'turnLeft', 'turnRight'],
    controls: ['move forward', 'turn left', 'turn right', 'check the sign'],
    checklist: ['Walk up to the fork.', 'Ask which way the sign points.', 'Write both ways.', 'Reach the tower.'],
    readAloud: 'Walk to the fork. Ask the sign. Turn the way it points and keep going.',
    locale: 'en-US',
  },
  starterCode:
    '// Walk to the fork first.\nmoveForward();\nmoveForward();\nif (signPointsLeft()) {\n  // left road\n} else {\n  // right road\n}\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Write only the left road and run it a few times. Then write only the right road.',
      reveal: 'One road is right this run. The other road is right the next run.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'An else block holds the other road, so one program can do both.',
      scaffold: 'if (signPointsLeft()) {\n  turnLeft();\n} else {\n  turnRight();\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Put the steps after the turn inside the same block as the turn.',
      scaffold:
        'moveForward();\nmoveForward();\nif (signPointsLeft()) {\n  turnLeft();\n  moveForward();\n  moveForward();\n} else {\n  turnRight();\n  moveForward();\n  moveForward();\n}',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'moveForward();\nmoveForward();\nif (signPointsLeft()) {\n  turnLeft();\n  moveForward();\n  moveForward();\n} else {\n  turnRight();\n  moveForward();\n  moveForward();\n}',
    },
  ],
  analogousExample: {
    title: 'Which door at school',
    problem: 'Rain means you use the side door. Dry days mean you use the front door. You know both.',
    source: 'examples/which-door-at-school',
    note: 'You plan both doors once. The weather picks one for you on the day.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1'],
    requiredFlags: {},
    requiredCollected: [],
    terminalCell: { cellX: -2, cellZ: -2 },
    reflectionQuestion: 'Which part of your code ran this time, and which part waited?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'moveForward', 'turnLeft', 'moveForward', 'moveForward'],
    },
    { ruleKey: 'rule.conditionalBranch', kind: 'conditionalBranch', threshold: 1 },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m20-if-else',
      source: 'demo/m20-if-else.js',
      expectedCommandCount: 5,
      expectedStepCount: 5,
      notes: 'Two steps to the fork, then one if/else. The seeded left sign runs the left arm to the tower.',
    },
    {
      solutionId: 'sol-m20-turn-then-walk',
      source: 'demo/m20-turn-then-walk.js',
      expectedCommandCount: 5,
      expectedStepCount: 5,
      notes:
        'Same route with the turn alone inside the branch and the two steps after it, which works because both arms are the same length.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m20-right-only',
      source: 'tests/m20/right-only.js',
      expectedFault: 'blockedMove',
      reasonKey: 'ledge.broken',
      notes: 'Always turns right. With the sign seeded left, the second step hits the broken ledge.',
    },
    {
      fixtureId: 'fixture-m20-no-turn',
      source: 'tests/m20/no-turn.js',
      expectedFault: 'closedGate',
      reasonKey: 'goal-not-reached',
      notes: 'Walks past the fork without turning and stops beside the sign.',
    },
    {
      fixtureId: 'fixture-m20-mirrored-seed',
      source: 'tests/m20/mirrored-seed.js',
      expectedFault: 'blockedMove',
      reasonKey: 'ledge.broken',
      notes:
        'Second authored variant: world.signPointsLeft seeded false, with the tower east and the broken ledge west. Left-only code fails there. Running both seeds needs a per-variant startState the package format does not have yet.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move and turn; the sign answer reads with Tab before the branch runs.',
    touch: 'The sign answer stays pinned above the fork while the route plays.',
    captions: 'Caption strip prints left or right in words, not only as an arrow.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'The sign snaps to its direction with no spin under reduced motion.',
    screenReader: 'Announces the sign direction, then which branch of the code ran.',
  },
  budgets: {
    maxCommands: 10,
    maxStepCount: 12,
    maxMissionObjects: 6,
    maxTriangles: 8000,
    estimatedActiveMinutes: 7,
  },
  rewards: [
    { rewardId: 'reward-fork-banner', assetId: 'asset.banner.fork-trail', label: 'Fork Banner', cosmetic: true },
  ],
};
