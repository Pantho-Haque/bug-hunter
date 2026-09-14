export type QualityTier = 'low' | 'medium' | 'high';

export interface QualityConfig {
  readonly tier: QualityTier;
  readonly dprRange: readonly [number, number];
  readonly shadowMapSize: number;
  readonly shadowEnabled: boolean;
  readonly maxShadowLights: number;
  readonly pixelRatioCap: number;
  readonly fogRange: readonly [number, number];
  readonly detailLevel: 'greybox' | 'medium' | 'high';
}

const low: QualityConfig = {
  tier: 'low',
  dprRange: [1, 1],
  shadowMapSize: 256,
  shadowEnabled: false,
  maxShadowLights: 0,
  pixelRatioCap: 1,
  fogRange: [6, 18],
  detailLevel: 'greybox',
};

const medium: QualityConfig = {
  tier: 'medium',
  dprRange: [1, 1.5],
  shadowMapSize: 512,
  shadowEnabled: true,
  maxShadowLights: 1,
  pixelRatioCap: 1.5,
  fogRange: [10, 24],
  detailLevel: 'medium',
};

const high: QualityConfig = {
  tier: 'high',
  dprRange: [1, 2],
  shadowMapSize: 1024,
  shadowEnabled: true,
  maxShadowLights: 2,
  pixelRatioCap: 2,
  fogRange: [14, 32],
  detailLevel: 'high',
};

const configs: Record<QualityTier, QualityConfig> = {
  low,
  medium,
  high,
};

export const resolveQuality = (tier: QualityTier): QualityConfig => configs[tier];

export const inferTierFromHints = (hints: {
  readonly hardwareConcurrency?: number;
  readonly devicePixelRatio?: number;
}): QualityTier => {
  const cores = hints.hardwareConcurrency ?? 4;
  const dpr = hints.devicePixelRatio ?? 1;
  if (cores <= 2 || dpr > 2) return 'low';
  if (cores <= 4 && dpr <= 1.5) return 'medium';
  return 'high';
};

export interface AssetBudget {
  readonly missionObjectsMax: number;
  readonly ambientLightsMax: number;
  readonly pointLightsMax: number;
  readonly totalTriangles: number;
}

export const defaultAssetBudget: AssetBudget = {
  missionObjectsMax: 24,
  ambientLightsMax: 1,
  pointLightsMax: 4,
  totalTriangles: 8000,
};

export const budgetSummary = (
  config: QualityConfig,
  budget: AssetBudget = defaultAssetBudget,
): string => {
  return `${config.tier} tier · ${config.shadowEnabled ? 'shadows on' : 'shadows off'} · ${budget.totalTriangles} tri budget`;
};

export const reducedMotionDefault = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const responsiveLayout = (width: number): 'narrow' | 'medium' | 'wide' => {
  if (width < 600) return 'narrow';
  if (width < 1024) return 'medium';
  return 'wide';
};