import { describe, expect, it } from 'vitest';

import type { MissionPackageSchema } from '@codequest/domain';

import { listAllMissions } from './registry';
import { validateContentRegistry, type RegistryIssueCode } from './registry-validation';

const clone = (): MissionPackageSchema[] =>
  JSON.parse(JSON.stringify(listAllMissions())) as MissionPackageSchema[];

const codes = (missions: readonly MissionPackageSchema[]): RegistryIssueCode[] =>
  validateContentRegistry(missions).issues.map((issue) => issue.code);

describe('validateContentRegistry', () => {
  it('accepts the shipped catalogue', () => {
    const result = validateContentRegistry(listAllMissions());
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('catches a mission nothing unlocks', () => {
    const missions = clone();
    // m04 now requires a mission that is never completed anywhere.
    missions[3].identity.prerequisiteLevelIds = ['m99'];
    expect(codes(missions)).toContain('dangling-prerequisite');
    expect(codes(missions)).toContain('progression-dead-end');
  });

  it('catches a prerequisite cycle instead of looping forever', () => {
    const missions = clone();
    missions[0].identity.prerequisiteLevelIds = ['m02'];
    expect(codes(missions)).toContain('prerequisite-cycle');
  });

  it('catches a duplicate level id and a duplicate ordinal', () => {
    const missions = clone();
    missions[1].identity.levelId = 'm01';
    expect(codes(missions)).toContain('duplicate-level-id');

    const ordinalClash = clone();
    ordinalClash[1].identity.ordinal = 1;
    expect(codes(ordinalClash)).toContain('duplicate-ordinal');
  });

  it('catches a zone that does not exist or does not match', () => {
    const missions = clone();
    missions[0].identity.zoneId = 'atlantis';
    const found = codes(missions);
    expect(found).toContain('unknown-zone');
    expect(found).toContain('zone-mismatch');
  });

  it('catches a budget that cannot fit the mission or its own solution', () => {
    const missions = clone();
    missions[0].budgets.maxMissionObjects = 1;
    expect(codes(missions)).toContain('object-budget-exceeded');

    const tight = clone();
    tight[0].budgets.maxStepCount = 1;
    expect(codes(tight)).toContain('step-budget-below-solution');
  });

  it('requires a known solution and at least one failure fixture', () => {
    const missions = clone();
    missions[0].knownSolutions = [];
    expect(codes(missions)).toContain('insufficient-solutions');

    const noFixtures = clone();
    noFixtures[0].expectedFailures = [];
    expect(codes(noFixtures)).toContain('missing-failure-fixtures');
  });

  it('catches a zone whose entry mission is missing', () => {
    // Drop m01, the Meadow entry, but keep the rest of the zone.
    const missions = clone().filter((mission) => mission.identity.levelId !== 'm01');
    expect(codes(missions)).toContain('missing-zone-entry');
  });

  it('catches mixed locales across the catalogue', () => {
    const missions = clone();
    missions[2].briefing.locale = 'fr-FR';
    expect(codes(missions)).toContain('locale-mismatch');
  });

  it('surfaces a malformed mission through the per-mission validator', () => {
    const missions = clone();
    missions[0].starterCode = '';
    expect(codes(missions)).toContain('mission-invalid');
  });
});
