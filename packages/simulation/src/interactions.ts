import type {
  InteractableObjectSchema,
  MissionPackageSchema,
} from '@codequest/domain';

import type { SimulationState } from './state';

import { cellKey, deltaForFacing, distance, directionToward } from './collisions';

export interface CollectOutcome {
  readonly nextState: SimulationState;
  readonly collected: boolean;
  readonly reasonKey: string;
  readonly collectedObjectId: string | undefined;
}

export const attemptCollect = (
  state: SimulationState,
  mission: MissionPackageSchema,
): CollectOutcome => {
  const forward = {
    cellX: state.avatar.cellX + deltaForFacing(state.avatar.facing).dX,
    cellZ: state.avatar.cellZ + deltaForFacing(state.avatar.facing).dZ,
  };
  const candidates = [forward, { cellX: state.avatar.cellX, cellZ: state.avatar.cellZ }];
  const collectible = mission.objects.find(
    (o) => o.kind === 'collectible' && candidates.some((c) => cellKey(c) === cellKey(o.cell)),
  );
  if (!collectible || collectible.kind !== 'collectible') {
    return {
      nextState: state,
      collected: false,
      reasonKey: 'collect.nothing-here',
      collectedObjectId: undefined,
    };
  }
  if (state.collected.includes(collectible.id)) {
    return {
      nextState: state,
      collected: false,
      reasonKey: 'collect.already-collected',
      collectedObjectId: collectible.id,
    };
  }
  return {
    nextState: {
      ...state,
      collected: [...state.collected, collectible.id],
      inventory: {
        ...state.inventory,
        [collectible.collectionEffect]: (state.inventory[collectible.collectionEffect] ?? 0) + 1,
      },
    },
    collected: true,
    reasonKey: 'collect.picked-up',
    collectedObjectId: collectible.id,
  };
};

export interface InteractOutcome {
  readonly nextState: SimulationState;
  readonly applied: boolean;
  readonly reasonKey: string;
  readonly targetObjectId: string | undefined;
}

export const isInteractableInRange = (
  state: SimulationState,
  target: InteractableObjectSchema,
): { readonly inRange: boolean; readonly facingOk: boolean } => {
  const d = distance(state.avatar, target.cell);
  const inRange = d <= target.range;
  const facingOk =
    target.requiredFacing === undefined ||
    target.requiredFacing === state.avatar.facing;
  return { inRange, facingOk };
};

export const attemptInteract = (
  state: SimulationState,
  mission: MissionPackageSchema,
): InteractOutcome => {
  const facingDir = state.avatar.facing;
  const forwardCell = {
    cellX: state.avatar.cellX + deltaForFacing(facingDir).dX,
    cellZ: state.avatar.cellZ + deltaForFacing(facingDir).dZ,
  };
  const interactable = mission.objects.find(
    (o): o is InteractableObjectSchema =>
      o.kind === 'interactable' && cellKey(o.cell) === cellKey(forwardCell),
  );
  if (!interactable) {
    return {
      nextState: state,
      applied: false,
      reasonKey: 'interact.nothing-here',
      targetObjectId: undefined,
    };
  }
  if (interactable.requiredFacing && interactable.requiredFacing !== state.avatar.facing) {
    return {
      nextState: state,
      applied: false,
      reasonKey: 'interact.wrong-facing',
      targetObjectId: interactable.id,
    };
  }
  if (distance(state.avatar, interactable.cell) > interactable.range) {
    return {
      nextState: state,
      applied: false,
      reasonKey: 'interact.out-of-range',
      targetObjectId: interactable.id,
    };
  }
  const transition = interactable.stateTransitions.find(
    (t) => t.from === interactable.initialState,
  );
  const nextStateKey = transition?.to ?? interactable.initialState;
  return {
    nextState: {
      ...state,
      flags: {
        ...state.flags,
        [`interactable.${interactable.id}.state`]: true,
        [`interactable.${interactable.id}.stateValue`]: nextStateKey === interactable.initialState,
      },
    },
    applied: true,
    reasonKey: 'interact.applied',
    targetObjectId: interactable.id,
  };
};

export const facingToward = directionToward;