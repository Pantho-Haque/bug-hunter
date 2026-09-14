import type { MissionPackageSchema } from '@codequest/domain';

import type { SimulationState } from './state';

export interface ObjectiveIssue {
  readonly code:
    | 'state-invariant-failed'
    | 'missing-object'
    | 'missing-flag'
    | 'missing-collected'
    | 'unrecognized-state-invariant'
    | 'wrong-terminal-cell'
    | 'step-budget-exceeded';
  readonly path: string;
  readonly message: string;
}

export interface ObjectiveResult {
  readonly ok: boolean;
  readonly issues: readonly ObjectiveIssue[];
}

const validateInvariant = (
  invariant: string,
  state: SimulationState,
  mission: MissionPackageSchema,
): { readonly ok: boolean; readonly reason: string } => {
  const parseCoordinate = (token: string): { readonly cellX: number; readonly cellZ: number } | null => {
    const match = /^(-?\d+),(-?\d+)$/.exec(token);
    if (!match) return null;
    return { cellX: Number(match[1]), cellZ: Number(match[2]) };
  };

  const avatarAtMatch = /^avatarAt\((-?\d+),(-?\d+)\)$/.exec(invariant);
  if (avatarAtMatch) {
    const x = Number(avatarAtMatch[1]);
    const z = Number(avatarAtMatch[2]);
    const ok = state.avatar.cellX === x && state.avatar.cellZ === z;
    return { ok, reason: `expected avatar at (${x},${z}), got (${state.avatar.cellX},${state.avatar.cellZ})` };
  }

  if (invariant === 'avatarAtGoal') {
    const goal = mission.objects.find((o) => o.kind === 'goal');
    if (!goal || goal.kind !== 'goal') return { ok: false, reason: 'mission has no goal object' };
    const ok = state.avatar.cellX === goal.cell.cellX && state.avatar.cellZ === goal.cell.cellZ;
    return { ok, reason: `expected avatar at goal (${goal.cell.cellX},${goal.cell.cellZ}), got (${state.avatar.cellX},${state.avatar.cellZ})` };
  }

  const stepCountMatch = /^stepCount\s*>=\s*(\d+)$/.exec(invariant);
  if (stepCountMatch) {
    const minimum = Number(stepCountMatch[1]);
    const ok = state.stepCount >= minimum;
    return { ok, reason: `stepCount ${state.stepCount} must be >= ${minimum}` };
  }

  const terminalMatch = /^terminalCell\((-?\d+),(-?\d+)\)$/.exec(invariant);
  if (terminalMatch) {
    const x = Number(terminalMatch[1]);
    const z = Number(terminalMatch[2]);
    const ok = state.avatar.cellX === x && state.avatar.cellZ === z;
    return { ok, reason: `expected terminal cell (${x},${z}), got (${state.avatar.cellX},${state.avatar.cellZ})` };
  }

  const coordCell = parseCoordinate(invariant);
  if (coordCell) {
    const ok = state.avatar.cellX === coordCell.cellX && state.avatar.cellZ === coordCell.cellZ;
    return { ok, reason: `expected avatar at (${coordCell.cellX},${coordCell.cellZ})` };
  }

  return { ok: false, reason: `unrecognized state invariant: ${invariant}` };
};

export const validateMissionObjectives = (
  mission: MissionPackageSchema,
  state: SimulationState,
): ObjectiveResult => {
  const issues: ObjectiveIssue[] = [];

  for (const invariant of mission.completion.stateInvariants) {
    const result = validateInvariant(invariant, state, mission);
    if (!result.ok) {
      issues.push({
        code: result.reason.startsWith('unrecognized state invariant')
          ? 'unrecognized-state-invariant'
          : 'state-invariant-failed',
        path: `completion.stateInvariants[${invariant}]`,
        message: result.reason,
      });
    }
  }

  for (const id of mission.completion.requiredObjectIds) {
    const present = mission.objects.some((o) => o.id === id);
    if (!present) {
      issues.push({
        code: 'missing-object',
        path: `completion.requiredObjectIds[${id}]`,
        message: `object ${id} is not present in mission`,
      });
    }
  }

  for (const [flag, expected] of Object.entries(mission.completion.requiredFlags)) {
    if (state.flags[flag] !== expected) {
      issues.push({
        code: 'missing-flag',
        path: `completion.requiredFlags[${flag}]`,
        message: `flag ${flag} expected=${expected}, actual=${String(state.flags[flag])}`,
      });
    }
  }

  for (const id of mission.completion.requiredCollected) {
    if (!state.collected.includes(id)) {
      issues.push({
        code: 'missing-collected',
        path: `completion.requiredCollected[${id}]`,
        message: `expected object ${id} to be collected`,
      });
    }
  }

  if (mission.completion.terminalCell) {
    const tc = mission.completion.terminalCell;
    if (state.avatar.cellX !== tc.cellX || state.avatar.cellZ !== tc.cellZ) {
      issues.push({
        code: 'wrong-terminal-cell',
        path: 'completion.terminalCell',
        message: `expected terminal cell (${tc.cellX},${tc.cellZ}), got (${state.avatar.cellX},${state.avatar.cellZ})`,
      });
    }
  }

  if (state.stepCount > mission.budgets.maxStepCount) {
    issues.push({
      code: 'step-budget-exceeded',
      path: 'budgets.maxStepCount',
      message: `stepCount ${state.stepCount} exceeds budget ${mission.budgets.maxStepCount}`,
    });
  }

  return { ok: issues.length === 0, issues };
};
