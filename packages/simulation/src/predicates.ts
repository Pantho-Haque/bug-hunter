import type { MissionPackageSchema, PredicateKindSchema } from '@codequest/domain';

import { attemptMove, cellKey } from './collisions';
import type { SimulationState } from './state';

/**
 * Pure reads of world state for learner-callable predicates. A predicate must
 * never mutate: it answers a question the child asked about the world, and the
 * same question asked twice in the same state must give the same answer.
 *
 * The three world predicates read authored flags and inventory, so a mission
 * seeds them through `startState` rather than the engine inventing new rules.
 */
export const evaluatePredicate = (
  kind: PredicateKindSchema,
  state: SimulationState,
  mission: MissionPackageSchema,
): boolean => {
  switch (kind) {
    case 'canMoveForward':
      return !attemptMove(state, mission).blocked;
    case 'isPearlHere': {
      const here = cellKey(state.avatar);
      return mission.objects.some(
        (object) =>
          object.kind === 'collectible' &&
          cellKey(object.cell) === here &&
          !state.collected.includes(object.id),
      );
    }
    case 'isWindSafe':
      return state.flags['world.windSafe'] === true;
    case 'signPointsLeft':
      return state.flags['world.signPointsLeft'] === true;
    case 'hasLantern':
      return (state.inventory.lantern ?? 0) > 0;
  }
};
