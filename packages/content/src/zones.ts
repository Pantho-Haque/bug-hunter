import type { LevelId, ZoneId } from '@codequest/domain';

export interface ZoneSummary {
  readonly id: ZoneId;
  readonly title: string;
  readonly unlockMissionId: LevelId;
}

export const knownZones: readonly ZoneSummary[] = [
  { id: 'meadow-of-moves' as ZoneId, title: 'Meadow of Moves', unlockMissionId: 'm01' as LevelId },
  { id: 'echo-forest' as ZoneId, title: 'Echo Forest', unlockMissionId: 'm07' as LevelId },
  { id: 'loop-lagoon' as ZoneId, title: 'Loop Lagoon', unlockMissionId: 'm13' as LevelId },
  { id: 'logic-cliffs' as ZoneId, title: 'Logic Cliffs', unlockMissionId: 'm19' as LevelId },
  { id: 'maker-observatory' as ZoneId, title: 'Maker Observatory', unlockMissionId: 'm25' as LevelId },
];