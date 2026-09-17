import { describe, expect, it } from 'vitest';

import { persistenceStores } from './keys';
import { createSaveStore, emptyProgress, newLevelCode, type KeyValueStorage } from './localStore';

const memoryStorage = (seed: Record<string, string> = {}): KeyValueStorage & {
  readonly data: Record<string, string>;
} => {
  const data: Record<string, string> = { ...seed };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
};

const fullStorage = (): KeyValueStorage => ({
  getItem: () => null,
  setItem: () => {
    throw new DOMException('QuotaExceededError');
  },
  removeItem: () => undefined,
});

describe('createSaveStore', () => {
  it('returns usable defaults on a first run', () => {
    const store = createSaveStore(memoryStorage());
    expect(store.readProgress().completedLevelIds).toEqual([]);
    expect(store.readSettings().avatarPreset).toBe('girl');
    expect(store.recoveries()).toEqual([]);
  });

  it('round-trips progress and saved code', () => {
    const storage = memoryStorage();
    const store = createSaveStore(storage);
    store.writeProgress({ ...emptyProgress(), completedLevelIds: ['m01', 'm02'] });
    store.writeLevelCode(newLevelCode('m01', 'v1', 'moveForward();'));

    const reopened = createSaveStore(storage);
    expect(reopened.readProgress().completedLevelIds).toEqual(['m01', 'm02']);
    expect(reopened.readLevelCode('m01', 'v1')?.source).toBe('moveForward();');
  });

  it('recovers from a corrupt save instead of refusing to start', () => {
    const storage = memoryStorage({ [persistenceStores.progress]: '{not json' });
    const store = createSaveStore(storage);

    expect(store.readProgress().completedLevelIds).toEqual([]);
    expect(store.recoveries()).toHaveLength(1);
    // The damaged blob is kept so it can be inspected later.
    expect(storage.data[`${persistenceStores.progress}.corrupt`]).toBe('{not json');
  });

  it('reports a full quota instead of throwing at the child', () => {
    const store = createSaveStore(fullStorage());
    expect(store.writeProgress(emptyProgress())).toBe(false);
    expect(store.isWritable()).toBe(false);
  });

  it('exports a backup and restores it into an empty profile', () => {
    const source = createSaveStore(memoryStorage());
    source.writeProgress({ ...emptyProgress(), completedLevelIds: ['m01', 'm02', 'm03'] });
    source.writeLevelCode(newLevelCode('m03', 'v1', 'collect();'));
    const backup = source.exportBackup({
      reason: 'manual export',
      levelIds: ['m01', 'm02', 'm03'],
      apiVersion: 'v1',
    });
    expect(backup.levelCodeByKey).toHaveLength(1);

    const restored = createSaveStore(memoryStorage());
    expect(restored.importBackup(JSON.stringify(backup))).toEqual({ ok: true });
    expect(restored.readProgress().completedLevelIds).toEqual(['m01', 'm02', 'm03']);
    expect(restored.readLevelCode('m03', 'v1')?.source).toBe('collect();');
  });

  it('refuses a bad import without touching the existing save', () => {
    const storage = memoryStorage();
    const store = createSaveStore(storage);
    store.writeProgress({ ...emptyProgress(), completedLevelIds: ['m01'] });

    expect(store.importBackup('nonsense').ok).toBe(false);
    expect(store.importBackup(JSON.stringify({ backupId: 'x' })).ok).toBe(false);
    expect(store.readProgress().completedLevelIds).toEqual(['m01']);
  });
});
