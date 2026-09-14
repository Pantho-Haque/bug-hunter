import { describe, expect, it } from 'vitest';

import {
  budgetSummary,
  defaultAssetBudget,
  inferTierFromHints,
  reducedMotionDefault,
  resolveQuality,
  responsiveLayout,
} from './qualityTier';

describe('renderer / qualityTier', () => {
  it('returns a config for every tier', () => {
    expect(resolveQuality('low').tier).toBe('low');
    expect(resolveQuality('medium').tier).toBe('medium');
    expect(resolveQuality('high').tier).toBe('high');
  });

  it('downgrades quality when devicePixelRatio exceeds 2', () => {
    expect(inferTierFromHints({ hardwareConcurrency: 8, devicePixelRatio: 2.5 })).toBe('low');
  });

  it('downgrades when hardware concurrency is 2 or fewer', () => {
    expect(inferTierFromHints({ hardwareConcurrency: 2, devicePixelRatio: 1 })).toBe('low');
  });

  it('promotes to medium tier on modest hardware', () => {
    expect(inferTierFromHints({ hardwareConcurrency: 4, devicePixelRatio: 1.5 })).toBe('medium');
  });

  it('promotes to high tier on strong hardware', () => {
    expect(inferTierFromHints({ hardwareConcurrency: 8, devicePixelRatio: 1 })).toBe('high');
  });

  it('describes the budget as a short string', () => {
    expect(budgetSummary(resolveQuality('low'))).toMatch(/low tier/);
    expect(budgetSummary(resolveQuality('high'), defaultAssetBudget)).toMatch(/high tier/);
  });

  it('returns false from reduced-motion probe in non-browser test environments', () => {
    expect(reducedMotionDefault()).toBe(false);
  });

  it('breaks the layout into narrow/medium/wide by width', () => {
    expect(responsiveLayout(320)).toBe('narrow');
    expect(responsiveLayout(800)).toBe('medium');
    expect(responsiveLayout(1280)).toBe('wide');
  });
});