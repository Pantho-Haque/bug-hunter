import { useEffect, useRef } from 'react';

import type { AvatarPresentation, QualityTier } from '@codequest/renderer';

export type QualityPreference = 'auto' | QualityTier;

export interface SettingsDialogProps {
  readonly open: boolean;
  readonly avatarPresentation: AvatarPresentation;
  readonly quality: QualityPreference;
  readonly reducedEffects: boolean;
  readonly onAvatarPresentationChange: (presentation: AvatarPresentation) => void;
  readonly onQualityChange: (quality: QualityPreference) => void;
  readonly onReducedEffectsChange: (reduced: boolean) => void;
  /** 0 is silent. Sounds are feedback only; nothing in the game needs them. */
  readonly soundVolume: number;
  readonly onSoundVolumeChange: (volume: number) => void;
  readonly onExport: () => void;
  readonly onImport: (file: File) => void;
  readonly onClose: () => void;
}

export function SettingsDialog({
  open,
  avatarPresentation,
  quality,
  reducedEffects,
  onAvatarPresentationChange,
  onQualityChange,
  onReducedEffectsChange,
  soundVolume,
  onSoundVolumeChange,
  onExport,
  onImport,
  onClose,
}: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="settings-title"
      className="settings-dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onClose={onClose}
    >
      <div className="settings-dialog__content">
        <header className="settings-dialog__header">
          <div>
            <p className="eyebrow">Your game</p>
            <h2 id="settings-title">Settings</h2>
          </div>
          <button className="text-button" type="button" onClick={onClose}>Close</button>
        </header>

        <fieldset className="settings-group">
          <legend>Character</legend>
          <p>Pick your character. Both can do the same things.</p>
          <div className="settings-choice-row">
            {(['girl', 'boy'] as const).map((presentation) => (
              <label key={presentation} className="settings-choice">
                <input
                  checked={avatarPresentation === presentation}
                  name="avatar-presentation"
                  onChange={() => onAvatarPresentationChange(presentation)}
                  type="radio"
                />
                {presentation === 'girl' ? 'Nova (girl)' : 'Kai (boy)'}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="settings-group">
          <legend>Camera view</legend>
          <p>Drag the scene to orbit around Nova. Scroll to zoom. The view stays where you put it.</p>
        </fieldset>

        <fieldset className="settings-group">
          <legend>Display and comfort</legend>
          <label className="settings-select-label" htmlFor="quality-preference">
            Visual quality
            <select
              id="quality-preference"
              onChange={(event) => onQualityChange(event.target.value as QualityPreference)}
              value={quality}
            >
              <option value="auto">Automatic</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="settings-toggle">
            <input
              checked={reducedEffects}
              onChange={(event) => onReducedEffectsChange(event.target.checked)}
              type="checkbox"
            />
            Reduce camera and character motion
          </label>
        </fieldset>

        <fieldset className="settings-group">
          <legend>Sounds</legend>
          <p>Small sounds for each step, plus a quiet meadow in the background. Nothing in the game needs sound to play.</p>
          <label className="settings-toggle">
            <input
              checked={soundVolume > 0}
              onChange={(event) => onSoundVolumeChange(event.target.checked ? 70 : 0)}
              type="checkbox"
            />
            Play sounds
          </label>
          <label className="settings-select-label" htmlFor="sound-volume">
            Volume
            <input
              aria-valuetext={`${soundVolume} percent`}
              disabled={soundVolume === 0}
              id="sound-volume"
              max={100}
              min={0}
              onChange={(event) => onSoundVolumeChange(Number(event.target.value))}
              step={10}
              type="range"
              value={soundVolume}
            />
          </label>
        </fieldset>

        <fieldset className="settings-group">
          <legend>Your save file</legend>
          <p>
            Everything is stored on this device only. Save a copy before you clear your browser, or
            to move your progress to another computer.
          </p>
          <div className="settings-choice-row">
            <button className="secondary-button" onClick={onExport} type="button">
              Save a copy
            </button>
            <label className="secondary-button settings-file-button">
              Load a copy
              <input
                accept="application/json,.json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onImport(file);
                  event.target.value = '';
                }}
                type="file"
              />
            </label>
          </div>
        </fieldset>

        <p className="settings-dialog__note">Changes update the game now and are saved on this device.</p>
      </div>
    </dialog>
  );
}
