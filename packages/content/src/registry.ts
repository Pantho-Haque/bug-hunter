import type {
  LevelId,
  MissionPackageSchema,
  ZoneId,
} from '@codequest/domain';
import { levelId, missionPackageSchema } from '@codequest/domain';

import { m01FirstSteps } from './missions/m01-first-steps';
import { knownZones } from './zones';

export { knownZones };
export type { ZoneSummary } from './zones';

export interface ContentRegistry {
  readonly zones: readonly ZoneId[];
  readonly missions: ReadonlyMap<LevelId, MissionPackageSchema>;
  getMission(levelId: LevelId): MissionPackageSchema | undefined;
  listMissionsByZone(zoneId: ZoneId): readonly MissionPackageSchema[];
}

const seedMissions: readonly MissionPackageSchema[] = [m01FirstSteps];

const seedMissionMap: ReadonlyMap<LevelId, MissionPackageSchema> = (() => {
  const map = new Map<LevelId, MissionPackageSchema>();
  for (const mission of seedMissions) {
    const result = missionPackageSchema.safeParse(mission);
    if (!result.success) {
      throw new Error(
        `Seed mission ${mission.identity.levelId} failed registry validation: ${result.error.message}`,
      );
    }
    map.set(levelId(mission.identity.levelId), result.data);
  }
  return map;
})();

export const contentRegistry: ContentRegistry = {
  zones: knownZones.map((zone) => zone.id),
  missions: seedMissionMap,
  getMission(value) {
    return seedMissionMap.get(levelId(value));
  },
  listMissionsByZone(zoneId) {
    return seedMissions.filter((mission) => mission.identity.zoneId === zoneId);
  },
};

export const listAllMissions = (): readonly MissionPackageSchema[] => seedMissions;