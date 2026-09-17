import type { MissionPackageSchema } from '@codequest/domain';

import { validateMissionPackage } from './validation';
import type { ValidationIssue, ValidationResult } from './validation';
import { knownZones } from './zones';

/**
 * Whole-catalogue checks. `validateMissionPackage` answers "is this mission
 * well formed"; these answer "does the set of missions still make a game" —
 * the questions that only break once a second zone exists, which is exactly
 * when content debt starts accruing.
 */
export type RegistryIssueCode =
  | 'duplicate-level-id'
  | 'dangling-prerequisite'
  | 'prerequisite-cycle'
  | 'progression-dead-end'
  | 'zone-mismatch'
  | 'unknown-zone'
  | 'duplicate-ordinal'
  | 'missing-zone-entry'
  | 'object-budget-exceeded'
  | 'step-budget-below-solution'
  | 'insufficient-solutions'
  | 'missing-failure-fixtures'
  | 'locale-mismatch'
  | 'mission-invalid';

export interface RegistryIssue {
  readonly code: RegistryIssueCode;
  readonly path: string;
  readonly message: string;
}

export interface RegistryValidationResult {
  readonly ok: boolean;
  readonly issues: readonly RegistryIssue[];
}

/**
 * Reachable means: startable from a mission with no prerequisites, following
 * prerequisite edges where every prerequisite is itself reachable. Anything
 * else is a mission a child can never open — a progression dead end.
 */
const reachableLevelIds = (missions: readonly MissionPackageSchema[]): ReadonlySet<string> => {
  const byId = new Map(missions.map((mission) => [mission.identity.levelId, mission]));
  const reachable = new Set<string>();
  let grew = true;
  while (grew) {
    grew = false;
    for (const mission of missions) {
      const id = mission.identity.levelId;
      if (reachable.has(id)) continue;
      const open = mission.identity.prerequisiteLevelIds.every(
        (prerequisite) => byId.has(prerequisite) && reachable.has(prerequisite),
      );
      if (open) {
        reachable.add(id);
        grew = true;
      }
    }
  }
  return reachable;
};

