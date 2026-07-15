// Central, data-driven configuration for SYRUP PLANETS & BLUE LEMONADE.
// The timeline is defined ONCE, in seconds. Both compositions (30fps preview,
// 60fps 4K master) convert seconds to frames at their own fps, so creative
// timing never diverges between resolutions.

export type SceneKey =
  | 'hook'
  | 'heating'
  | 'rainfall'
  | 'glaze'
  | 'lemonReveal'
  | 'knifeCut'
  | 'lemonade'
  | 'hero';

export interface SceneWindow {
  /** Scene start, in seconds on the master timeline */
  start: number;
  /** Scene end, in seconds on the master timeline */
  end: number;
  enabled: boolean;
}

export interface SyrupColor {
  name: string;
  /** bright body color */
  c1: string;
  /** deep shadow color */
  c2: string;
  /** rendered as a rotating rainbow instead of a two-stop gradient */
  prismatic?: boolean;
}

export const CONFIG = {
  title: 'SYRUP PLANETS & BLUE LEMONADE',
  durationSec: 60,

  // Design space. All scenes are laid out in these logical units and the
  // whole canvas is scaled to the active composition resolution, so nothing
  // is hardcoded to a single output size.
  design: { width: 1080, height: 1920 },

  // Keep all important action inside the middle 80% horizontally and the
  // middle 70% vertically (survives platform UI overlays + minor crops).
  centerSafe: { x: 108, y: 288, width: 864, height: 1344 },

  compositions: {
    preview: { id: 'BreakfastASMRPreview', width: 1080, height: 1920, fps: 30 },
    master: { id: 'BreakfastASMR4K', width: 2160, height: 3840, fps: 60 },
  },

  /** Seed for every deterministic pseudo-random placement in the project */
  seed: 20260715,

  camera: {
    /** global multiplier for push/arc/orbit moves */
    intensity: 1,
    /** handheld micro-movement amplitude, in design px (kept < 1px) */
    handheldPx: 0.8,
  },

  depthOfField: {
    /** global multiplier for defocus blur radii */
    intensity: 1,
  },

  motion: {
    /** global multiplier for secondary animation (wobble, bubbles, ripples) */
    intensity: 1,
  },

  audio: {
    master: 1,
    families: {
      ambience: 0.4,
      syrup: 0.9,
      pancake: 0.85,
      knife: 0.9,
      citrus: 0.95,
      ice: 0.85,
      liquid: 0.95,
      glass: 0.8,
      transitions: 0.85,
    },
  },

  /** 'pancakes' | 'frenchToast' — swaps the stack styling */
  base: 'pancakes' as 'pancakes' | 'frenchToast',

  // Scene windows in seconds. Transitions crossfade inside the tail of the
  // outgoing scene (see transitionSec).
  scenes: {
    hook: { start: 0, end: 4, enabled: true },
    heating: { start: 4, end: 14, enabled: true },
    rainfall: { start: 14, end: 27, enabled: true },
    glaze: { start: 27, end: 38, enabled: true },
    lemonReveal: { start: 38, end: 42, enabled: true },
    knifeCut: { start: 42, end: 49, enabled: true },
    lemonade: { start: 49, end: 57, enabled: true },
    hero: { start: 57, end: 60, enabled: true },
  } satisfies Record<SceneKey, SceneWindow>,

  /** crossfade length between adjacent scenes, seconds */
  transitionSec: 0.8,

  syrupPalette: [
    { name: 'amber', c1: '#f2a93b', c2: '#8a5108' },
    { name: 'strawberry', c1: '#ff7fae', c2: '#b21e5b' },
    { name: 'berry', c1: '#a662e8', c2: '#4a1680' },
    { name: 'electricBlue', c1: '#41c4ff', c2: '#0b47c2' },
    { name: 'honey', c1: '#ffd75e', c2: '#a97410' },
    { name: 'prism', c1: '#ff8a8a', c2: '#7a5cff', prismatic: true },
  ] satisfies SyrupColor[],

  lemonPalette: {
    peelLight: '#2e63e6',
    peelDark: '#0a1e78',
    peelHighlight: '#8fd8ff',
    interior: '#d8f0ff',
    interiorRim: '#f0f9ff',
    vesicle: '#4f83ea',
    vesicleDeep: '#2b55c4',
    leaf: '#3d9c4f',
    leafDark: '#276b34',
  },

  lemonade: {
    top: '#59d6ff',
    mid: '#1f7ae0',
    deep: '#0b3fb4',
  },

  quality: {
    preview: { particleScale: 1, blurScale: 1 },
    master: { particleScale: 1.4, blurScale: 1 },
  },
} as const;

export type BreakfastConfig = typeof CONFIG;

/** Ordered scene list used by the composition to lay out sequences */
export const SCENE_ORDER: SceneKey[] = [
  'hook',
  'heating',
  'rainfall',
  'glaze',
  'lemonReveal',
  'knifeCut',
  'lemonade',
  'hero',
];
