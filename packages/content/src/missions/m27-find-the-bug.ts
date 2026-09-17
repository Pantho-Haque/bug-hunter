import type { MissionPackageSchema } from '@codequest/domain';

/**
 * Debugging mission. The starter code is complete and confident and wrong: it
 * turns left at the corner where the route turns right. The mirror stack sits
 * on the cell the wrong turn walks into, so the trace stops on a line the child
 * can point at, and the fix is one word. Everything else in the starter is
 * correct, which is the lesson — a bug is usually small and findable, not a
 * reason to start over.
 */
export const m27FindTheBug: MissionPackageSchema = {
  identity: {
    levelId: 'm27',
    zoneId: 'maker-observatory',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 3,
    title: 'Find the Bug',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m26'],
  },
  zoneId: 'maker-observatory',
  curriculum: {
    primaryConcept: 'debugging',
    newConcepts: ['readTrace', 'fixOneLine'],
    priorConcepts: ['moveForward', 'turnLeft', 'turnRight'],
    transferPrompt: 'Which line of the trace was the first one that looked wrong?',
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
      label: 'Map room',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'mirror-stack',
      label: 'Mirror stack',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 2, cellZ: -1 }],
      reasonKey: 'mirror.blocks',
    },
    {
      id: 'chart-wall',
      label: 'Chart wall',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 1, cellZ: 1 }],
      reasonKey: 'wall.blocks',
    },
    {
      id: 'corner-rail',
      label: 'Corner rail',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 3, cellZ: 0 }],
      reasonKey: 'rail.blocks',
    },
    {
      id: 'deck-edge',
      label: 'Deck edge',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 2, cellZ: 4 }],
      reasonKey: 'edge.blocks',
    },
    {
      id: 'goal-1',
      label: 'Star deck',
      required: true,
      kind: 'goal',
      cell: { cellX: 2, cellZ: 3 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-and-turn', unlockedFromMissionId: 'm05', apiVersion: 'v1' },
  ],
  briefing: {
    storySentence: 'This route was written for you. It turns the wrong way and stops.',
    goal: 'Fix the one wrong turn, then reach the star deck.',
    requiredCount: 1,
    optionalCount: 0,
    newConcepts: ['readTrace'],
    priorConcepts: ['moveForward', 'turnLeft', 'turnRight'],
    controls: ['move forward', 'turn left', 'turn right'],
    checklist: ['Run the code first.', 'Find the line where it stops.', 'Change that one line.', 'Run it again.'],
    readAloud: 'Run the code. Watch where it stops. Change the turn.',
    locale: 'en-US',
  },
  starterCode:
    '// This route should reach the star deck. Run it and watch.\nmoveForward();\nmoveForward();\nturnLeft();\nmoveForward();\nmoveForward();\nmoveForward();\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Run the code. Which step in the list is the first bad one?',
      reveal: 'The first two steps are fine. The turn is the problem.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'Stand where the code stopped. Is the deck on your left or your right?',
      reveal: 'The star deck is on the right. The code turns left.',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Change one word on line four.',
      scaffold: 'turnRight();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'moveForward();\nmoveForward();\nturnRight();\nmoveForward();\nmoveForward();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'The wrong turn',
    problem: 'A friend gives you steps to their home. One turn is wrong.',
    source: 'examples/the-wrong-turn',
    note: 'You do not throw the note away. You fix the turn and keep the rest.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1'],
    requiredFlags: {},
    requiredCollected: [],
    terminalCell: { cellX: 2, cellZ: 3 },
    reflectionQuestion: 'Which line did you change, and how did you know?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'moveForward', 'turnRight', 'moveForward'],
    },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m27-one-word-fix',
      source: 'demo/m27-one-word-fix.js',
      expectedCommandCount: 6,
      expectedStepCount: 6,
      notes: 'The starter with turnLeft swapped for turnRight; nothing else changes.',
    },
    {
      solutionId: 'sol-m27-three-turns',
      source: 'demo/m27-three-turns.js',
      expectedCommandCount: 8,
      expectedStepCount: 8,
      notes: 'The child keeps turnLeft and adds two more, facing south the long way; valid, and the recap shows the shorter fix.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m27-unchanged-starter',
      source: 'tests/m27/unchanged-starter.js',
      expectedFault: 'blockedMove',
      reasonKey: 'mirror.blocks',
      notes: 'The starter runs as shipped; the left turn walks straight into the mirror stack.',
    },
    {
      fixtureId: 'fixture-m27-turns-too-early',
      source: 'tests/m27/turns-too-early.js',
      expectedFault: 'blockedMove',
      reasonKey: 'wall.blocks',
      notes: 'The turn is fixed but moved up one line, so the route hits the chart wall.',
    },
    {
      fixtureId: 'fixture-m27-extra-turn',
      source: 'tests/m27/extra-turn.js',
      expectedFault: 'wrongFacing',
      reasonKey: 'goal-not-reached',
      notes: 'Both turns are left in, so the avatar faces west and never reaches the deck.',
    },
  ],
  accessibility: {
    keyboard: 'Step mode advances one line at a time; the editor keeps focus on the highlighted line.',
    touch: 'Tapping a trace row scrolls the editor to the line that made it.',
    captions: 'Caption strip names the blocked line as "line 4 turned left".',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'The blocked bump is a still outline instead of a shake.',
    screenReader: 'Reads the stopped line number, the facing, and what is in front.',
  },
  budgets: {
    maxCommands: 12,
    maxStepCount: 12,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 8,
  },
  rewards: [
    { rewardId: 'reward-debug-goggles', assetId: 'asset.gear.debug-goggles', label: 'Debugger Goggles', cosmetic: true },
  ],
};
