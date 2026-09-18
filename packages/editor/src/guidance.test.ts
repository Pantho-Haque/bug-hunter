import { describe, expect, it } from 'vitest';

import type { MissionPackageSchema, SimulationStateSchema } from '@codequest/domain';

import { describeGuidance } from './guidance';

// A gate opened by a lever, a spark to collect, and a beacon three cells east.
const mission = {
  objects: [
    { id: 'lever-1', label: 'gate lever', kind: 'interactable', cell: { cellX: 1, cellZ: 0 } },
    {
      id: 'gate-1',
      label: 'closed gate',
      kind: 'blocker',
      occupiedCells: [{ cellX: 2, cellZ: 0 }],
      reasonKey: 'gate.closed',
      unlockedByFlag: 'interactable.lever-1.state',
    },
    { id: 'spark-1', label: 'meadow spark', kind: 'collectible', cell: { cellX: 3, cellZ: -1 } },
    { id: 'goal-1', label: 'beacon', kind: 'goal', cell: { cellX: 3, cellZ: 0 } },
  ],
  allowedApi: [{ capabilityId: 'cap-move-and-turn' }, { capabilityId: 'cap-interact' }],
  budgets: { maxStepCount: 12 },
} as unknown as MissionPackageSchema;

const at = (cellX: number, cellZ: number, facing: SimulationStateSchema['avatar']['facing']) =>
  ({ avatar: { cellX, cellZ, facing }, collected: [], inventory: {}, flags: {}, stepCount: 4 }) as SimulationStateSchema;

describe('describeGuidance', () => {
  it('names the lever when the gate stopped the run, and leads with the fix', () => {
    const guidance = describeGuidance({
      mission,
      state: at(1, 0, 'east'),
      issues: [
        { code: 'missing-flag', path: 'completion.requiredFlags[interactable.lever-1.state]' },
        { code: 'state-invariant-failed', path: 'completion.stateInvariants[avatarAtGoal]' },
      ],
      lastEvent: {
        type: 'commandRejected',
        commandId: 'c',
        sourceLine: 2,
        kind: 'moveForward',
        reasonKey: 'gate.closed',
      },
    });
    expect(guidance.headline).toBe(
      'I have not used the gate lever yet. Stand right in front of it and call interact().',
    );
    expect(guidance.steps[0]).toContain('The closed gate stopped me at line 2');
    expect(guidance.steps[0]).toContain('gate lever');
  });

  it('tells the child what to collect and with which command', () => {
    const guidance = describeGuidance({
      mission,
      state: at(3, 0, 'east'),
      issues: [{ code: 'missing-collected', path: 'completion.requiredCollected[spark-1]' }],
    });
    expect(guidance.headline).toBe(
      'I have not picked up the meadow spark yet. Walk onto it and call collect().',
    );
  });

  it('gives direction, distance and the turn needed to reach the goal', () => {
    const guidance = describeGuidance({
      mission,
      state: at(0, 0, 'north'),
      issues: [{ code: 'wrong-terminal-cell', path: 'completion.terminalCell' }],
    });
    expect(guidance.headline).toBe(
      'The beacon is 3 cells east from me. I am facing north, so I need turnRight() first, then moveForward().',
    );
  });

  it('does not suggest a turn in a mission that has none', () => {
    const noTurns = { ...mission, allowedApi: [{ capabilityId: 'cap-move-forward' }] } as unknown as MissionPackageSchema;
    const guidance = describeGuidance({
      mission: noTurns,
      state: at(0, 0, 'north'),
      issues: [{ code: 'wrong-terminal-cell', path: 'completion.terminalCell' }],
    });
    expect(guidance.headline).toContain('I can only walk the way I face');
  });

  it('explains a collect that found nothing, with the line number', () => {
    const guidance = describeGuidance({
      mission,
      state: at(0, 0, 'east'),
      issues: [],
      lastEvent: { type: 'commandRejected', commandId: 'c', sourceLine: 1, kind: 'collect', reasonKey: 'collect.nothing-here' },
    });
    expect(guidance.headline).toBe(
      'There was nothing to pick up where I stood at line 1. Walk onto the item first, then call collect().',
    );
  });
});
