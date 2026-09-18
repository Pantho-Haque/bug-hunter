import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import { contentRegistry, listAllMissions } from '@codequest/content';
import { levelId as toLevelId, type MissionPackageSchema } from '@codequest/domain';
import {
  createSaveStore,
  type ProgressRecordSchema,
  type SettingsRecordSchema,
} from '@codequest/persistence';

import { registerServiceWorker } from '../serviceWorker';
import { AdventureMap } from './AdventureMap';
import { OnboardingDialog } from './OnboardingDialog';
import { SettingsDialog } from './SettingsDialog';
import { levelIdFromPath, missionPath, navigate, useRoute } from './useRoute';

const MissionPreview = lazy(() =>
  import('./MissionPreview').then((module) => ({ default: module.MissionPreview })),
);

const downloadBackup = (backup: unknown, fileName: string) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const isUnlocked = (mission: MissionPackageSchema, completed: readonly string[]) =>
  mission.identity.prerequisiteLevelIds.every((id) => completed.includes(id));

/** The mission that lists this one as a prerequisite — what "next" means on the map. */
const missionAfter = (levelId: string): MissionPackageSchema | undefined =>
  listAllMissions().find((mission) => mission.identity.prerequisiteLevelIds.includes(levelId));

export function StarterApp() {
  // One store for the whole session: settings, progress, and saved code all go
  // through the persistence schemas, so a damaged file degrades to defaults
  // instead of a blank screen.
  const store = useMemo(() => createSaveStore(), []);
  const [settings, setSettings] = useState<SettingsRecordSchema>(() => store.readSettings());
  const [progress, setProgress] = useState<ProgressRecordSchema>(() => store.readProgress());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [updateApply, setUpdateApply] = useState<(() => void) | null>(null);
  const [isOffline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [notice, setNotice] = useState<string | null>(() => {
    const [firstRecovery] = store.recoveries();
    return firstRecovery
      ? 'Part of your save file could not be read, so that part was started fresh.'
      : null;
  });

  // Every mission has its own URL; the map is `/`.
  const path = useRoute();
  const routedLevelId = levelIdFromPath(path);
  const routedMission = routedLevelId
    ? contentRegistry.getMission(toLevelId(routedLevelId))
    : undefined;
  const activeMission =
    routedMission && isUnlocked(routedMission, progress.completedLevelIds) ? routedMission : undefined;

  useEffect(() => {
    // A typed URL for a mission that is missing or still locked goes back to
    // the map with a plain explanation, rather than a blank screen or a skip.
    if (routedLevelId && !activeMission) {
      setNotice(
        routedMission
          ? `${routedMission.identity.title} is still locked. Finish the missions before it first.`
          : 'That mission does not exist.',
      );
      navigate('/');
    }
  }, [activeMission, routedLevelId, routedMission]);

  const nextMission = activeMission ? missionAfter(activeMission.identity.levelId) : undefined;
  // The OS preference counts even before the child finds the setting.
  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const reducedEffects = settings.reducedMotion || prefersReducedMotion;
  const agentName = settings.avatarPreset === 'girl' ? 'Nova' : 'Kai';
  // A save with nothing played yet is a first run, so onboarding needs no flag
  // of its own. Dismissing it stamps lastPlayedAt.
  const showOnboarding =
    progress.lastPlayedAt === undefined && progress.completedLevelIds.length === 0;

  const markStarted = () =>
    setProgress((current) =>
      current.lastPlayedAt ? current : { ...current, lastPlayedAt: new Date().toISOString() },
    );

  const openMission = (id: string) => {
    markStarted();
    navigate(missionPath(id));
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (!store.writeSettings(settings)) setNotice('Settings could not be saved. Storage is full.');
  }, [settings, store]);

  useEffect(() => {
    if (!store.writeProgress(progress)) setNotice('Progress could not be saved. Storage is full.');
  }, [progress, store]);

  useEffect(() => {
    registerServiceWorker((apply) => setUpdateApply(() => apply));
    const online = () => setOffline(false);
    const offline = () => setOffline(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  return (
    <div className={reducedEffects ? 'app quiet-mode' : 'app'}>
      <a className="skip-link" href="#main-content">Skip to game</a>
      <header className="topbar">
        <button className="brand" onClick={() => navigate('/')} type="button">
          <span aria-hidden="true">✦</span> CodeQuest 3D
        </button>
        {activeMission === undefined ? (
          <div className="topbar-actions">
            <button className="avatar-button" onClick={() => setSettingsOpen(true)} type="button">
              Settings
            </button>
          </div>
        ) : (
          <p className="topbar-crumb">
            <span>{activeMission.identity.levelId.toUpperCase()}</span> {activeMission.identity.title}
          </p>
        )}
      </header>

      {updateApply ? (
        <p className="app-notice app-notice--update" role="status">
          A new version of CodeQuest is ready.
          <button onClick={updateApply} type="button">Reload now</button>
          <button onClick={() => setUpdateApply(null)} type="button">Later</button>
        </p>
      ) : null}

      {isOffline ? (
        <p className="app-notice" role="status">
          You are offline. The game keeps working and your progress is still saved here.
        </p>
      ) : null}

      {notice ? (
        <p className="app-notice" role="status">
          {notice}
          <button onClick={() => setNotice(null)} type="button">Dismiss</button>
        </p>
      ) : null}

      <main id="main-content" tabIndex={-1}>
        {activeMission === undefined ? (
          <AdventureMap
            completedLevelIds={progress.completedLevelIds}
            onPlay={openMission}
            unlockedRewardIds={progress.unlockedRewardIds}
          />
        ) : (
          <Suspense fallback={<div className="scene-loading">Loading the mission…</div>}>
            <MissionPreview
              avatarPresentation={settings.avatarPreset}
              hasReducedEffects={reducedEffects}
              key={activeMission.identity.levelId}
              mission={activeMission}
              nextMission={
                nextMission
                  ? { levelId: nextMission.identity.levelId, title: nextMission.identity.title }
                  : undefined
              }
              onCompleted={(id) =>
                setProgress((current) => {
                  if (current.completedLevelIds.includes(id)) return current;
                  const earned = contentRegistry
                    .getMission(toLevelId(id))
                    ?.rewards.map((reward) => reward.rewardId) ?? [];
                  return {
                    ...current,
                    completedLevelIds: [...current.completedLevelIds, id],
                    unlockedRewardIds: [
                      ...new Set([...current.unlockedRewardIds, ...earned]),
                    ],
                    currentLevelId: id,
                    lastPlayedAt: new Date().toISOString(),
                  };
                })
              }
              onNextMission={nextMission ? () => openMission(nextMission.identity.levelId) : undefined}
              onReturnToMap={() => navigate('/')}
              qualityPreference={settings.qualityMode}
              soundVolume={settings.audioVolume}
              store={store}
            />
          </Suspense>
        )}
      </main>
      <OnboardingDialog
        agentName={agentName}
        onSkip={markStarted}
        onStart={() => openMission('m01')}
        open={showOnboarding && activeMission === undefined}
      />
      <SettingsDialog
        avatarPresentation={settings.avatarPreset}
        onAvatarPresentationChange={(avatarPreset) =>
          setSettings((current) => ({ ...current, avatarPreset }))
        }
        onClose={() => setSettingsOpen(false)}
        onExport={() => {
          downloadBackup(
            store.exportBackup({
              reason: 'player export',
              levelIds: listAllMissions().map((mission) => mission.identity.levelId),
              apiVersion: 'v1',
            }),
            `codequest-save-${new Date().toISOString().slice(0, 10)}.json`,
          );
          setNotice('Save file downloaded.');
        }}
        onImport={async (file) => {
          const result = store.importBackup(await file.text());
          if (!result.ok) {
            setNotice(result.reason);
            return;
          }
          setSettings(store.readSettings());
          setProgress(store.readProgress());
          setNotice('Save file loaded.');
        }}
        onQualityChange={(qualityMode) => setSettings((current) => ({ ...current, qualityMode }))}
        onReducedEffectsChange={(reducedMotion) =>
          setSettings((current) => ({ ...current, reducedMotion }))
        }
        onSoundVolumeChange={(audioVolume) => setSettings((current) => ({ ...current, audioVolume }))}
        open={settingsOpen}
        quality={settings.qualityMode}
        reducedEffects={reducedEffects}
        soundVolume={settings.audioVolume}
      />
    </div>
  );
}
