import { useCurrentFrame, useVideoConfig } from 'remotion';
import { CONFIG, SceneKey } from '../config/breakfast-config';

/** Convert seconds to frames at a given fps (always rounded to a frame). */
export const toFrames = (sec: number, fps: number): number => Math.round(sec * fps);

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Current time in SECONDS since the start of the enclosing sequence.
 * All animation in the project is driven by seconds, never raw frames,
 * so 30fps and 60fps renders move at identical speed.
 */
export const useSeconds = (): { t: number; fps: number; frame: number } => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { t: frame / fps, fps, frame };
};

/** Normalized 0..1 progress of t through [a, b], clamped. */
export const prog = (t: number, a: number, b: number): number =>
  clamp01((t - a) / (b - a));

/** Smoothstep-eased progress. */
export const sprog = (t: number, a: number, b: number): number => {
  const x = prog(t, a, b);
  return x * x * (3 - 2 * x);
};

/** Length of a scene window in seconds. */
export const sceneDur = (key: SceneKey): number =>
  CONFIG.scenes[key].end - CONFIG.scenes[key].start;

/**
 * A "slow-motion feeling" time warp: input local seconds, output warped
 * seconds where the segment [a,b] plays at `factor` speed. Fully
 * deterministic — it is just a piecewise-linear remap of time.
 */
export const slowMoWarp = (
  t: number,
  a: number,
  b: number,
  factor: number
): number => {
  if (t <= a) return t;
  if (t <= b) return a + (t - a) * factor;
  return a + (b - a) * factor + (t - b);
};
