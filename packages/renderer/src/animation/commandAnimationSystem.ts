import type {
  CommandAppliedEventSchema,
  CommandRejectedEventSchema,
  CommandKindSchema,
  DirectionSchema,
  RunEventSchema,
  SimulationStateSchema,
} from '@codequest/domain';

import type { AvatarMovementState } from '../avatar/avatarPresentation';

export interface ActiveCommandMarker {
  readonly sourceLine: number;
  readonly commandId: string;
  readonly kind: CommandKindSchema;
}

export interface AnimationStateSnapshot {
  readonly movementState: AvatarMovementState;
  readonly activeCommand: ActiveCommandMarker | undefined;
}

const KIND_TO_MOVEMENT: Record<CommandKindSchema, AvatarMovementState> = {
  moveForward: 'walking',
  turnLeft: 'turning-left',
  turnRight: 'turning-right',
  collect: 'collecting',
  interact: 'interacting',
};

const nextMovementFromLastApplied = (
  events: readonly RunEventSchema[],
): AvatarMovementState => {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event.type === 'commandApplied') {
      return KIND_TO_MOVEMENT[event.command.kind];
    }
    if (event.type === 'runFault') {
      return 'fault';
    }
  }
  return 'idle';
};

const activeFromLastApplied = (
  events: readonly RunEventSchema[],
): ActiveCommandMarker | undefined => {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event.type === 'commandApplied') {
      return {
        sourceLine: event.sourceLine,
        commandId: event.commandId,
        kind: event.command.kind,
      };
    }
    if (event.type === 'commandRejected') {
      return {
        sourceLine: event.sourceLine,
        commandId: event.commandId,
        kind: event.kind,
      };
    }
  }
  return undefined;
};

export const deriveAnimationState = (
  events: readonly RunEventSchema[],
  _state: SimulationStateSchema,
): AnimationStateSnapshot => ({
  movementState: nextMovementFromLastApplied(events),
  activeCommand: activeFromLastApplied(events),
});

export const isRejectOfMovement = (event: CommandRejectedEventSchema): boolean =>
  event.reasonKey === 'wall.solid' ||
  event.reasonKey === 'object.out-of-range' ||
  event.reasonKey === 'interact.out-of-range' ||
  event.reasonKey === 'object.required-state-missing' ||
  event.reasonKey === 'collect.empty';

export const movementFromFacingDelta = (
  before: DirectionSchema | undefined,
  after: DirectionSchema | undefined,
): AvatarMovementState => {
  if (!before || !after || before === after) return 'idle';
  const order: readonly DirectionSchema[] = ['north', 'east', 'south', 'west'];
  const beforeIndex = order.indexOf(before);
  const afterIndex = order.indexOf(after);
  const diff = (afterIndex - beforeIndex + 4) % 4;
  if (diff === 1) return 'turning-right';
  if (diff === 3) return 'turning-left';
  return 'idle';
};

export const extractBeforeAfterFacing = (
  event: CommandAppliedEventSchema,
): { readonly before: DirectionSchema | undefined; readonly after: DirectionSchema | undefined } => {
  const before = typeof event.before === 'object' && event.before !== null && 'avatar' in event.before
    ? (event.before as { avatar: { facing: DirectionSchema } }).avatar.facing
    : undefined;
  const after = typeof event.after === 'object' && event.after !== null && 'avatar' in event.after
    ? (event.after as { avatar: { facing: DirectionSchema } }).avatar.facing
    : undefined;
  return { before, after };
};

export const facingFromState = (state: SimulationStateSchema): DirectionSchema => state.avatar.facing;