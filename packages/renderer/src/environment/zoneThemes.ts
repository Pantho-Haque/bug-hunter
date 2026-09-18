/**
 * One look per zone, so the world changes as the child moves through the game,
 * plus a per-mission seed so no two missions scatter their scenery the same way.
 * Everything here is presentation: nothing in a theme can affect the simulation.
 */
export type FoliageShape = 'round' | 'cone';

export interface ZoneTheme {
  readonly skyTop: readonly [number, number, number];
  readonly skyHorizon: readonly [number, number, number];
  readonly sunColor: readonly [number, number, number];
  readonly cloudAmount: number;
  readonly starAmount: number;
  readonly fog: string;
  readonly hemisphere: readonly [string, string, number];
  readonly sun: { readonly color: string; readonly intensity: number };
  readonly groundBase: string;
  readonly groundTop: string;
  readonly tile: string;
  readonly grass: string;
  readonly grassDensity: number;
  readonly windScale: number;
  readonly trunk: string;
  readonly foliageNear: string;
  readonly foliageFar: string;
  readonly foliageShape: FoliageShape;
  readonly treeDensity: number;
  readonly rock: string;
  readonly rockCount: number;
  readonly birds: boolean;
  /** Small drifting lights: fireflies, star motes. */
  readonly motes?: { readonly color: string; readonly count: number; readonly height: number };
}

const rgb = (hex: string): readonly [number, number, number] => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
];

const meadow: ZoneTheme = {
  skyTop: rgb('#215e9e'),
  skyHorizon: rgb('#b5cfdb'),
  sunColor: rgb('#ffd487'),
  cloudAmount: 1,
  starAmount: 0,
  fog: '#b9cdd8',
  hemisphere: ['#c4ddf3', '#6c644b', 1.1],
  sun: { color: '#fff0d5', intensity: 2.1 },
  groundBase: '#647248',
  groundTop: '#869967',
  tile: '#d4c69a',
  grass: '#758c49',
  grassDensity: 1,
  windScale: 1,
  trunk: '#8b7353',
  foliageNear: '#80975b',
  foliageFar: '#58764a',
  foliageShape: 'round',
  treeDensity: 1,
  rock: '#99978a',
  rockCount: 10,
  birds: true,
};

const forest: ZoneTheme = {
  skyTop: rgb('#1b3a4a'),
  skyHorizon: rgb('#88a89a'),
  sunColor: rgb('#ffe1a0'),
  cloudAmount: 0.5,
  starAmount: 0,
  fog: '#7f9a8b',
  hemisphere: ['#8fb3a6', '#2e3d2a', 0.9],
  sun: { color: '#ffe6b8', intensity: 1.5 },
  groundBase: '#3f5433',
  groundTop: '#587247',
  tile: '#b9a77c',
  grass: '#4f7a3a',
  grassDensity: 0.8,
  windScale: 0.6,
  trunk: '#5f4a38',
  foliageNear: '#4a7a3d',
  foliageFar: '#2f5232',
  foliageShape: 'cone',
  treeDensity: 1.9,
  rock: '#6f7a6a',
  rockCount: 14,
  birds: false,
  motes: { color: '#d9ff7a', count: 22, height: 1.1 },
};

const lagoon: ZoneTheme = {
  skyTop: rgb('#1f7bb8'),
  skyHorizon: rgb('#c9ecf2'),
  sunColor: rgb('#fff2c2'),
  cloudAmount: 0.7,
  starAmount: 0,
  fog: '#bfe3ea',
  hemisphere: ['#d8f2ff', '#8a7a55', 1.3],
  sun: { color: '#fff8e6', intensity: 2.5 },
  groundBase: '#b9a66f',
  groundTop: '#d9c88f',
  tile: '#eee3bf',
  grass: '#9ab86a',
  grassDensity: 0.45,
  windScale: 1.4,
  trunk: '#a3805a',
  foliageNear: '#5fa66a',
  foliageFar: '#4a8a5c',
  foliageShape: 'round',
  treeDensity: 0.5,
  rock: '#e8e1d3',
  rockCount: 18,
  birds: true,
};

const cliffs: ZoneTheme = {
  skyTop: rgb('#3e5f8f'),
  skyHorizon: rgb('#e8c69a'),
  sunColor: rgb('#ffcf7a'),
  cloudAmount: 0.35,
  starAmount: 0,
  fog: '#d7c2a4',
  hemisphere: ['#e9d7bf', '#7a5a3f', 1.0],
  sun: { color: '#ffe0b5', intensity: 2.3 },
  groundBase: '#8c6440',
  groundTop: '#a7794f',
  tile: '#d9b98a',
  grass: '#c2b26a',
  grassDensity: 0.3,
  windScale: 2.2,
  trunk: '#6e553c',
  foliageNear: '#6b7a4a',
  foliageFar: '#56653c',
  foliageShape: 'cone',
  treeDensity: 0.4,
  rock: '#b08a62',
  rockCount: 32,
  birds: true,
};

const observatory: ZoneTheme = {
  skyTop: rgb('#0c1440'),
  skyHorizon: rgb('#4a3f86'),
  sunColor: rgb('#dfe6ff'),
  cloudAmount: 0.15,
  starAmount: 1,
  fog: '#2c3560',
  hemisphere: ['#8f9ad8', '#2a2f4e', 1.4],
  sun: { color: '#d6e0ff', intensity: 1.9 },
  groundBase: '#3a4470',
  groundTop: '#4d5a86',
  tile: '#a9b1de',
  grass: '#5d6f9a',
  grassDensity: 0.35,
  windScale: 0.5,
  trunk: '#4a5078',
  foliageNear: '#3f5278',
  foliageFar: '#334364',
  foliageShape: 'cone',
  treeDensity: 0.6,
  rock: '#7280a8',
  rockCount: 12,
  birds: false,
  motes: { color: '#ffffff', count: 30, height: 3.2 },
};

const THEMES: Readonly<Record<string, ZoneTheme>> = {
  'meadow-of-moves': meadow,
  'echo-forest': forest,
  'loop-lagoon': lagoon,
  'logic-cliffs': cliffs,
  'maker-observatory': observatory,
};

export const themeForZone = (zoneId: string): ZoneTheme => THEMES[zoneId] ?? meadow;

/** Deterministic per-mission offset for the scenery scatter. */
export const missionSeed = (levelId: string): number => {
  let hash = 0;
  for (const char of levelId) hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  return hash;
};
