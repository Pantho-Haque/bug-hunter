import type { AvatarState } from '@codequest/simulation';
import { createInitialState } from '@codequest/simulation';

export interface MissionFixtureOptions {
  readonly startAt?: { readonly cellX: number; readonly cellZ: number };
  readonly facing?: AvatarState['facing'];
}

export const createMissionFixture = (options: MissionFixtureOptions = {}) => {
  const avatar: AvatarState = {
    cellX: options.startAt?.cellX ?? 0,
    cellZ: options.startAt?.cellZ ?? 0,
    facing: options.facing ?? 'north',
  };
  return createInitialState(avatar);
};

export const testFixturesPackageMarker = '@codequest/test-fixtures';