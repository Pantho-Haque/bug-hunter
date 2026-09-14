import { lazy, Suspense, useState } from 'react';

import type { AvatarPresentation } from '@codequest/renderer';

import { AdventureMap } from './AdventureMap';
import { SettingsDialog, type QualityPreference } from './SettingsDialog';

const MissionPreview = lazy(() =>
  import('./MissionPreview').then((module) => ({ default: module.MissionPreview })),
);

export function StarterApp() {
  const [avatarPresentation, setAvatarPresentation] = useState<AvatarPresentation>('girl');
  const [hasReducedEffects, setHasReducedEffects] = useState(false);
  const [qualityPreference, setQualityPreference] = useState<QualityPreference>('auto');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showMap, setShowMap] = useState(true);

  return (
    <div className={hasReducedEffects ? 'app quiet-mode' : 'app'}>
      <a className="skip-link" href="#main-content">Skip to game</a>
      <header className="topbar">
        <button className="brand" onClick={() => setShowMap(true)} type="button">
          <span aria-hidden="true">✦</span> CodeQuest 3D
        </button>
        <div className="topbar-actions">
          <button className="avatar-button" onClick={() => setSettingsOpen(true)} type="button">
            Settings
          </button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {showMap ? (
          <AdventureMap onPlay={() => setShowMap(false)} />
        ) : (
          <Suspense fallback={<div className="scene-loading">Loading the mission preview…</div>}>
            <MissionPreview
              avatarPresentation={avatarPresentation}
              hasReducedEffects={hasReducedEffects}
              onReturnToMap={() => setShowMap(true)}
              qualityPreference={qualityPreference}
            />
          </Suspense>
        )}
      </main>
      <SettingsDialog
        avatarPresentation={avatarPresentation}
        onAvatarPresentationChange={setAvatarPresentation}
        onClose={() => setSettingsOpen(false)}
        onQualityChange={setQualityPreference}
        onReducedEffectsChange={setHasReducedEffects}
        open={settingsOpen}
        quality={qualityPreference}
        reducedEffects={hasReducedEffects}
      />
    </div>
  );
}
