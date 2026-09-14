export const persistenceStores = {
  settings: 'codequest.settings.v1',
  progress: 'codequest.progress.v1',
  levelCode: (levelId: string, apiVersion: string) => `codequest.levelCode.v1.${levelId}.${apiVersion}`,
  backups: 'codequest.backups.v1',
  contentMeta: 'codequest.contentMeta.v1',
} as const;

export const persistencePackageMarker = '@codequest/persistence';