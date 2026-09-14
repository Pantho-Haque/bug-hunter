declare const LevelIdBrand: unique symbol;
declare const ZoneIdBrand: unique symbol;
declare const MissionObjectIdBrand: unique symbol;
declare const MissionObjectKindBrand: unique symbol;
declare const HintIdBrand: unique symbol;
declare const RewardIdBrand: unique symbol;
declare const AssetIdBrand: unique symbol;
declare const ApiCapabilityIdBrand: unique symbol;
declare const ApiVersionBrand: unique symbol;
declare const ContentVersionBrand: unique symbol;
declare const SchemaVersionBrand: unique symbol;
declare const RunIdBrand: unique symbol;
declare const LocaleCodeBrand: unique symbol;

export type LevelId = string & { readonly [LevelIdBrand]: 'LevelId' };
export type ZoneId = string & { readonly [ZoneIdBrand]: 'ZoneId' };
export type MissionObjectId = string & { readonly [MissionObjectIdBrand]: 'MissionObjectId' };
export type MissionObjectKind = string & { readonly [MissionObjectKindBrand]: 'MissionObjectKind' };
export type HintId = string & { readonly [HintIdBrand]: 'HintId' };
export type RewardId = string & { readonly [RewardIdBrand]: 'RewardId' };
export type AssetId = string & { readonly [AssetIdBrand]: 'AssetId' };
export type ApiCapabilityId = string & { readonly [ApiCapabilityIdBrand]: 'ApiCapabilityId' };
export type ApiVersion = string & { readonly [ApiVersionBrand]: 'ApiVersion' };
export type ContentVersion = string & { readonly [ContentVersionBrand]: 'ContentVersion' };
export type SchemaVersion = string & { readonly [SchemaVersionBrand]: 'SchemaVersion' };
export type RunId = string & { readonly [RunIdBrand]: 'RunId' };
export type LocaleCode = string & { readonly [LocaleCodeBrand]: 'LocaleCode' };

export const levelId = (value: string): LevelId => value as LevelId;
export const zoneId = (value: string): ZoneId => value as ZoneId;
export const missionObjectId = (value: string): MissionObjectId => value as MissionObjectId;
export const missionObjectKind = (value: string): MissionObjectKind => value as MissionObjectKind;
export const hintId = (value: string): HintId => value as HintId;
export const rewardId = (value: string): RewardId => value as RewardId;
export const assetId = (value: string): AssetId => value as AssetId;
export const apiCapabilityId = (value: string): ApiCapabilityId => value as ApiCapabilityId;
export const apiVersion = (value: string): ApiVersion => value as ApiVersion;
export const contentVersion = (value: string): ContentVersion => value as ContentVersion;
export const schemaVersion = (value: string): SchemaVersion => value as SchemaVersion;
export const runId = (value: string): RunId => value as RunId;
export const localeCode = (value: string): LocaleCode => value as LocaleCode;

export type Direction = 'north' | 'east' | 'south' | 'west';

export const DIRECTIONS: readonly Direction[] = ['north', 'east', 'south', 'west'] as const;

export const directionToDegrees = (direction: Direction): 0 | 90 | 180 | 270 => {
  switch (direction) {
    case 'north':
      return 0;
    case 'east':
      return 90;
    case 'south':
      return 180;
    case 'west':
      return 270;
  }
};