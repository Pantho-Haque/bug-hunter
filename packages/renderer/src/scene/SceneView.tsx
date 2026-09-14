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
import type { CameraMode } from '../camera/FollowCameraRig';
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
  readonly minimapSide?: 'right' | 'bottom';
  readonly cameraMode?: CameraMode;
  readonly onCameraModeChange?: (mode: CameraMode) => void;
  readonly cameraResetToken?: number;
  readonly onCameraReset?: () => void;
}

const cameraSequence: readonly CameraMode[] = ['coding', 'preview', 'strategic'];

const nextCameraMode = (mode: CameraMode): CameraMode => {
  const index = cameraSequence.indexOf(mode);
  return cameraSequence[(index + 1) % cameraSequence.length];
};

export function SceneView(props: SceneViewProps) {
  const [internalMode, setInternalMode] = useState<CameraMode>('coding');
  const [internalResetToken, setInternalResetToken] = useState(0);
  const cameraMode = props.cameraMode ?? internalMode;
  const resetToken = props.cameraResetToken ?? internalResetToken;

  const setCameraMode = useCallback(
    (next: CameraMode) => {
      props.onCameraModeChange?.(next);
      if (props.cameraMode === undefined) setInternalMode(next);
    },
    [props],
  );

  const advanceCamera = useCallback(() => {
    setCameraMode(nextCameraMode(cameraMode));
  }, [cameraMode, setCameraMode]);

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

  const { mission, state, events, presentation, quality, reducedEffects, movementState, previewEnabled, onPreviewNudge, runControls, minimapSide } = props;
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
          cameraMode={cameraMode}
          lifecycle="running"
          cameraResetToken={resetToken}
          className="scene-view-canvas"
          ariaLabel={`${mission.identity.title} third-person view`}
        />
        <div className="scene-view-overlay">
          <div className="scene-view-mode-toggle" role="group" aria-label="Camera modes">
            <button type="button" aria-pressed={cameraMode === 'coding'} onClick={() => setCameraMode('coding')}>
              Coding View
            </button>
            <button type="button" aria-pressed={cameraMode === 'preview'} onClick={() => setCameraMode('preview')}>
              Preview
            </button>
            <button type="button" aria-pressed={cameraMode === 'strategic'} onClick={() => setCameraMode('strategic')}>
              Strategic View
            </button>
            <button type="button" onClick={advanceCamera} aria-label="Advance camera mode">
              ›
            </button>
            <button type="button" onClick={resetCamera} aria-label="Reset camera">
              ↺
            </button>
          </div>
          {previewEnabled && onPreviewNudge ? (
            <div className="scene-view-preview-banner" role="status">
              <span aria-hidden="true">🎮</span>
              <span>Explore mode · Preview only · does not score the mission</span>
            </div>
          ) : null}
          {runControls ?? null}
        </div>
      </div>
      <aside className={`scene-view-minimap scene-view-minimap-${minimapSide ?? 'right'}`} aria-label="Minimap">
        <Minimap mission={mission} state={state} reducedEffects={reducedEffects} />
      </aside>
    </section>
  );
}