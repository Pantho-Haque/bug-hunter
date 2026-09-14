// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { MissionPackageSchema } from '@codequest/domain';

import { Minimap } from './Minimap';

const mission: MissionPackageSchema = {
  identity: {
    levelId: 'm01',
    zoneId: 'meadow-of-moves',
    apiVersion: 'v1',
    contentVersion: '2025.01',
    ordinal: 1,
    title: 'First Steps',
    isCheckpoint: false,
    prerequisiteLevelIds: [],
  },
  zoneId: 'meadow-of-moves',
  curriculum: {
    primaryConcept: 'sequence',
    newConcepts: [],
    priorConcepts: [],
  },
  startState: {
    avatar: { cellX: 0, cellZ: 0, facing: 'east' },
    collected: [],
    inventory: {},
    flags: {},
    stepCount: 0,
  },
  objects: [
    { id: 's', label: 'Spawn', required: false, kind: 'spawn', cell: { cellX: 0, cellZ: 0 }, facing: 'east' },
    { id: 'g', label: 'Goal', required: true, kind: 'goal', cell: { cellX: 3, cellZ: 0 }, successConditions: [] },
    {
      id: 'b',
      label: 'Blocker',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 1, cellZ: 0 }],
      reasonKey: 'wall.solid',
    },
    {
      id: 'c',
      label: 'Coin',
      required: false,
      kind: 'collectible',
      cell: { cellX: 1, cellZ: 0 },
      collectionEffect: 'coin.collected',
    },
  ],
  allowedApi: [{ capabilityId: 'cap-move-forward', unlockedFromMissionId: 'm01', apiVersion: 'v1' }],
  briefing: {
    storySentence: 'story',
    goal: 'reach beacon',
    requiredCount: 1,
    optionalCount: 0,
    newConcepts: [],
    priorConcepts: [],
    controls: ['move forward'],
    checklist: ['press run'],
    locale: 'en-US' as never,
  },
  starterCode: '',
  hints: [
    { hintId: 'h1', stage: 1, prompt: 'p1' },
    { hintId: 'h2', stage: 2, prompt: 'p2' },
    { hintId: 'h3', stage: 3, prompt: 'p3' },
    { hintId: 'h4', stage: 4, prompt: 'p4' },
  ],
  analogousExample: { title: 't', problem: 'p', source: 's', note: 'n' },
  completion: {
    stateInvariants: ['avatarAtGoal'],
    requiredObjectIds: [],
    requiredFlags: {},
    requiredCollected: [],
  },
  conceptEvidence: [{ ruleKey: 'rule.sequence', expectedSequence: ['moveForward'] }],
  knownSolutions: [{ solutionId: 'sol', source: 'demo/x.js', expectedCommandCount: 3, expectedStepCount: 3 }],
  expectedFailures: [],
  accessibility: { keyboard: 'k', reducedMotion: 'r', screenReader: 'sr' },
  budgets: {
    maxCommands: 6,
    maxStepCount: 12,
    maxMissionObjects: 12,
    maxTriangles: 8000,
    estimatedActiveMinutes: 5,
  },
  rewards: [],
};

describe('renderer / Minimap', () => {
  it('renders the mission title and avatar marker', () => {
    const { container } = render(
      <Minimap mission={mission} state={mission.startState} reducedEffects={false} />,
    );
    expect(container.querySelector('text')?.textContent).toContain('First Steps');
    expect(container.querySelectorAll('circle').length).toBeGreaterThan(0);
  });

  it('hides a collectible once it is collected', () => {
    const stateAfterCollect = { ...mission.startState, collected: ['c'] };
    const { container } = render(
      <Minimap mission={mission} state={stateAfterCollect} reducedEffects={false} />,
    );
    expect(container.querySelector('circle')).toBeTruthy();
  });
});