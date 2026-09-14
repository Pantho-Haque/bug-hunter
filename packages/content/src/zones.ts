import type { ZoneId } from '@codequest/domain';

export interface ZoneSummary {
  readonly id: ZoneId;
  readonly title: string;
  readonly unlockMissionId: string;
}

export const knownZones: readonly ZoneSummary[] = [
  { id: 'meadow-of-moves' as ZoneId, title: 'Meadow of Moves', unlockMissionId: 'm-01' },
  { id: 'echo-forest' as ZoneId, title: 'Echo Forest', unlockMissionId: 'm-06' },
  { id: 'loop-lagoon' as ZoneId, title: 'Loop Lagoon', unlockMissionId: 'm-12' },
  { id: 'logic-cliffs' as ZoneId, title: 'Logic Cliffs', unlockMissionId: 'm-18' },
  { id: 'maker-observatory' as ZoneId, title: 'Maker Observatory', unlockMissionId: 'm-24' },
];