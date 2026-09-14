import { describe, expect, it } from 'vitest';

import {
  backupRecordSchema,
  contentMetaRecordSchema,
  defaultSettingsRecord,
  levelCodeRecordSchema,
  persistenceEnvelopeSchema,
  progressRecordSchema,
  settingsRecordSchema,
} from './schemas';
import { migrateSettings } from './migrations';

describe('settings', () => {
  it('accepts the canonical default record', () => {
    expect(settingsRecordSchema.safeParse(defaultSettingsRecord()).success).toBe(true);
  });

  it('rejects out-of-range audio volume', () => {
    const bad = { ...defaultSettingsRecord(), audioVolume: 150 };
    expect(settingsRecordSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects invalid locale codes', () => {
    const bad = { ...defaultSettingsRecord(), locale: 'english' };
    expect(settingsRecordSchema.safeParse(bad).success).toBe(false);
  });

  it('migrates an arbitrary unknown to the default settings record', () => {
    const migrated = migrateSettings(undefined);
    expect(migrated.schemaVersion).toBe(1);
  });
});

describe('progress', () => {
  it('accepts a populated progress record', () => {
    const result = progressRecordSchema.safeParse({
      schemaVersion: 'v1',
      completedLevelIds: ['m01'],
      unlockedRewardIds: ['reward-first'],
      totalPlayMinutes: 12,
      hintsUsedByLevel: { m01: 1 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative play minutes', () => {
    const result = progressRecordSchema.safeParse({
      schemaVersion: 'v1',
      completedLevelIds: [],
      unlockedRewardIds: [],
      totalPlayMinutes: -3,
      hintsUsedByLevel: {},
    });
    expect(result.success).toBe(false);
  });
});

describe('levelCode', () => {
  it('accepts a levelCode record', () => {
    const result = levelCodeRecordSchema.safeParse({
      schemaVersion: 'v1',
      levelId: 'm01',
      apiVersion: 'v1',
      source: 'moveForward();',
      lastEditedAt: '2025-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects oversized source', () => {
    const result = levelCodeRecordSchema.safeParse({
      schemaVersion: 'v1',
      levelId: 'm01',
      apiVersion: 'v1',
      source: 'a'.repeat(20_001),
      lastEditedAt: '2025-01-01T00:00:00Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('backup', () => {
  it('accepts a complete backup envelope', () => {
    const result = backupRecordSchema.safeParse({
      schemaVersion: 'v1',
      backupId: 'auto-2025-01-01',
      createdAt: '2025-01-01T00:00:00Z',
      kind: 'auto',
      reason: 'rolling-snapshot',
      settings: defaultSettingsRecord(),
      progress: {
        schemaVersion: 'v1',
        completedLevelIds: [],
        unlockedRewardIds: [],
        totalPlayMinutes: 0,
        hintsUsedByLevel: {},
      },
      levelCodeByKey: [],
    });
    expect(result.success).toBe(true);
  });
});

describe('contentMeta', () => {
  it('accepts a content manifest entry', () => {
    const result = contentMetaRecordSchema.safeParse({
      schemaVersion: 'v1',
      installedContentVersion: '2025.01',
      installedAt: '2025-01-01T00:00:00Z',
      entries: [
        {
          assetId: 'asset-grove',
          contentVersion: '2025.01',
          zoneId: 'grove',
          missionCount: 6,
          sizeBytes: 1024,
          checksum: 'a'.repeat(64),
          installedAt: '2025-01-01T00:00:00Z',
          source: 'seed',
        },
      ],
      migrationLog: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-sha256 checksum', () => {
    const result = contentMetaRecordSchema.safeParse({
      schemaVersion: 'v1',
      installedContentVersion: '2025.01',
      installedAt: '2025-01-01T00:00:00Z',
      entries: [
        {
          assetId: 'asset-grove',
          contentVersion: '2025.01',
          zoneId: 'grove',
          missionCount: 6,
          sizeBytes: 1024,
          checksum: 'short',
          installedAt: '2025-01-01T00:00:00Z',
          source: 'seed',
        },
      ],
      migrationLog: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('persistenceEnvelope', () => {
  it('requires at least one record', () => {
    const result = persistenceEnvelopeSchema.safeParse({
      schemaVersion: 'v1',
      createdAt: '2025-01-01T00:00:00Z',
      appVersion: '0.1.0',
      records: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a single-record envelope', () => {
    const result = persistenceEnvelopeSchema.safeParse({
      schemaVersion: 'v1',
      createdAt: '2025-01-01T00:00:00Z',
      appVersion: '0.1.0',
      records: [
        { kind: 'settings', record: defaultSettingsRecord() },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed app version', () => {
    const result = persistenceEnvelopeSchema.safeParse({
      schemaVersion: 'v1',
      createdAt: '2025-01-01T00:00:00Z',
      appVersion: '0.1',
      records: [
        { kind: 'settings', record: defaultSettingsRecord() },
      ],
    });
    expect(result.success).toBe(false);
  });
});
