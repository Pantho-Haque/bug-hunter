import { describe, expect, it } from 'vitest';

import { m01FirstSteps, m04TheGateLever } from '@codequest/content';

import { evaluatePredicate } from './predicates';
import { createInitialState } from './state';

const stateFor = (mission: typeof m01FirstSteps) => createInitialState(mission.startState.avatar);

describe('evaluatePredicate', () => {
  it('canMoveForward is false into a closed gate and true once the flag opens it', () => {
    const closed = stateFor(m04TheGateLever);
    // Standing on the gate's cell-1 facing east, the gate blocks the next cell.
    const atGate = { ...closed, avatar: { ...closed.avatar, cellX: 1 } };
    expect(evaluatePredicate('canMoveForward', atGate, m04TheGateLever)).toBe(false);

    const opened = { ...atGate, flags: { 'interactable.lever-1.state': true } };
    expect(evaluatePredicate('canMoveForward', opened, m04TheGateLever)).toBe(true);
  });

  it('canMoveForward is true on open ground', () => {
    expect(evaluatePredicate('canMoveForward', stateFor(m01FirstSteps), m01FirstSteps)).toBe(true);
  });

  it('isPearlHere sees an uncollected collectible on the current cell only', () => {
    const base = stateFor(m01FirstSteps);
    // M01 has no collectible, so the answer is false wherever the avatar stands.
    expect(evaluatePredicate('isPearlHere', base, m01FirstSteps)).toBe(false);
  });

  it('world predicates read authored state and never invent rules', () => {
    const base = stateFor(m01FirstSteps);
    expect(evaluatePredicate('isWindSafe', base, m01FirstSteps)).toBe(false);
    expect(
      evaluatePredicate('isWindSafe', { ...base, flags: { 'world.windSafe': true } }, m01FirstSteps),
    ).toBe(true);

    expect(evaluatePredicate('signPointsLeft', base, m01FirstSteps)).toBe(false);
    expect(
      evaluatePredicate(
        'signPointsLeft',
        { ...base, flags: { 'world.signPointsLeft': true } },
        m01FirstSteps,
      ),
    ).toBe(true);

    expect(evaluatePredicate('hasLantern', base, m01FirstSteps)).toBe(false);
    expect(
      evaluatePredicate('hasLantern', { ...base, inventory: { lantern: 1 } }, m01FirstSteps),
    ).toBe(true);
  });

  it('never mutates the state it is given', () => {
    const base = stateFor(m04TheGateLever);
    const snapshot = JSON.stringify(base);
    evaluatePredicate('canMoveForward', base, m04TheGateLever);
    evaluatePredicate('isPearlHere', base, m04TheGateLever);
    expect(JSON.stringify(base)).toBe(snapshot);
  });
});
