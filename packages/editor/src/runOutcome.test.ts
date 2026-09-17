import { describe, expect, it } from 'vitest';

import { describeRunOutcome } from './runOutcome';

const context = { agentName: 'Nova', goal: 'Reach the beacon.' };

describe('describeRunOutcome', () => {
  it('reports success when the simulation found no issues', () => {
    const outcome = describeRunOutcome([], context);
    expect(outcome.status).toBe('success');
    expect(outcome.detail).toContain('Reach the beacon.');
  });

  it('explains a route that stopped short', () => {
    const outcome = describeRunOutcome(
      [{ code: 'state-invariant-failed', message: 'expected avatar at goal (3,0), got (1,0)' }],
      context,
    );
    expect(outcome.status).toBe('incomplete');
    expect(outcome.detail).toBe('The route stopped somewhere else.');
  });

  it('prefers the most actionable issue when a run both overshoots and misses', () => {
    const outcome = describeRunOutcome(
      [
        { code: 'state-invariant-failed', message: 'expected avatar at goal (3,0), got (9,0)' },
        { code: 'step-budget-exceeded', message: 'stepCount 14 exceeds budget 12' },
      ],
      context,
    );
    expect(outcome.detail).toBe('That route took too many steps. Try a shorter one.');
  });

  it('never leaves an unknown issue code without child-readable copy', () => {
    const outcome = describeRunOutcome([{ code: 'brand-new-code', message: 'x' }], context);
    expect(outcome.status).toBe('incomplete');
    expect(outcome.detail).toBe('Nova did not finish the goal yet.');
  });
});
