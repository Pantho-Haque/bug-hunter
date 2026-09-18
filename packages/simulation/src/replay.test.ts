import { describe, expect, it } from 'vitest';

import { m01FirstSteps } from '@codequest/content';

import {
  createSimulation,
  createSnapshotStore,
  replayCommands,
  replayFromInitial,
  statesEqual,
  validateMissionObjectives,
  type CommandInput,
  type SimulationState,
} from './index';
import { cloneState } from './state';

const cmd = (kind: CommandInput['kind'], line: number): CommandInput => ({
  commandId: `c-${line}`,
  sourceLine: line,
  kind,
});

describe('simulation: M01 deterministic replay', () => {
  it('replays sol-m01-straight to the goal cell', () => {
    const commands: CommandInput[] = [
      cmd('moveForward', 1),
      cmd('moveForward', 2),
      cmd('moveForward', 3),
    ];

    const first = replayCommands(m01FirstSteps, commands);
    expect(first.appliedCount).toBe(3);
    expect(first.rejectedCount).toBe(0);
    expect(first.finalState.avatar).toEqual({ cellX: 3, cellZ: 0, facing: 'east' });
    expect(first.finalState.stepCount).toBe(3);

    const second = replayCommands(m01FirstSteps, commands);
    expect(second.events).toEqual(first.events);
    expect(statesEqual(second.finalState, first.finalState)).toBe(true);

    const objectives = validateMissionObjectives(m01FirstSteps, first.finalState);
    expect(objectives.ok).toBe(true);
  });

  it('emits identical traces across repeated runs', () => {
    const commands: CommandInput[] = [
      cmd('moveForward', 1),
      cmd('turnLeft', 2),
      cmd('moveForward', 3),
      cmd('turnRight', 4),
      cmd('moveForward', 5),
    ];

    const a = replayCommands(m01FirstSteps, commands);
    const b = replayCommands(m01FirstSteps, commands);
    expect(a.events.length).toBe(b.events.length);
    for (let i = 0; i < a.events.length; i++) {
      expect(a.events[i]).toEqual(b.events[i]);
    }
  });

  it('replays a mixed turn-forward sequence without rejecting', () => {
    const commands: CommandInput[] = [
      // Turns south, away from the grass tuft at (1,-1): scenery is solid.
      cmd('moveForward', 1),
      cmd('turnRight', 2),
      cmd('moveForward', 3),
      cmd('turnLeft', 4),
      cmd('moveForward', 5),
      cmd('moveForward', 6),
      cmd('turnLeft', 7),
    ];

    const result = replayCommands(m01FirstSteps, commands);
    expect(result.appliedCount).toBe(commands.length);
    expect(result.rejectedCount).toBe(0);
    const kinds = result.events
      .filter((e) => e.type === 'commandApplied')
      .map((e) => e.type === 'commandApplied' && e.command.kind)
      .filter((kind): kind is CommandInput['kind'] => Boolean(kind));
    expect(kinds).toEqual([
      'moveForward',
      'turnRight',
      'moveForward',
      'turnLeft',
      'moveForward',
      'moveForward',
      'turnLeft',
    ]);
  });

  it('truncates replay when maxSteps is hit', () => {
    const commands: CommandInput[] = [
      cmd('moveForward', 1),
      cmd('moveForward', 2),
      cmd('moveForward', 3),
    ];

    const slow = replayCommands(m01FirstSteps, commands, { maxSteps: 1 });
    const full = replayCommands(m01FirstSteps, commands, { maxSteps: 1024 });

    expect(slow.truncated).toBe(true);
    expect(slow.events).toHaveLength(1);
    expect(slow.finalState.avatar.cellX).toBe(1);
    expect(full.truncated).toBe(false);
    expect(full.events).toHaveLength(3);
    expect(full.finalState.avatar.cellX).toBe(3);
  });
});

