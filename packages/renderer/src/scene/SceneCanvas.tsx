import { Canvas } from '@react-three/fiber';

import type {
  MissionPackageSchema,
  RunLifecycleStateSchema,
  SimulationStateSchema,
} from '@codequest/domain';

import { AvatarEntity } from '../avatar/AvatarEntity';
import {
  type AvatarMovementState,
  type AvatarPresentation,
} from '../avatar/avatarPresentation';
import { FollowCameraRig } from '../camera/FollowCameraRig';
import { EnvironmentLayer } from '../environment/EnvironmentLayer';
import { MissionObjectLayer } from '../objects/MissionObjectLayer';
import { resolveQuality, type QualityTier } from '../quality/qualityTier';

export interface SceneCanvasProps {
  readonly mission: MissionPackageSchema;
  readonly state: SimulationStateSchema;
  readonly movementState: AvatarMovementState;
  readonly presentation: AvatarPresentation;
  readonly quality: QualityTier;
  readonly reducedEffects: boolean;
  readonly lifecycle: RunLifecycleStateSchema;
  readonly cameraResetToken: number;
  readonly className?: string;
  readonly ariaLabel?: string;
}

export function SceneCanvas({
  mission,
  state,
  movementState,
  presentation,
  quality,
  reducedEffects,
  lifecycle,
  cameraResetToken,
  className,
  ariaLabel,
}: SceneCanvasProps) {
  const cfg = resolveQuality(quality);
  void lifecycle;

  return (
    <div className={className} aria-label={ariaLabel}>
      <Canvas
        camera={{ fov: 52, position: [0, 3.2, -4.5] }}
        dpr={[cfg.dprRange[0], cfg.dprRange[1]]}
        shadows={cfg.shadowEnabled}
        gl={{ antialias: cfg.tier !== 'low', powerPreference: 'high-performance' }}
      >
        <EnvironmentLayer mission={mission} quality={quality} />
        <MissionObjectLayer objects={mission.objects} quality={quality} state={state} />
        <AvatarEntity
          state={state}
          movementState={movementState}
          presentation={presentation}
          reducedEffects={reducedEffects}
        />
        <FollowCameraRig
          state={state}
          mission={mission}
          reducedEffects={reducedEffects}
          resetToken={cameraResetToken}
        />
      </Canvas>
    </div>
  );
}