declare const LevelIdBrand: unique symbol;
declare const ZoneIdBrand: unique symbol;
declare const MissionObjectIdBrand: unique symbol;
declare const ApiCapabilityIdBrand: unique symbol;

export type LevelId = string & { readonly [LevelIdBrand]: 'LevelId' };
export type ZoneId = string & { readonly [ZoneIdBrand]: 'ZoneId' };
export type MissionObjectId = string & { readonly [MissionObjectIdBrand]: 'MissionObjectId' };
export type ApiCapabilityId = string & { readonly [ApiCapabilityIdBrand]: 'ApiCapabilityId' };

export const levelId = (value: string): LevelId => value as LevelId;
export const zoneId = (value: string): ZoneId => value as ZoneId;
export const missionObjectId = (value: string): MissionObjectId => value as MissionObjectId;
export const apiCapabilityId = (value: string): ApiCapabilityId => value as ApiCapabilityId;

export type Direction = 'north' | 'east' | 'south' | 'west';