describe('simulation: command reducer branches', () => {
  it('rejects a moveForward into a blocker with reasonKey', () => {
    const mission = JSON.parse(JSON.stringify(m01FirstSteps));
    mission.objects.push({
      id: 'wall',
      label: 'Wall',
      required: false,
      kind: 'blocker',
      occupiedCells: [{ cellX: 1, cellZ: 0 }],
      reasonKey: 'wall.blocks',
    });
    const result = replayCommands(mission, [cmd('moveForward', 1)]);
    expect(result.appliedCount).toBe(0);
    expect(result.rejectedCount).toBe(1);
    expect(result.events[0]).toMatchObject({
      type: 'commandRejected',
      reasonKey: 'wall.blocks',
    });
  });

  it('keeps a gate solid until its lever flag is set, then lets the avatar through', () => {
    const mission = JSON.parse(JSON.stringify(m01FirstSteps));
    mission.objects.push({
      id: 'gate',
      label: 'Gate',
      required: true,
      kind: 'blocker',
      occupiedCells: [{ cellX: 1, cellZ: 0 }],
      reasonKey: 'gate.closed',
      unlockedByFlag: 'interactable.lever.state',
    });

    const closed = replayCommands(mission, [cmd('moveForward', 1)]);
    expect(closed.events[0]).toMatchObject({ type: 'commandRejected', reasonKey: 'gate.closed' });

    const opened = replayFromInitial(
      mission,
      { ...mission.startState, flags: { 'interactable.lever.state': true } },
      [cmd('moveForward', 1)],
    );
    expect(opened.finalState.avatar.cellX).toBe(1);
  });

  it('rejects collect when nothing is in front', () => {
    const result = replayCommands(m01FirstSteps, [cmd('collect', 1)]);
    expect(result.events[0]).toMatchObject({ type: 'commandRejected', reasonKey: 'collect.nothing-here' });
  });

  it('rejects interact when nothing is in front', () => {
    const result = replayCommands(m01FirstSteps, [cmd('interact', 1)]);
    expect(result.events[0]).toMatchObject({ type: 'commandRejected', reasonKey: 'interact.nothing-here' });
  });

  it('turnLeft cycles north→west→south→east', () => {
    const commands: CommandInput[] = [
      cmd('turnLeft', 1),
      cmd('turnLeft', 2),
      cmd('turnLeft', 3),
      cmd('turnLeft', 4),
    ];
    const result = replayCommands(m01FirstSteps, commands);
    expect(result.finalState.avatar.facing).toBe('east');
    expect(result.finalState.stepCount).toBe(4);
  });

  it('turnRight cycles facing→right once per call', () => {
    const commands: CommandInput[] = [
      cmd('turnRight', 1),
      cmd('turnRight', 2),
      cmd('turnRight', 3),
      cmd('turnRight', 4),
    ];
    const result = replayCommands(m01FirstSteps, commands);
    expect(result.finalState.avatar.facing).toBe('east');
  });

  it('repeat-collect is idempotent', () => {
    const mission = JSON.parse(JSON.stringify(m01FirstSteps));
    mission.objects.push({
      id: 'gem-1',
      label: 'Sparkle',
      required: false,
      kind: 'collectible',
      cell: { cellX: 1, cellZ: 0 },
      collectionEffect: 'sparkle',
    });
    const commands: CommandInput[] = [
      cmd('moveForward', 1),
      cmd('collect', 2),
      cmd('collect', 3),
    ];
    const result = replayCommands(mission, commands);
    expect(result.appliedCount).toBe(2);
    expect(result.rejectedCount).toBe(1);
    expect(result.finalState.collected).toEqual(['gem-1']);
    expect(result.finalState.inventory.sparkle).toBe(1);
  });

  it('interactable range check rejects when out of range', () => {
    const mission = JSON.parse(JSON.stringify(m01FirstSteps));
    mission.objects.push({
      id: 'lever-1',
      label: 'Lever',
      required: false,
      kind: 'interactable',
      cell: { cellX: 5, cellZ: 0 },
      actionKey: 'pull',
      range: 1,
      initialState: 'closed',
      stateTransitions: [{ from: 'closed', to: 'open' }],
    });
    const result = replayCommands(mission, [cmd('interact', 1)]);
    expect(result.events[0]).toMatchObject({ type: 'commandRejected' });
  });
});

