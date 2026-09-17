import { describe, expect, it } from 'vitest';

import { m01FirstSteps } from './missions/m01-first-steps';
import { listAllMissions } from './registry';
import { validateMissionPackage } from './validation';
import type { MissionPackageSchema } from '@codequest/domain';

const cloneMission = (): MissionPackageSchema =>
  JSON.parse(JSON.stringify(m01FirstSteps)) as MissionPackageSchema;

describe('validateMissionPackage', () => {
  it('accepts M01 as-is', () => {
    const result = validateMissionPackage(m01FirstSteps);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it.each(listAllMissions().map((mission) => [mission.identity.levelId, mission] as const))(
    'accepts shipped mission %s',
    (_levelId, mission) => {
      expect(validateMissionPackage(mission)).toEqual({ ok: true, issues: [] });
    },
  );

  it('flags an invalid level id', () => {
    const mission = cloneMission();
    (mission.identity as { levelId: string }).levelId = 'Bad Level!';
    const result = validateMissionPackage(mission);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'invalid-id')).toBe(true);
  });

  it('flags duplicate object ids', () => {
    const mission = cloneMission();
    const goal = mission.objects.find((o) => o.kind === 'goal')!;
    const spawn = mission.objects.find((o) => o.kind === 'spawn')!;
    if (spawn.kind === 'spawn') {
      (spawn as { id: string }).id = goal.id;
    }
    const result = validateMissionPackage(mission);
    expect(result.issues.some((i) => i.code === 'duplicate-object-id')).toBe(true);
  });

  it('flags an unreachable goal when blocked by a wall', () => {
    const mission = cloneMission();
    mission.objects.push({
      id: 'cage-spawn',
      label: 'Cage around spawn',
      required: false,
      kind: 'blocker',
      occupiedCells: [
        { cellX: -1, cellZ: 0 },
        { cellX: 1, cellZ: 0 },
        { cellX: 0, cellZ: -1 },
        { cellX: 0, cellZ: 1 },
        { cellX: -1, cellZ: -1 },
        { cellX: 1, cellZ: -1 },
        { cellX: -1, cellZ: 1 },
        { cellX: 1, cellZ: 1 },
      ],
      reasonKey: 'wall.blocks',
    });
    const result = validateMissionPackage(mission);
    expect(result.issues.some((i) => i.code === 'unreachable-goal')).toBe(true);
  });

  it('treats an unlockable gate as passable for reachability', () => {
    const mission = cloneMission();
    const goal = mission.objects.find((o) => o.kind === 'goal')!;
    if (goal.kind !== 'goal') return;
    mission.objects.push({
      id: 'gate-ring',
      label: 'Gate around the goal',
      required: true,
      kind: 'blocker',
      occupiedCells: [
        { cellX: goal.cell.cellX - 1, cellZ: goal.cell.cellZ },
        { cellX: goal.cell.cellX + 1, cellZ: goal.cell.cellZ },
        { cellX: goal.cell.cellX, cellZ: goal.cell.cellZ - 1 },
        { cellX: goal.cell.cellX, cellZ: goal.cell.cellZ + 1 },
      ],
      reasonKey: 'gate.closed',
      unlockedByFlag: 'interactable.lever-1.state',
    });
    const result = validateMissionPackage(mission);
    expect(result.issues.some((i) => i.code === 'unreachable-goal')).toBe(false);
  });

  it('flags a goal walled in by blockers that never open', () => {
    const mission = cloneMission();
    const goal = mission.objects.find((o) => o.kind === 'goal')!;
    if (goal.kind !== 'goal') return;
    mission.objects.push({
      id: 'stone-ring',
      label: 'Wall around the goal',
      required: false,
      kind: 'blocker',
      occupiedCells: [
        { cellX: goal.cell.cellX - 1, cellZ: goal.cell.cellZ },
        { cellX: goal.cell.cellX + 1, cellZ: goal.cell.cellZ },
        { cellX: goal.cell.cellX, cellZ: goal.cell.cellZ - 1 },
        { cellX: goal.cell.cellX, cellZ: goal.cell.cellZ + 1 },
      ],
      reasonKey: 'wall.blocks',
    });
    const result = validateMissionPackage(mission);
    expect(result.issues.some((i) => i.code === 'unreachable-goal')).toBe(true);
  });

  it('flags when hints are missing', () => {
    const mission = cloneMission();
    (mission as { hints: MissionPackageSchema['hints'] }).hints = mission.hints.slice(0, 2) as unknown as MissionPackageSchema['hints'];
    const result = validateMissionPackage(mission);
    expect(result.issues.some((i) => i.code === 'missing-hints')).toBe(true);
  });

  it('flags a missing analogous example', () => {
    const mission = cloneMission();
    delete (mission as { analogousExample?: unknown }).analogousExample;
    const result = validateMissionPackage(mission);
    expect(result.issues.some((i) => i.code === 'missing-example')).toBe(true);
  });

  it('flags a reward asset that is not a known asset id', () => {
    const mission = cloneMission();
    mission.rewards = [
      { rewardId: 'reward-mystery', assetId: 'totally-made-up', label: 'Mystery', cosmetic: true },
    ];
    const result = validateMissionPackage(mission);
    expect(result.issues.some((i) => i.code === 'unknown-reward-asset')).toBe(true);
  });

  it('flags unknown reward assets when a registry is provided', () => {
    const mission = cloneMission();
    const result = validateMissionPackage(mission, {
      knownAssetIds: new Set(),
    });
    expect(result.issues.some((i) => i.code === 'unknown-reward-asset')).toBe(true);
  });

  it('flags incompatible api versions', () => {
    const mission = cloneMission();
    mission.allowedApi = mission.allowedApi.map((entry, idx) =>
      idx === 0 ? { ...entry, apiVersion: 'v999' as unknown as typeof entry.apiVersion } : entry,
    ) as unknown as MissionPackageSchema['allowedApi'];
    const result = validateMissionPackage(mission);
    expect(result.issues.some((i) => i.code === 'incompatible-api-version')).toBe(true);
  });

  it('flags empty starter code', () => {
    const mission = cloneMission();
    (mission as { starterCode: string }).starterCode = '   \n  ';
    const result = validateMissionPackage(mission);
    expect(result.issues.some((i) => i.code === 'starter-code-empty')).toBe(true);
  });

  it('flags empty briefing controls', () => {
    const mission = cloneMission();
    mission.briefing.controls = [];
    const result = validateMissionPackage(mission);
    expect(result.issues.some((i) => i.code === 'briefing-controls-empty')).toBe(true);
  });

  it.each([
    ['null', null],
    ['a string', 'not a mission'],
    ['an empty object', {}],
    ['a half-built mission', { identity: { levelId: 'm01' }, objects: [] }],
  ])('rejects %s without throwing', (_label, value) => {
    const result = validateMissionPackage(value);
    expect(result.ok).toBe(false);
    expect(result.issues.map((i) => i.code)).toEqual(['malformed-import']);
  });
});