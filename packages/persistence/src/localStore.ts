import { persistenceStores } from './keys';
import {
  CURRENT_BACKUP_VERSION,
  CURRENT_LEVEL_CODE_VERSION,
  CURRENT_PROGRESS_VERSION,
  migrateLevelCode,
  migrateProgress,
  migrateSettings,
} from './migrations';
import {
  backupRecordSchema,
  type BackupRecordSchema,
  type LevelCodeRecordSchema,
  type ProgressRecordSchema,
  type SettingsRecordSchema,
} from './schemas';

/**
 * The three methods of `localStorage` this package actually uses. Injecting it
 * keeps the store testable off a browser and lets a caller pass a stub when
 * storage is blocked.
 */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface RecoveryNote {
  readonly key: string;
  readonly reason: string;
}

export interface SaveStore {
  readSettings(): SettingsRecordSchema;
  writeSettings(next: SettingsRecordSchema): boolean;
  readProgress(): ProgressRecordSchema;
  writeProgress(next: ProgressRecordSchema): boolean;
  /**
   * `alsoTry` lists older API versions to fall back to. Drafts are keyed per API
   * version, so bumping a mission from v1 to v2 would otherwise hide a child's
   * saved code behind the new key. A recovered draft is re-saved under the
   * current version, so the fallback happens once.
   */
  readLevelCode(
    levelId: string,
    apiVersion: string,
    alsoTry?: readonly string[],
  ): LevelCodeRecordSchema | undefined;
  writeLevelCode(record: LevelCodeRecordSchema): boolean;
  /** Snapshot of everything a family would want to keep, ready to download. */
  exportBackup(options: {
    readonly reason: string;
    readonly levelIds: readonly string[];
    readonly apiVersion: string;
  }): BackupRecordSchema;
  /** Validates before it writes: a bad file must never damage a good save. */
  importBackup(json: string): { readonly ok: true } | { readonly ok: false; readonly reason: string };
  /** What had to be repaired during this session's reads. */
  recoveries(): readonly RecoveryNote[];
  /** True when the last write failed, e.g. a full or blocked quota. */
  isWritable(): boolean;
}

export const emptyProgress = (): ProgressRecordSchema =>
  migrateProgress({ schemaVersion: CURRENT_PROGRESS_VERSION });

export const newLevelCode = (
  levelId: string,
  apiVersion: string,
  source: string,
): LevelCodeRecordSchema =>
  migrateLevelCode({
    schemaVersion: CURRENT_LEVEL_CODE_VERSION,
    levelId,
    apiVersion,
    source,
    lastEditedAt: new Date().toISOString(),
  });

// ponytail: localStorage, not IndexedDB. Saves here are a few KB of JSON per
// child. Move to the IndexedDB repositories if saved code or backups ever grow
// past the ~5MB origin quota.
export const createSaveStore = (
  storage: KeyValueStorage | undefined = globalThis.localStorage,
): SaveStore => {
  const notes: RecoveryNote[] = [];
  let writable = true;

  const read = <T>(key: string, migrate: (input: unknown) => T, fallback: () => T): T => {
    let raw: string | null = null;
    try {
      raw = storage?.getItem(key) ?? null;
    } catch (error) {
      notes.push({ key, reason: error instanceof Error ? error.message : 'storage unreadable' });
      return fallback();
    }
    if (raw === null) return fallback();
    try {
      return migrate(JSON.parse(raw));
    } catch (error) {
      // Keep the damaged blob so a parent can hand it to support, then carry on
      // with a working default rather than refusing to start.
      try {
        storage?.setItem(`${key}.corrupt`, raw);
      } catch {
        // Nothing more to do; the note below is the record that matters.
      }
      notes.push({
        key,
        reason: error instanceof Error ? error.message : 'save file could not be read',
      });
      return fallback();
    }
  };

  const write = (key: string, value: unknown): boolean => {
    try {
      storage?.setItem(key, JSON.stringify(value));
      writable = true;
      return true;
    } catch (error) {
      writable = false;
      notes.push({ key, reason: error instanceof Error ? error.message : 'storage is full' });
      return false;
    }
  };

  const levelCodeKey = (levelId: string, apiVersion: string) =>
    persistenceStores.levelCode(levelId, apiVersion);

  const store: SaveStore = {
    readSettings: () =>
      read(persistenceStores.settings, migrateSettings, () => migrateSettings(undefined)),
    writeSettings: (next) => write(persistenceStores.settings, next),
    readProgress: () => read(persistenceStores.progress, migrateProgress, emptyProgress),
    writeProgress: (next) => write(persistenceStores.progress, next),
    readLevelCode: (levelId, apiVersion, alsoTry = []) => {
      const key = levelCodeKey(levelId, apiVersion);
      let raw: string | null = null;
      try {
        raw = storage?.getItem(key) ?? null;
      } catch {
        return undefined;
      }
      if (raw === null) {
        for (const older of alsoTry) {
          const carried = store.readLevelCode(levelId, older);
          if (!carried) continue;
          const moved = { ...carried, apiVersion };
          store.writeLevelCode(moved);
          return moved;
        }
        return undefined;
      }
      try {
        return migrateLevelCode(JSON.parse(raw));
      } catch (error) {
        try {
          storage?.setItem(`${key}.corrupt`, raw);
        } catch {
          // The note below is the record that matters.
        }
        notes.push({
          key,
          reason: error instanceof Error ? error.message : 'saved code could not be read',
        });
        return undefined;
      }
    },
    writeLevelCode: (record) =>
      write(levelCodeKey(record.levelId, record.apiVersion), record),
    exportBackup: ({ reason, levelIds, apiVersion }) => {
      const levelCodeByKey = levelIds
        .map((levelId) => store.readLevelCode(levelId, apiVersion))
        .filter((record): record is LevelCodeRecordSchema => record !== undefined);
      return backupRecordSchema.parse({
        schemaVersion: CURRENT_BACKUP_VERSION,
        backupId: `backup-${Date.now()}`,
        createdAt: new Date().toISOString(),
        kind: 'manual',
        reason,
        settings: store.readSettings(),
        progress: store.readProgress(),
        levelCodeByKey,
      });
    },
    importBackup: (json) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        return { ok: false, reason: 'That file is not a CodeQuest save file.' };
      }
      const result = backupRecordSchema.safeParse(parsed);
      if (!result.success) {
        return { ok: false, reason: 'That save file is missing something, so nothing was changed.' };
      }
      store.writeSettings(result.data.settings);
      store.writeProgress(result.data.progress);
      for (const record of result.data.levelCodeByKey) store.writeLevelCode(record);
      return { ok: true };
    },
    recoveries: () => [...notes],
    isWritable: () => writable,
  };

  return store;
};