/** Returns the first prerequisite cycle found, as the ids on it. */
const findCycle = (missions: readonly MissionPackageSchema[]): readonly string[] | null => {
  const byId = new Map(missions.map((mission) => [mission.identity.levelId, mission]));
  const state = new Map<string, 'open' | 'done'>();
  const stack: string[] = [];

  const walk = (id: string): readonly string[] | null => {
    if (state.get(id) === 'done') return null;
    if (state.get(id) === 'open') return [...stack.slice(stack.indexOf(id)), id];
    const mission = byId.get(id);
    if (!mission) return null;
    state.set(id, 'open');
    stack.push(id);
    for (const prerequisite of mission.identity.prerequisiteLevelIds) {
      const cycle = walk(prerequisite);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(id, 'done');
    return null;
  };

  for (const mission of missions) {
    const cycle = walk(mission.identity.levelId);
    if (cycle) return cycle;
  }
  return null;
};

export const validateContentRegistry = (
  missions: readonly MissionPackageSchema[],
): RegistryValidationResult => {
  const issues: RegistryIssue[] = [];
  const seen = new Set<string>();
  const ordinalsByZone = new Map<string, Set<number>>();
  const zoneIds = new Set(knownZones.map((zone) => zone.id as string));

  for (const mission of missions) {
    const id = mission.identity.levelId;
    const path = `missions[${id}]`;

    const missionResult: ValidationResult = validateMissionPackage(mission);
    for (const issue of missionResult.issues as readonly ValidationIssue[]) {
      issues.push({
        code: 'mission-invalid',
        path: `${path}.${issue.path}`,
        message: `${issue.code}: ${issue.message}`,
      });
    }

    if (seen.has(id)) {
      issues.push({ code: 'duplicate-level-id', path, message: `level id ${id} is used twice` });
    }
    seen.add(id);

    if (mission.identity.zoneId !== mission.zoneId) {
      issues.push({
        code: 'zone-mismatch',
        path,
        message: `identity.zoneId ${mission.identity.zoneId} does not match zoneId ${mission.zoneId}`,
      });
    }
    if (!zoneIds.has(mission.identity.zoneId)) {
      issues.push({
        code: 'unknown-zone',
        path,
        message: `zone ${mission.identity.zoneId} is not in knownZones`,
      });
    }

    const ordinals = ordinalsByZone.get(mission.identity.zoneId) ?? new Set<number>();
    if (ordinals.has(mission.identity.ordinal)) {
      issues.push({
        code: 'duplicate-ordinal',
        path,
        message: `ordinal ${mission.identity.ordinal} is used twice in ${mission.identity.zoneId}`,
      });
    }
    ordinals.add(mission.identity.ordinal);
    ordinalsByZone.set(mission.identity.zoneId, ordinals);

    if (mission.objects.length > mission.budgets.maxMissionObjects) {
      issues.push({
        code: 'object-budget-exceeded',
        path,
        message: `${mission.objects.length} objects exceeds budget ${mission.budgets.maxMissionObjects}`,
      });
    }

    // A budget below the mission's own canonical solution makes it unwinnable.
    for (const solution of mission.knownSolutions) {
      if (solution.expectedStepCount > mission.budgets.maxStepCount) {
        issues.push({
          code: 'step-budget-below-solution',
          path: `${path}.knownSolutions[${solution.solutionId}]`,
          message: `solution needs ${solution.expectedStepCount} steps but the budget is ${mission.budgets.maxStepCount}`,
        });
      }
      if (solution.expectedCommandCount > mission.budgets.maxCommands) {
        issues.push({
          code: 'step-budget-below-solution',
          path: `${path}.knownSolutions[${solution.solutionId}]`,
          message: `solution needs ${solution.expectedCommandCount} commands but the budget is ${mission.budgets.maxCommands}`,
        });
      }
    }

    if (mission.knownSolutions.length === 0) {
      issues.push({
        code: 'insufficient-solutions',
        path,
        message: 'a mission must declare at least one known solution',
      });
    }
    if (mission.expectedFailures.length === 0) {
      issues.push({
        code: 'missing-failure-fixtures',
        path,
        message: 'a mission must declare at least one expected failure trace',
      });
    }
  }

  for (const mission of missions) {
    for (const prerequisite of mission.identity.prerequisiteLevelIds) {
      if (!seen.has(prerequisite)) {
        issues.push({
          code: 'dangling-prerequisite',
          path: `missions[${mission.identity.levelId}]`,
          message: `prerequisite ${prerequisite} does not exist`,
        });
      }
    }
  }

  const cycle = findCycle(missions);
  if (cycle) {
    issues.push({
      code: 'prerequisite-cycle',
      path: 'missions',
      message: `prerequisite cycle: ${cycle.join(' → ')}`,
    });
  } else {
    const reachable = reachableLevelIds(missions);
    for (const mission of missions) {
      if (!reachable.has(mission.identity.levelId)) {
        issues.push({
          code: 'progression-dead-end',
          path: `missions[${mission.identity.levelId}]`,
          message: 'no unlock path reaches this mission',
        });
      }
    }
  }

  // Every shipped zone needs its entry mission, or the map offers a locked door.
  for (const zone of knownZones) {
    const zoneMissions = missions.filter((m) => m.identity.zoneId === zone.id);
    if (zoneMissions.length === 0) continue;
    if (!zoneMissions.some((m) => m.identity.levelId === zone.unlockMissionId)) {
      issues.push({
        code: 'missing-zone-entry',
        path: `zones[${zone.id}]`,
        message: `zone entry mission ${zone.unlockMissionId} is missing`,
      });
    }
  }

  const locales = new Set(missions.map((mission) => mission.briefing.locale));
  if (locales.size > 1) {
    issues.push({
      code: 'locale-mismatch',
      path: 'missions',
      message: `missions mix locales: ${[...locales].join(', ')}`,
    });
  }

  return { ok: issues.length === 0, issues };
};
