import { Canvas } from '@react-three/fiber';

import type {
  MissionPackageSchema,
  RunLifecycleStateSchema,
  SimulationStateSchema,
} from '@codequest/domain';

import { AvatarRig } from '../avatar/AvatarRig';
import {
  type AvatarMovementState,
  type AvatarPresentation,
} from '../avatar/avatarPresentation';
import { FollowCameraRig, type CameraMode } from '../camera/FollowCameraRig';
import { EnvironmentLayer } from '../environment/EnvironmentLayer';
import { MissionObjectLayer } from '../objects/MissionObjectLayer';
import { resolveQuality, type QualityTier } from '../quality/qualityTier';
import { avatarTransform } from '../world/worldTransform';

export interface SceneCanvasProps {
  readonly mission: MissionPackageSchema;
  readonly state: SimulationStateSchema;
  readonly movementState: AvatarMovementState;
  readonly presentation: AvatarPresentation;
  readonly quality: QualityTier;
  readonly reducedEffects: boolean;
  readonly cameraMode: CameraMode;
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
  cameraMode,
  lifecycle,
  cameraResetToken,
  className,
  ariaLabel,
}: SceneCanvasProps) {
  const cfg = resolveQuality(quality);
  const transform = avatarTransform(state);
  void lifecycle;

  return (
    <div className={className} aria-label={ariaLabel} role="presentation">
      <Canvas
        camera={{ fov: 56, position: [0, 4, -8] }}
        dpr={[cfg.dprRange[0], cfg.dprRange[1]]}
        shadows={cfg.shadowEnabled ? 'soft' : false}
        gl={{ antialias: cfg.tier !== 'low', powerPreference: 'high-performance' }}
      >
        <EnvironmentLayer mission={mission} />
        <MissionObjectLayer objects={mission.objects} state={state} />
        <group position={transform.position} rotation={[0, transform.rotationY, 0]}>
          <AvatarRig
            isMoving={movementState === 'walking'}
            movementState={movementState}
            presentation={presentation}
            reducedEffects={reducedEffects}
          />
        </group>
        <FollowCameraRig
          state={state}
          mission={mission}
          mode={cameraMode}
          reducedEffects={reducedEffects}
          resetToken={cameraResetToken}
        />
      </Canvas>
    </div>
  );
}