export { AvatarRig } from './avatar/AvatarRig';
export {
  type AvatarMovementState,
  type AvatarPresentation,
  type AvatarRigTheme,
  avatarTheme,
  facingToRadians as avatarFacingToRadians,
} from './avatar/avatarPresentation';

export { FollowCameraRig } from './camera/FollowCameraRig';
export type { CameraMode } from './camera/FollowCameraRig';

export { EnvironmentLayer } from './environment/EnvironmentLayer';

export { MissionObjectLayer } from './objects/MissionObjectLayer';

export { Minimap } from './minimap/Minimap';

export { PreviewControls } from './preview/PreviewControls';
export type { PreviewDirection, PreviewNudge } from './preview/PreviewControls';

export {
  type QualityTier,
  type QualityConfig,
  type AssetBudget,
  resolveQuality,
  inferTierFromHints,
  defaultAssetBudget,
  budgetSummary,
  reducedMotionDefault,
  responsiveLayout,
} from './quality/qualityTier';

export { SceneCanvas } from './scene/SceneCanvas';
export type { SceneCanvasProps } from './scene/SceneCanvas';

export { SceneView } from './scene/SceneView';
export type { SceneViewProps } from './scene/SceneView';

export {
  type ActiveCommandMarker,
  type AnimationStateSnapshot,
  deriveAnimationState,
  extractBeforeAfterFacing,
  facingFromState,
  isRejectOfMovement,
  movementFromFacingDelta,
} from './animation/commandAnimationSystem';

export {
  avatarTransform,
  cellBounds,
  defaultWorldConfig,
  directionVector,
  facingToRadians,
  worldFromCell,
  type AvatarWorldTransform,
  type WorldConfig,
} from './world/worldTransform';

export const rendererPackageMarker = '@codequest/renderer';