describe('simulation: snapshot store', () => {
  it('supports step-back to a prior state', () => {
    const store = createSnapshotStore({ mission: m01FirstSteps });
    store.push(cmd('moveForward', 1));
    store.push(cmd('moveForward', 2));
    expect(store.depth()).toBe(2);
    expect(store.current().avatar.cellX).toBe(2);

    const restored = store.stepBack();
    expect(restored?.avatar.cellX).toBe(1);
    expect(store.depth()).toBe(1);
  });

  it('reset returns to the initial state', () => {
    const store = createSnapshotStore({ mission: m01FirstSteps });
    store.push(cmd('moveForward', 1));
    store.reset();
    expect(store.depth()).toBe(0);
    expect(store.current().avatar.cellX).toBe(0);
  });

  it('exposes a step-trace list', () => {
    const store = createSnapshotStore({ mission: m01FirstSteps });
    store.push(cmd('moveForward', 1));
    store.push(cmd('turnLeft', 2));
    const traces = store.traces();
    expect(traces).toHaveLength(2);
    expect(traces[0].applied).toBe(true);
    expect(traces[0].command).toEqual({ commandId: 'c-1', sourceLine: 1, kind: 'moveForward' });
  });
});

describe('simulation: createSimulation handle', () => {
  it('produces a frozen handle that reflects step results', () => {
    const sim = createSimulation(m01FirstSteps);
    expect(sim.state.avatar.cellX).toBe(0);

    const step = sim.step(cmd('moveForward', 1));
    expect(step.applied).toBe(true);
    expect(step.simulation.state.avatar.cellX).toBe(1);

    const step2 = step.simulation.step(cmd('moveForward', 2));
    expect(step2.simulation.state.avatar.cellX).toBe(2);
  });

  it('reset returns a fresh handle', () => {
    const sim = createSimulation(m01FirstSteps);
    const moved = sim.step(cmd('moveForward', 1));
    const reset = moved.simulation.reset();
    expect(reset.state.avatar.cellX).toBe(0);
    expect(reset.events).toHaveLength(0);
  });
});

describe('simulation: replayFromInitial with custom start', () => {
  it('honors a swapped start state', () => {
    const custom: SimulationState = cloneState(m01FirstSteps.startState);
    custom.avatar.cellX = 1;
    custom.avatar.cellZ = 0;
    const commands: CommandInput[] = [
      cmd('moveForward', 1),
      cmd('moveForward', 2),
    ];
    const result = replayFromInitial(m01FirstSteps, custom, commands);
    expect(result.finalState.avatar.cellX).toBe(3);
    expect(result.finalState.avatar.cellZ).toBe(0);
  });
});

describe('simulation: objective validation', () => {
  it('flags wrong-terminal-cell when the avatar overshoots', () => {
    const overshoot: SimulationState = {
      avatar: { cellX: 4, cellZ: 0, facing: 'east' },
      collected: [],
      inventory: {},
      flags: {},
      stepCount: 4,
    };
    const result = validateMissionObjectives(m01FirstSteps, overshoot);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'wrong-terminal-cell')).toBe(true);
  });

  it('flags step-budget-exceeded when the player runs away', () => {
    const overstep: SimulationState = {
      avatar: { cellX: 3, cellZ: 0, facing: 'east' },
      collected: [],
      inventory: {},
      flags: {},
      stepCount: 99,
    };
    const result = validateMissionObjectives(m01FirstSteps, overstep);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'step-budget-exceeded')).toBe(true);
  });

  it('rejects an unrecognized state invariant instead of treating it as complete', () => {
    const mission = {
      ...m01FirstSteps,
      completion: {
        ...m01FirstSteps.completion,
        stateInvariants: ['avatarReachesTreasure'],
      },
    };
    const result = validateMissionObjectives(mission, m01FirstSteps.startState);

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'unrecognized-state-invariant' }),
    );
  });
});
