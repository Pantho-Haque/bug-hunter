import { describe, expect, it } from 'vitest';

import { createMissionFixture } from './index';

describe('createMissionFixture', () => {
  it('defaults to origin facing north', () => {
    const state = createMissionFixture();
    expect(state.avatar).toEqual({ cellX: 0, cellZ: 0, facing: 'north' });
    expect(state.collected).toEqual([]);
    expect(state.stepCount).toBe(0);
  });

  it('honors overrides', () => {
    const state = createMissionFixture({ startAt: { cellX: 3, cellZ: -2 }, facing: 'east' });
    expect(state.avatar.cellX).toBe(3);
    expect(state.avatar.cellZ).toBe(-2);
    expect(state.avatar.facing).toBe('east');
  });
});