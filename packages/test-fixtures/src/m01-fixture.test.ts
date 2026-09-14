import { describe, expect, it } from 'vitest';

import { m01FirstSteps } from '@codequest/content';
import { missionPackageSchema } from '@codequest/domain';

import { createMissionFixture } from './index';

describe('M01 fixture', () => {
  it('parses cleanly through the domain schema', () => {
    const result = missionPackageSchema.safeParse(m01FirstSteps);
    expect(result.success).toBe(true);
  });

  it('has a straight east trail and a beacon goal', () => {
    expect(m01FirstSteps.identity.levelId).toBe('m01');
    expect(m01FirstSteps.startState.avatar.facing).toBe('east');
    const goal = m01FirstSteps.objects.find((o) => o.kind === 'goal');
    expect(goal).toBeDefined();
    if (goal && goal.kind === 'goal') {
      expect(goal.cell).toEqual({ cellX: 3, cellZ: 0 });
    }
  });

  it('seeds a simulation state from the mission start', () => {
    const state = createMissionFixture({
      startAt: m01FirstSteps.startState.avatar,
      facing: m01FirstSteps.startState.avatar.facing,
    });
    expect(state.avatar).toEqual(m01FirstSteps.startState.avatar);
    expect(state.stepCount).toBe(0);
  });

  it('exposes at least two known solutions and three failure fixtures', () => {
    expect(m01FirstSteps.knownSolutions.length).toBeGreaterThanOrEqual(2);
    expect(m01FirstSteps.expectedFailures.length).toBeGreaterThanOrEqual(3);
  });

  it('provides exactly four hints', () => {
    expect(m01FirstSteps.hints).toHaveLength(4);
  });

  it('keeps the active-minute budget at 15 or below', () => {
    expect(m01FirstSteps.budgets.estimatedActiveMinutes).toBeLessThanOrEqual(15);
  });
});
