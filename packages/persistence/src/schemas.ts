import { z } from 'zod';

import {
  apiVersionSchema,
  assetIdSchema,
  contentVersionSchema,
  levelIdSchema,
  rewardIdSchema,
  schemaVersionSchema,
  zoneIdSchema,
} from '@codequest/domain';

export const settingsSchemaVersionSchema = z.literal(1).default(1);

export const avatarPresetSchema = z.enum(['panda', 'fox', 'robot', 'wizard']);
export type AvatarPresetSchema = z.infer<typeof avatarPresetSchema>;

export const textScaleSchema = z.enum(['small', 'medium', 'large', 'xlarge']);
export type TextScaleSchema = z.infer<typeof textScaleSchema>;

export const motionPreferenceSchema = z.enum(['full', 'reduced', 'off']);
export type MotionPreferenceSchema = z.infer<typeof motionPreferenceSchema>;

export const colorblindModeSchema = z.enum(['none', 'deuteranopia', 'protanopia', 'tritanopia']);
export type ColorblindModeSchema = z.infer<typeof colorblindModeSchema>;

export const captionStyleSchema = z.enum(['none', 'compact', 'detailed']);
export type CaptionStyleSchema = z.infer<typeof captionStyleSchema>;

export const settingsRecordSchema = z.object({
  schemaVersion: settingsSchemaVersionSchema,
  locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/).default('en-US'),
  reducedMotion: z.boolean().default(false),
  textScale: textScaleSchema.default('medium'),
  captionsEnabled: z.boolean().default(true),
  captionStyle: captionStyleSchema.default('compact'),
  colorblindMode: colorblindModeSchema.default('none'),
  audioVolume: z.number().int().min(0).max(100).default(70),
  hapticsEnabled: z.boolean().default(true),
  avatarPreset: avatarPresetSchema.default('panda'),
  showLineNumbers: z.boolean().default(true),
  autoRunOnEdit: z.boolean().default(false),
  parentControlsPinSet: z.boolean().default(false),
});
export type SettingsRecordSchema = z.infer<typeof settingsRecordSchema>;

export const progressRecordSchema = z.object({
  schemaVersion: schemaVersionSchema,
  completedLevelIds: z.array(levelIdSchema).default([]),
  unlockedRewardIds: z.array(rewardIdSchema).default([]),
  currentLevelId: levelIdSchema.optional(),
  currentZoneId: zoneIdSchema.optional(),
  lastPlayedAt: z.string().datetime().optional(),
  totalPlayMinutes: z.number().int().nonnegative().default(0),
  hintsUsedByLevel: z.record(z.string(), z.number().int().nonnegative()).default({}),
});
export type ProgressRecordSchema = z.infer<typeof progressRecordSchema>;

export const levelCodeRecordSchema = z.object({
  schemaVersion: schemaVersionSchema,
  levelId: levelIdSchema,
  apiVersion: apiVersionSchema,
  source: z.string().max(20_000),
  cursor: z
    .object({
      line: z.number().int().nonnegative(),
      column: z.number().int().nonnegative(),
    })
    .optional(),
  selection: z
    .object({
      anchorLine: z.number().int().nonnegative(),
      anchorColumn: z.number().int().nonnegative(),
      headLine: z.number().int().nonnegative(),
      headColumn: z.number().int().nonnegative(),
    })
    .optional(),
  lastEditedAt: z.string().datetime(),
  lastRunAt: z.string().datetime().optional(),
  lastRunOutcome: z.enum(['success', 'fault', 'cancelled']).optional(),
});
export type LevelCodeRecordSchema = z.infer<typeof levelCodeRecordSchema>;

export const backupKindSchema = z.enum(['manual', 'auto', 'recovery']);
export type BackupKindSchema = z.infer<typeof backupKindSchema>;

export const backupRecordSchema = z.object({
  schemaVersion: schemaVersionSchema,
  backupId: z.string().min(1),
  createdAt: z.string().datetime(),
  kind: backupKindSchema,
  reason: z.string().min(1).max(120),
  settings: settingsRecordSchema,
  progress: progressRecordSchema,
  levelCodeByKey: z.array(levelCodeRecordSchema).default([]),
});
export type BackupRecordSchema = z.infer<typeof backupRecordSchema>;

export const contentManifestEntrySchema = z.object({
  assetId: assetIdSchema,
  contentVersion: contentVersionSchema,
  zoneId: zoneIdSchema,
  missionCount: z.number().int().nonnegative(),
  sizeBytes: z.number().int().nonnegative(),
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
  installedAt: z.string().datetime(),
  source: z.enum(['seed', 'import', 'update']),
});
export type ContentManifestEntrySchema = z.infer<typeof contentManifestEntrySchema>;

export const contentMetaRecordSchema = z.object({
  schemaVersion: schemaVersionSchema,
  installedContentVersion: contentVersionSchema,
  installedAt: z.string().datetime(),
  entries: z.array(contentManifestEntrySchema).default([]),
  migrationLog: z.array(
    z.object({
      fromVersion: z.string(),
      toVersion: z.string(),
      appliedAt: z.string().datetime(),
      notes: z.string().optional(),
    }),
  ),
});
export type ContentMetaRecordSchema = z.infer<typeof contentMetaRecordSchema>;

export const persistenceRecordSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('settings'), record: settingsRecordSchema }),
  z.object({ kind: z.literal('progress'), record: progressRecordSchema }),
  z.object({ kind: z.literal('levelCode'), record: levelCodeRecordSchema }),
  z.object({ kind: z.literal('backup'), record: backupRecordSchema }),
  z.object({ kind: z.literal('contentMeta'), record: contentMetaRecordSchema }),
]);
export type PersistenceRecordSchema = z.infer<typeof persistenceRecordSchema>;

export const persistenceEnvelopeSchema = z.object({
  schemaVersion: schemaVersionSchema,
  createdAt: z.string().datetime(),
  appVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  records: z.array(persistenceRecordSchema).min(1),
});
export type PersistenceEnvelopeSchema = z.infer<typeof persistenceEnvelopeSchema>;

export const defaultSettingsRecord = (): SettingsRecordSchema =>
  settingsRecordSchema.parse({});
