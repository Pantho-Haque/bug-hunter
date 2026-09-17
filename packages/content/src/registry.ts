import type {
  LevelId,
  MissionPackageSchema,
  ZoneId,
} from '@codequest/domain';
import { levelId, missionPackageSchema } from '@codequest/domain';

import { m01FirstSteps } from './missions/m01-first-steps';
import { m02TurnTowardLight } from './missions/m02-turn-toward-light';
import { m03TreasureAtYourFeet } from './missions/m03-treasure-at-your-feet';
import { m04TheGateLever } from './missions/m04-the-gate-lever';
import { m05ShortSafeRoute } from './missions/m05-short-safe-route';
import { m06MeadowCheckpoint } from './missions/m06-meadow-checkpoint';
import { m07NameTheTrail } from './missions/m07-name-the-trail';
import { m08TwoSleepingFireflies } from './missions/m08-two-sleeping-fireflies';
import { m09FunctionDoor } from './missions/m09-function-door';
import { m10PackAPath } from './missions/m10-pack-a-path';
import { m11GiveItANumber } from './missions/m11-give-it-a-number';
import { m12EchoCheckpoint } from './missions/m12-echo-checkpoint';
import { m13TidalSteps } from './missions/m13-tidal-steps';
import { m14LightTheBuoys } from './missions/m14-light-the-buoys';
import { m15SquareDock } from './missions/m15-square-dock';
import { m16StopAtTheReef } from './missions/m16-stop-at-the-reef';
import { m17PearlsOnAlternateTiles } from './missions/m17-pearls-on-alternate-tiles';
import { m18LagoonCheckpoint } from './missions/m18-lagoon-checkpoint';
import { m19TheWindFlag } from './missions/m19-the-wind-flag';
import { m20ForkInThePath } from './missions/m20-fork-in-the-path';
import { m21LanternCheck } from './missions/m21-lantern-check';
import { m22RepairOrPass } from './missions/m22-repair-or-pass';
import { m23CountTheCrystals } from './missions/m23-count-the-crystals';
import { m24CliffsCheckpoint } from './missions/m24-cliffs-checkpoint';
import { m25StarList } from './missions/m25-star-list';
import { m26DeliverTheSamples } from './missions/m26-deliver-the-samples';
import { m27FindTheBug } from './missions/m27-find-the-bug';
import { m28FixTheLoop } from './missions/m28-fix-the-loop';
import { m29PlanTheRescue } from './missions/m29-plan-the-rescue';
import { m30CodequestFinale } from './missions/m30-codequest-finale';
import { knownZones } from './zones';

export { knownZones };
export type { ZoneSummary } from './zones';

export interface ContentRegistry {
  readonly zones: readonly ZoneId[];
  readonly missions: ReadonlyMap<LevelId, MissionPackageSchema>;
  getMission(levelId: LevelId): MissionPackageSchema | undefined;
  listMissionsByZone(zoneId: ZoneId): readonly MissionPackageSchema[];
}

const seedMissions: readonly MissionPackageSchema[] = [
  m01FirstSteps,
  m02TurnTowardLight,
  m03TreasureAtYourFeet,
  m04TheGateLever,
  m05ShortSafeRoute,
  m06MeadowCheckpoint,
  m07NameTheTrail,
  m08TwoSleepingFireflies,
  m09FunctionDoor,
  m10PackAPath,
  m11GiveItANumber,
  m12EchoCheckpoint,
  m13TidalSteps,
  m14LightTheBuoys,
  m15SquareDock,
  m16StopAtTheReef,
  m17PearlsOnAlternateTiles,
  m18LagoonCheckpoint,
  m19TheWindFlag,
  m20ForkInThePath,
  m21LanternCheck,
  m22RepairOrPass,
  m23CountTheCrystals,
  m24CliffsCheckpoint,
  m25StarList,
  m26DeliverTheSamples,
  m27FindTheBug,
  m28FixTheLoop,
  m29PlanTheRescue,
  m30CodequestFinale,
];

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