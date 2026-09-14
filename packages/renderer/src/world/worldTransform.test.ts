import { describe, expect, it } from 'vitest';

import type { MissionPackageSchema } from '@codequest/domain';

import {
  avatarTransform,
  cellBounds,
  directionVector,
  facingToRadians,
  worldFromCell,
} from './worldTransform';

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
      occupiedCells: [{ cellX: 1, cellZ: 1 }, { cellX: 2, cellZ: -1 }],
      reasonKey: 'wall.solid',
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
  accessibility: {
    keyboard: 'k',
    reducedMotion: 'r',
    screenReader: 'sr',
  },
  budgets: {
    maxCommands: 6,
    maxStepCount: 12,
    maxMissionObjects: 12,
    maxTriangles: 8000,
    estimatedActiveMinutes: 5,
  },
  rewards: [],
};

describe('renderer / worldTransform', () => {
  it('converts cell coordinates to world coordinates using the configured cell size', () => {
    expect(worldFromCell({ cellX: 3, cellZ: -2 }, { cellSize: 2, groundY: 0, originOffsetX: 0, originOffsetZ: 0 })).toEqual([6, 0, -4]);
  });

  it('honors origin offsets', () => {
    expect(worldFromCell({ cellX: 1, cellZ: 1 }, { cellSize: 1, groundY: 0, originOffsetX: 4, originOffsetZ: -3 })).toEqual([5, 0, -2]);
  });

  it('returns avatar transform from simulation state', () => {
    const state = { ...mission.startState, avatar: { cellX: 2, cellZ: 1, facing: 'north' as const } };
    expect(avatarTransform(state)).toEqual({ position: [2, 0, 1], rotationY: 0 });
  });

  it('computes yaw rotation from facing direction', () => {
    expect(facingToRadians('north')).toBe(0);
    expect(facingToRadians('east')).toBeCloseTo(Math.PI / 2);
    expect(facingToRadians('south')).toBeCloseTo(Math.PI);
    expect(facingToRadians('west')).toBeCloseTo(-Math.PI / 2);
  });

  it('returns facing unit vector', () => {
    expect(directionVector('north')).toEqual([0, -1]);
    expect(directionVector('east')).toEqual([1, 0]);
    expect(directionVector('south')).toEqual([0, 1]);
    expect(directionVector('west')).toEqual([-1, 0]);
  });

  it('computes mission cell bounds', () => {
    const bounds = cellBounds(mission);
    expect(bounds.minX).toBe(0);
    expect(bounds.maxX).toBe(3);
    expect(bounds.minZ).toBe(-1);
    expect(bounds.maxZ).toBe(1);
  });
});