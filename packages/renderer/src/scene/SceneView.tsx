import { useCallback, useMemo, useState } from 'react';

import type {
  MissionPackageSchema,
  RunEventSchema,
  SimulationStateSchema,
} from '@codequest/domain';

import {
  type AvatarMovementState,
  type AvatarPresentation,
} from '../avatar/avatarPresentation';
import { Minimap } from '../minimap/Minimap';
import {
  type PreviewNudge,
} from '../preview/PreviewControls';
import { type QualityTier } from '../quality/qualityTier';
import { SceneCanvas } from './SceneCanvas';

export interface SceneViewProps {
  readonly mission: MissionPackageSchema;
  readonly state: SimulationStateSchema;
  readonly events: readonly RunEventSchema[];
  readonly presentation: AvatarPresentation;
  readonly quality: QualityTier;
  readonly reducedEffects: boolean;
  readonly movementState: AvatarMovementState;
  readonly className?: string;
  readonly previewEnabled?: boolean;
  readonly onPreviewNudge?: (nudge: PreviewNudge) => void;
  readonly runControls?: React.ReactNode;
  readonly toolbar?: React.ReactNode;
  readonly minimapSide?: 'right' | 'bottom';
  readonly cameraResetToken?: number;
  readonly onCameraReset?: () => void;
}

export function SceneView(props: SceneViewProps) {
  const [internalResetToken, setInternalResetToken] = useState(0);
  const [isMinimapOpen, setMinimapOpen] = useState(false);
  const resetToken = props.cameraResetToken ?? internalResetToken;

  const resetCamera = useCallback(() => {
    if (props.onCameraReset) {
      props.onCameraReset();
    } else {
      setInternalResetToken((value) => value + 1);
    }
  }, [props]);

  const containerClassName = useMemo(
    () =>
      ['scene-view', props.className].filter((value): value is string => Boolean(value)).join(' '),
    [props.className],
  );

  const { mission, state, events, presentation, quality, reducedEffects, movementState, previewEnabled, onPreviewNudge, runControls, toolbar, minimapSide } = props;
  void events;

  return (
    <section className={containerClassName} aria-label={`Scene for ${mission.identity.title}`}>
      <div className="scene-view-stage">
        <SceneCanvas
          mission={mission}
          state={state}
          movementState={movementState}
          presentation={presentation}
          quality={quality}
          reducedEffects={reducedEffects}
          lifecycle="running"
          cameraResetToken={resetToken}
          className="scene-view-canvas"
          ariaLabel={`${mission.identity.title} third-person view`}
        />
        <div className="scene-view-overlay">
          <div className="scene-view-mode-toggle" role="group" aria-label="Camera controls">
            <button type="button" onClick={resetCamera} aria-label="Reset camera">
              ↺ Reset view
            </button>
            <button
              type="button"
              aria-expanded={isMinimapOpen}
              aria-controls={`minimap-${mission.identity.levelId}`}
              aria-label={isMinimapOpen ? 'Hide minimap' : 'Show minimap'}
              onClick={() => setMinimapOpen((value) => !value)}
            >
              Map
            </button>
          </div>
          {previewEnabled && onPreviewNudge ? (
            <div className="scene-view-preview-banner" role="status">
              <span aria-hidden="true">🎮</span>
              <span>Explore mode · Preview only · does not score the mission</span>
            </div>
          ) : null}
          {runControls ?? null}
          {toolbar ?? null}
        </div>
        {isMinimapOpen ? (
          <aside
            className={`scene-view-minimap scene-view-minimap-${minimapSide ?? 'right'} scene-view-minimap--overlay`}
            id={`minimap-${mission.identity.levelId}`}
            aria-label="Minimap"
          >
            <Minimap mission={mission} state={state} reducedEffects={reducedEffects} />
          </aside>
        ) : null}
      </div>
    </section>
  );
}
