import type { MissionPackageSchema } from '@codequest/domain';

export interface ValidationIssue {
  readonly code: ValidationIssueCode;
  readonly path: string;
  readonly message: string;
}

export type ValidationIssueCode =
  | 'invalid-id'
  | 'duplicate-object-id'
  | 'duplicate-hint-id'
  | 'unreachable-goal'
  | 'missing-hints'
  | 'unknown-reward-asset'
  | 'incompatible-api-version'
  | 'malformed-import'
  | 'starter-code-empty'
  | 'briefing-controls-empty';

export interface ValidationResult {
  readonly ok: boolean;
  readonly issues: readonly ValidationIssue[];
}

const VALID_ID = /^[a-z0-9][a-z0-9-]*$/;

const cellKey = (cell: { readonly cellX: number; readonly cellZ: number }) =>
  `${cell.cellX},${cell.cellZ}`;

const occupiedCells = (
  mission: MissionPackageSchema,
): Set<string> => {
  const set = new Set<string>();
  for (const obj of mission.objects) {
    if (obj.kind === 'blocker') {
      for (const cell of obj.occupiedCells) {
        set.add(cellKey(cell));
      }
    }
  }
  return set;
};

const adjacentFreeCells = (
  blocked: ReadonlySet<string>,
  cell: { readonly cellX: number; readonly cellZ: number },
): readonly { readonly cellX: number; readonly cellZ: number }[] => {
  const offsets = [
    { cellX: cell.cellX + 1, cellZ: cell.cellZ },
    { cellX: cell.cellX - 1, cellZ: cell.cellZ },
    { cellX: cell.cellX, cellZ: cell.cellZ + 1 },
    { cellX: cell.cellX, cellZ: cell.cellZ - 1 },
  ];
  return offsets.filter((c) => !blocked.has(cellKey(c)));
};

export const validateMissionPackage = (
  mission: MissionPackageSchema,
  options: { readonly knownAssetIds?: ReadonlySet<string> } = {},
): ValidationResult => {
  const knownAssetsProvided = options.knownAssetIds !== undefined;
  const knownAssets = options.knownAssetIds ?? new Set<string>();
  const issues: ValidationIssue[] = [];

  if (!VALID_ID.test(mission.identity.levelId)) {
    issues.push({
      code: 'invalid-id',
      path: 'identity.levelId',
      message: `levelId ${mission.identity.levelId} must match ${VALID_ID.toString()}`,
    });
  }

  if (!VALID_ID.test(mission.identity.zoneId)) {
    issues.push({
      code: 'invalid-id',
      path: 'identity.zoneId',
      message: `zoneId ${mission.identity.zoneId} must match ${VALID_ID.toString()}`,
    });
  }

  for (const api of mission.allowedApi) {
    if (api.apiVersion !== mission.identity.apiVersion) {
      issues.push({
        code: 'incompatible-api-version',
        path: 'allowedApi',
        message: `capability ${api.capabilityId} declares ${api.apiVersion} but mission expects ${mission.identity.apiVersion}`,
      });
    }
  }

  const seen = new Set<string>();
  for (const obj of mission.objects) {
    if (seen.has(obj.id)) {
      issues.push({
        code: 'duplicate-object-id',
        path: `objects[${obj.id}]`,
        message: `object id ${obj.id} is duplicated`,
      });
    }
    seen.add(obj.id);
    if (!VALID_ID.test(obj.id)) {
      issues.push({
        code: 'invalid-id',
        path: `objects[${obj.id}].id`,
        message: `object id ${obj.id} must match ${VALID_ID.toString()}`,
      });
    }
  }

  const hintIds = new Set<string>();
  for (const hint of mission.hints) {
    if (hintIds.has(hint.hintId)) {
      issues.push({
        code: 'duplicate-hint-id',
        path: `hints[${hint.hintId}]`,
        message: `hint id ${hint.hintId} is duplicated`,
      });
    }
    hintIds.add(hint.hintId);
  }

  if (mission.hints.length !== 4) {
    issues.push({
      code: 'missing-hints',
      path: 'hints',
      message: `expected exactly 4 hints, got ${mission.hints.length}`,
    });
  }

  for (const reward of mission.rewards) {
    if (knownAssetsProvided && !knownAssets.has(reward.assetId)) {
      issues.push({
        code: 'unknown-reward-asset',
        path: `rewards[${reward.rewardId}]`,
        message: `reward asset ${reward.assetId} is not registered`,
      });
    }
  }

  const blocked = occupiedCells(mission);
  const spawn = mission.objects.find((o) => o.kind === 'spawn');
  const goal = mission.objects.find((o) => o.kind === 'goal');
  if (spawn && goal && (spawn.kind === 'spawn' && goal.kind === 'goal')) {
    const reachableFromSpawn = bfs(spawn.cell, blocked);
    if (!reachableFromSpawn.has(cellKey(goal.cell))) {
      issues.push({
        code: 'unreachable-goal',
        path: 'objects[goal]',
        message: `goal at ${cellKey(goal.cell)} is unreachable from spawn at ${cellKey(spawn.cell)}`,
      });
    }
    if (adjacentFreeCells(blocked, goal.cell).length === 0) {
      issues.push({
        code: 'unreachable-goal',
        path: 'objects[goal]',
        message: `goal at ${cellKey(goal.cell)} has no adjacent non-blocked cells`,
      });
    }
  }

  if (mission.starterCode.trim().length === 0) {
    issues.push({
      code: 'starter-code-empty',
      path: 'starterCode',
      message: 'starter code must not be empty',
    });
  }

  if (mission.briefing.controls.length === 0) {
    issues.push({
      code: 'briefing-controls-empty',
      path: 'briefing.controls',
      message: 'briefing must list at least one control affordance',
    });
  }

  return { ok: issues.length === 0, issues };
};

const MAX_BFS_RADIUS = 256;

const bfs = (
  start: { readonly cellX: number; readonly cellZ: number },
  blocked: ReadonlySet<string>,
): Set<string> => {
  const visited = new Set<string>([cellKey(start)]);
  let head = 0;
  const queue: { cellX: number; cellZ: number }[] = [start];
  const offsets = [
    { cellX: 1, cellZ: 0 },
    { cellX: -1, cellZ: 0 },
    { cellX: 0, cellZ: 1 },
    { cellX: 0, cellZ: -1 },
  ];
  while (head < queue.length) {
    const current = queue[head++];
    if (
      Math.abs(current.cellX - start.cellX) > MAX_BFS_RADIUS ||
      Math.abs(current.cellZ - start.cellZ) > MAX_BFS_RADIUS
    ) {
      continue;
    }
    for (const offset of offsets) {
      const next = { cellX: current.cellX + offset.cellX, cellZ: current.cellZ + offset.cellZ };
      const key = cellKey(next);
      if (visited.has(key) || blocked.has(key)) continue;
      visited.add(key);
      queue.push(next);
    }
  }
  return visited;
};
