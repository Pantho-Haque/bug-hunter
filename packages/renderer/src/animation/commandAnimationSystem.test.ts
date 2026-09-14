import { describe, expect, it } from 'vitest';

import type {
  CommandAppliedEventSchema,
  CommandRejectedEventSchema,
  RunEventSchema,
  RunFaultSchema,
  SimulationStateSchema,
} from '@codequest/domain';

import {
  deriveAnimationState,
  extractBeforeAfterFacing,
  facingFromState,
  isRejectOfMovement,
  movementFromFacingDelta,
} from './commandAnimationSystem';

const startState: SimulationStateSchema = {
  avatar: { cellX: 0, cellZ: 0, facing: 'east' },
  collected: [],
  inventory: {},
  flags: {},
  stepCount: 0,
};

const applied = (kind: 'moveForward' | 'turnLeft' | 'turnRight' | 'collect' | 'interact', sourceLine: number, commandId: string, before: SimulationStateSchema, after: SimulationStateSchema, reasonKey = 'moved.forward'): CommandAppliedEventSchema => ({
  type: 'commandApplied',
  commandId,
  sourceLine,
  command: { commandId, kind, sourceLine },
  before,
  after,
  reasonKey,
});

const rejected = (kind: 'moveForward' | 'turnLeft' | 'turnRight' | 'collect' | 'interact', sourceLine: number, commandId: string, reasonKey: string): CommandRejectedEventSchema => ({
  type: 'commandRejected',
  commandId,
  sourceLine,
  kind,
  reasonKey,
});

const fault = (reasonKey: string): RunFaultSchema => ({
  type: 'runFault',
  code: 'memory',
  reasonKey,
});

describe('renderer / commandAnimationSystem', () => {
  it('returns idle when no events have been emitted', () => {
    const snapshot = deriveAnimationState([], startState);
    expect(snapshot.movementState).toBe('idle');
    expect(snapshot.activeCommand).toBeUndefined();
  });

  it('maps each applied command kind to a movement state', () => {
    const moved: SimulationStateSchema = { ...startState, avatar: { ...startState.avatar, cellX: 1 } };
    const events: RunEventSchema[] = [applied('moveForward', 1, 'c-1', startState, moved)];
    expect(deriveAnimationState(events, moved).movementState).toBe('walking');

    const turnedRight: SimulationStateSchema = { ...startState, avatar: { ...startState.avatar, facing: 'south' } };
    const rightEvents: RunEventSchema[] = [applied('turnRight', 1, 'c-1', startState, turnedRight, 'turned.right')];
    expect(deriveAnimationState(rightEvents, turnedRight).movementState).toBe('turning-right');

    const turnedLeft: SimulationStateSchema = { ...startState, avatar: { ...startState.avatar, facing: 'north' } };
    const leftEvents: RunEventSchema[] = [applied('turnLeft', 1, 'c-1', startState, turnedLeft, 'turned.left')];
    expect(deriveAnimationState(leftEvents, turnedLeft).movementState).toBe('turning-left');

    const collected: SimulationStateSchema = { ...startState, collected: ['leaf-1'] };
    const collectEvents: RunEventSchema[] = [applied('collect', 1, 'c-1', startState, collected, 'collected.item')];
    expect(deriveAnimationState(collectEvents, collected).movementState).toBe('collecting');

    const interacted: SimulationStateSchema = { ...startState, flags: { 'lever-1-state': true } };
    const interactEvents: RunEventSchema[] = [applied('interact', 1, 'c-1', startState, interacted, 'interact.lever.on')];
    expect(deriveAnimationState(interactEvents, interacted).movementState).toBe('interacting');
  });

  it('switches movement state when a subsequent command is applied', () => {
    const afterMove: SimulationStateSchema = { ...startState, avatar: { ...startState.avatar, cellX: 1 } };
    const afterTurn: SimulationStateSchema = { ...startState, avatar: { ...startState.avatar, cellX: 1, facing: 'south' } };
    const events: RunEventSchema[] = [
      applied('moveForward', 1, 'c-1', startState, afterMove),
      applied('turnRight', 2, 'c-2', afterMove, afterTurn, 'turned.right'),
    ];
    expect(deriveAnimationState(events, afterTurn).movementState).toBe('turning-right');
    expect(deriveAnimationState(events, afterTurn).activeCommand?.kind).toBe('turnRight');
    expect(deriveAnimationState(events, afterTurn).activeCommand?.sourceLine).toBe(2);
  });

  it('treats the last command as the active marker', () => {
    const afterReject: SimulationStateSchema = startState;
    const events: RunEventSchema[] = [rejected('moveForward', 1, 'c-1', 'wall.solid')];
    expect(deriveAnimationState(events, afterReject).activeCommand?.kind).toBe('moveForward');
    expect(deriveAnimationState(events, afterReject).activeCommand?.sourceLine).toBe(1);
  });

  it('switches to fault movement state when a runFault is the latest event', () => {
    const events: RunEventSchema[] = [fault('run.memory')];
    expect(deriveAnimationState(events, startState).movementState).toBe('fault');
  });

  it('flags movement-rejected commands', () => {
    expect(isRejectOfMovement(rejected('moveForward', 1, 'c-1', 'wall.solid'))).toBe(true);
    expect(isRejectOfMovement(rejected('collect', 1, 'c-1', 'collect.empty'))).toBe(true);
    expect(isRejectOfMovement(rejected('interact', 1, 'c-1', 'object.out-of-range'))).toBe(true);
    expect(isRejectOfMovement(rejected('moveForward', 1, 'c-1', 'run.blocked-api'))).toBe(false);
  });

  it('derives turning direction from facing delta', () => {
    expect(movementFromFacingDelta('north', 'east')).toBe('turning-right');
    expect(movementFromFacingDelta('east', 'south')).toBe('turning-right');
    expect(movementFromFacingDelta('east', 'north')).toBe('turning-left');
    expect(movementFromFacingDelta('north', 'west')).toBe('turning-left');
    expect(movementFromFacingDelta('north', 'south')).toBe('idle');
    expect(movementFromFacingDelta(undefined, 'east')).toBe('idle');
    expect(movementFromFacingDelta('north', undefined)).toBe('idle');
  });

  it('reads facing from before/after snapshots', () => {
    const moved: SimulationStateSchema = { ...startState, avatar: { ...startState.avatar, cellX: 1 } };
    const event: CommandAppliedEventSchema = applied('moveForward', 1, 'c-1', startState, moved);
    expect(extractBeforeAfterFacing(event)).toEqual({ before: 'east', after: 'east' });
  });

  it('extracts current avatar facing from state', () => {
    expect(facingFromState(startState)).toBe('east');
  });
});