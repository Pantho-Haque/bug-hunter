import type { MissionPackageSchema } from '@codequest/domain';

/**
 * A condition about what you carry rather than where you stand. `hasLantern()`
 * reads `inventory.lantern`, and the only thing that raises it is collecting a
 * collectible whose effect is exactly `lantern`, so this mission starts empty
 * handed and the collect lives behind `if (!hasLantern())`.
 *
 * The hook at the tunnel mouth is what physically opens the dark span: hanging
 * the lantern sets `interactable.hook-1.state`, which unlocks the tunnel cells.
 * The second authored variant starts with `inventory: { lantern: 1 }`, where the
 * same code skips the collect; that variant also needs an empty
 * `requiredCollected`, which is a per-variant completion contract the package
 * format does not carry yet.
 */
export const m21LanternCheck: MissionPackageSchema = {
  identity: {
    levelId: 'm21',
    zoneId: 'logic-cliffs',
    apiVersion: 'v2',
    contentVersion: '2025.01',
    ordinal: 3,
    title: 'Lantern Check',
    isCheckpoint: false,
    prerequisiteLevelIds: ['m20'],
  },
  zoneId: 'logic-cliffs',
  curriculum: {
    primaryConcept: 'conditional',
    newConcepts: ['inventoryCheck'],
    priorConcepts: ['ifStatement', 'elseBranch', 'moveForward', 'collect', 'interact'],
    transferPrompt: 'What does a program check before it packs something it may already have?',
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
      label: 'Tunnel approach',
      required: false,
      kind: 'spawn',
      cell: { cellX: 0, cellZ: 0 },
      facing: 'east',
    },
    {
      id: 'lantern-1',
      label: 'Spare lantern',
      required: true,
      kind: 'collectible',
      cell: { cellX: 1, cellZ: 0 },
      collectionEffect: 'lantern',
    },
    {
      id: 'hook-1',
      label: 'Lantern hook',
      required: true,
      kind: 'interactable',
      cell: { cellX: 3, cellZ: 0 },
      actionKey: 'hang',
      range: 1,
      initialState: 'empty',
      stateTransitions: [{ from: 'empty', to: 'lit' }],
    },
    {
      id: 'tunnel-1',
      label: 'Dark tunnel',
      required: true,
      kind: 'blocker',
      occupiedCells: [
        { cellX: 4, cellZ: 0 },
        { cellX: 5, cellZ: 0 },
      ],
      reasonKey: 'tunnel.dark',
      unlockedByFlag: 'interactable.hook-1.state',
    },
    {
      id: 'goal-1',
      label: 'Far tunnel mouth',
      required: true,
      kind: 'goal',
      cell: { cellX: 6, cellZ: 0 },
      successConditions: ['avatarAtGoal'],
    },
  ],
  allowedApi: [
    { capabilityId: 'cap-move-forward', unlockedFromMissionId: 'm01', apiVersion: 'v2' },
    { capabilityId: 'cap-collect', unlockedFromMissionId: 'm03', apiVersion: 'v2' },
    { capabilityId: 'cap-interact', unlockedFromMissionId: 'm04', apiVersion: 'v2' },
    { capabilityId: 'cap-sense-lantern', unlockedFromMissionId: 'm21', apiVersion: 'v2' },
  ],
  briefing: {
    storySentence: 'The tunnel ahead is dark. A spare lantern lies on the path.',
    goal: 'Take a lantern only if you need one, hang it on the hook, and walk through.',
    requiredCount: 2,
    optionalCount: 0,
    newConcepts: ['inventoryCheck'],
    priorConcepts: ['ifStatement', 'moveForward', 'collect', 'interact'],
    controls: ['move forward', 'collect', 'interact', 'check your bag'],
    checklist: ['Ask if you hold a lantern.', 'Pick one up only if you do not.', 'Hang it on the hook.', 'Walk through the tunnel.'],
    readAloud: 'Ask if you hold a lantern. Grab one if you do not. Hang it up and walk on.',
    locale: 'en-US',
  },
  starterCode:
    '// Check your bag before you grab.\nmoveForward();\nif (!hasLantern()) {\n  collect();\n}\n',
  hints: [
    {
      hintId: 'h1',
      stage: 1,
      prompt: 'Walk to the tunnel with an empty bag and see what stops you.',
      reveal: 'The tunnel stays dark until a lantern hangs on the hook.',
    },
    {
      hintId: 'h2',
      stage: 2,
      prompt: 'You can ask your bag whether a lantern is already in it.',
      scaffold: 'if (!hasLantern()) {\n  collect();\n}',
    },
    {
      hintId: 'h3',
      stage: 3,
      prompt: 'Stand next to the hook and use it. That is what lights the tunnel.',
      scaffold: 'moveForward();\nif (!hasLantern()) {\n  collect();\n}\nmoveForward();\ninteract();',
    },
    {
      hintId: 'h4',
      stage: 4,
      prompt: 'Here is the answer.',
      reveal:
        'moveForward();\nif (!hasLantern()) {\n  collect();\n}\nmoveForward();\ninteract();\nmoveForward();\nmoveForward();\nmoveForward();\nmoveForward();',
    },
  ],
  analogousExample: {
    title: 'Keys by the door',
    problem: 'You pat your pocket before you leave. You only take the spare key if your key is gone.',
    source: 'examples/keys-by-the-door',
    note: 'The check comes first. It saves you from taking a second thing you already hold.',
  },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: ['goal-1', 'lantern-1', 'hook-1'],
    requiredFlags: { 'interactable.hook-1.state': true },
    requiredCollected: ['lantern-1'],
    terminalCell: { cellX: 6, cellZ: 0 },
    reflectionQuestion: 'What would your code do if you were already holding a lantern?',
  },
  conceptEvidence: [
    {
      ruleKey: 'rule.sequence',
      expectedSequence: ['moveForward', 'collect', 'moveForward', 'interact'],
    },
    { ruleKey: 'rule.conditionalBranch', kind: 'conditionalBranch', threshold: 1 },
  ],
  knownSolutions: [
    {
      solutionId: 'sol-m21-check-then-collect',
      source: 'demo/m21-check-then-collect.js',
      expectedCommandCount: 8,
      expectedStepCount: 8,
      notes: 'Steps onto the lantern, collects it inside the check, hangs it on the hook, then walks the lit tunnel.',
    },
    {
      solutionId: 'sol-m21-collect-ahead',
      source: 'demo/m21-collect-ahead.js',
      expectedCommandCount: 8,
      expectedStepCount: 8,
      notes: 'Takes the lantern from the cell in front before the first step; same eight commands, same route.',
    },
  ],
  expectedFailures: [
    {
      fixtureId: 'fixture-m21-dark-tunnel',
      source: 'tests/m21/dark-tunnel.js',
      expectedFault: 'blockedMove',
      reasonKey: 'tunnel.dark',
      notes: 'Collects the lantern but walks past the hook, so the tunnel is still dark.',
    },
    {
      fixtureId: 'fixture-m21-duplicate-collect',
      source: 'tests/m21/duplicate-collect.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'collect.already-collected',
      notes: 'Collects twice with no check, and the second grab is refused.',
    },
    {
      fixtureId: 'fixture-m21-no-lantern',
      source: 'tests/m21/no-lantern.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'goal-not-reached',
      notes: 'Skips the collect on the empty-bag seed, so the mission ends without the required lantern.',
    },
    {
      fixtureId: 'fixture-m21-carried-lantern-seed',
      source: 'tests/m21/carried-lantern-seed.js',
      expectedFault: 'emptyCollect',
      reasonKey: 'collect.already-collected',
      notes:
        'Second authored variant: startState.inventory seeded as lantern 1. Code that collects without checking is refused there. That seed also needs an empty requiredCollected, which is a per-variant completion contract the format does not carry yet.',
    },
  ],
  accessibility: {
    keyboard: 'Arrow keys move; Space collects; Enter uses the hook; Tab reads the bag panel.',
    touch: 'The bag panel sits beside the route so the count can be read while the run plays.',
    captions: 'Caption strip prints the lantern count before and after each grab.',
    textScale: 'Honors app textScale setting; briefing stays at 16px minimum.',
    reducedMotion: 'The tunnel lights as an instant state change under reduced motion.',
    screenReader: 'Announces the bag check answer, then whether a lantern was taken.',
  },
  budgets: {
    maxCommands: 14,
    maxStepCount: 16,
    maxMissionObjects: 8,
    maxTriangles: 8000,
    estimatedActiveMinutes: 8,
  },
  rewards: [
    { rewardId: 'reward-lantern-charm', assetId: 'asset.gear.lantern-charm', label: 'Lantern Charm', cosmetic: true },
  ],
};
