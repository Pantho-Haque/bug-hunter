import type { z } from 'zod';

import {
  backupRecordSchema,
  contentMetaRecordSchema,
  levelCodeRecordSchema,
  progressRecordSchema,
  settingsRecordSchema,
  type BackupRecordSchema,
  type ContentMetaRecordSchema,
  type LevelCodeRecordSchema,
  type ProgressRecordSchema,
  type SettingsRecordSchema,
} from './schemas';

export const CURRENT_SETTINGS_VERSION = 1 as const;
export const CURRENT_PROGRESS_VERSION = 'v1' as const;
export const CURRENT_LEVEL_CODE_VERSION = 'v1' as const;
export const CURRENT_BACKUP_VERSION = 'v1' as const;
export const CURRENT_CONTENT_META_VERSION = 'v1' as const;

export type MigrationStep<TInput, TOutput> = {
  from: number | string;
  to: number | string;
  migrate: (input: TInput) => TOutput;
};

export const settingsMigrations: MigrationStep<unknown, SettingsRecordSchema>[] = [];

export const progressMigrations: MigrationStep<unknown, ProgressRecordSchema>[] = [];

export const levelCodeMigrations: MigrationStep<unknown, LevelCodeRecordSchema>[] = [];

export const backupMigrations: MigrationStep<unknown, BackupRecordSchema>[] = [];

export const contentMetaMigrations: MigrationStep<unknown, ContentMetaRecordSchema>[] = [];

export const migrateRecord = <TSchema extends z.ZodTypeAny>(
  input: unknown,
  migrations: MigrationStep<unknown, z.infer<TSchema>>[],
  schema: TSchema,
  currentVersion: number | string,
): z.infer<TSchema> => {
  let value: unknown = input;
  for (const step of migrations) {
    value = step.migrate(value);
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      `migration produced invalid record at ${String(currentVersion)}: ${parsed.error.message}`,
    );
  }
  return parsed.data;
};

export const migrateSettings = (input: unknown): SettingsRecordSchema => {
  const legacyPreset =
    input !== null && typeof input === 'object' && 'avatarPreset' in input
      ? (input as { readonly avatarPreset?: unknown }).avatarPreset
      : undefined;
  const normalizedInput =
    legacyPreset === 'panda' || legacyPreset === 'fox' || legacyPreset === 'robot' || legacyPreset === 'wizard'
      ? { ...(input as Record<string, unknown>), avatarPreset: 'girl' }
      : input;
  if (input === undefined || input === null) {
    return migrateRecord(
      {},
      settingsMigrations,
      settingsRecordSchema,
      CURRENT_SETTINGS_VERSION,
    );
  }
  return migrateRecord(
    normalizedInput,
    settingsMigrations,
    settingsRecordSchema,
    CURRENT_SETTINGS_VERSION,
  );
};

export const migrateProgress = (input: unknown): ProgressRecordSchema =>
  migrateRecord(
    input ?? {},
    progressMigrations,
    progressRecordSchema,
    CURRENT_PROGRESS_VERSION,
  );

export const migrateLevelCode = (input: unknown): LevelCodeRecordSchema =>
  migrateRecord(
    input ?? {},
    levelCodeMigrations,
    levelCodeRecordSchema,
    CURRENT_LEVEL_CODE_VERSION,
  );

export const migrateBackup = (input: unknown): BackupRecordSchema =>
  migrateRecord(
    input ?? {},
    backupMigrations,
    backupRecordSchema,
    CURRENT_BACKUP_VERSION,
  );

export const migrateContentMeta = (input: unknown): ContentMetaRecordSchema =>
  migrateRecord(
    input ?? {},
    contentMetaMigrations,
    contentMetaRecordSchema,
    CURRENT_CONTENT_META_VERSION,
  );

export const isSettingsRecordCurrent = (input: unknown): boolean =>
  settingsRecordSchema.safeParse(input).success;
