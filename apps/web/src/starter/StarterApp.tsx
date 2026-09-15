import { lazy, Suspense, useEffect, useState } from 'react';

import type { AvatarPresentation } from '@codequest/renderer';

import { AdventureMap } from './AdventureMap';
import { SettingsDialog, type QualityPreference } from './SettingsDialog';

const MissionPreview = lazy(() =>
  import('./MissionPreview').then((module) => ({ default: module.MissionPreview })),
);

const settingsStorageKey = 'codequest-3d:starter-settings:v1';

interface StarterSettings {
  readonly avatarPresentation: AvatarPresentation;
  readonly hasReducedEffects: boolean;
  readonly qualityPreference: QualityPreference;
}

const defaultSettings: StarterSettings = {
  avatarPresentation: 'girl',
  hasReducedEffects: false,
  qualityPreference: 'auto',
};

const readSettings = (): StarterSettings => {
  if (typeof window === 'undefined') return defaultSettings;

  try {
    const stored = window.localStorage.getItem(settingsStorageKey);
    if (!stored) return defaultSettings;
    const value: unknown = JSON.parse(stored);
    if (!value || typeof value !== 'object') return defaultSettings;
    const settings = value as Partial<StarterSettings>;
    return {
      avatarPresentation: settings.avatarPresentation === 'boy' ? 'boy' : 'girl',
      hasReducedEffects: settings.hasReducedEffects === true,
      qualityPreference: settings.qualityPreference === 'low' || settings.qualityPreference === 'medium' || settings.qualityPreference === 'high'
        ? settings.qualityPreference
        : 'auto',
    };
  } catch {
    return defaultSettings;
  }
};

export function StarterApp() {
  const [settings, setSettings] = useState<StarterSettings>(readSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
  }, [settings]);

  return (
    <div className={settings.hasReducedEffects ? 'app quiet-mode' : 'app'}>
      <a className="skip-link" href="#main-content">Skip to game</a>
      <header className="topbar">
        <button className="brand" onClick={() => setShowMap(true)} type="button">
          <span aria-hidden="true">✦</span> CodeQuest 3D
        </button>
        {showMap ? (
          <div className="topbar-actions">
            <button className="avatar-button" onClick={() => setSettingsOpen(true)} type="button">
              Settings
            </button>
          </div>
        ) : null}
      </header>

      <main id="main-content" tabIndex={-1}>
        {showMap ? (
          <AdventureMap onPlay={() => setShowMap(false)} />
        ) : (
          <Suspense fallback={<div className="scene-loading">Loading the mission preview…</div>}>
            <MissionPreview
              avatarPresentation={settings.avatarPresentation}
              hasReducedEffects={settings.hasReducedEffects}
              onReturnToMap={() => setShowMap(true)}
              qualityPreference={settings.qualityPreference}
            />
          </Suspense>
        )}
      </main>
      <SettingsDialog
        avatarPresentation={settings.avatarPresentation}
        onAvatarPresentationChange={(avatarPresentation) => setSettings((current) => ({ ...current, avatarPresentation }))}
        onClose={() => setSettingsOpen(false)}
        onQualityChange={(qualityPreference) => setSettings((current) => ({ ...current, qualityPreference }))}
        onReducedEffectsChange={(hasReducedEffects) => setSettings((current) => ({ ...current, hasReducedEffects }))}
        open={settingsOpen}
        quality={settings.qualityPreference}
        reducedEffects={settings.hasReducedEffects}
      />
    </div>
  );
}
