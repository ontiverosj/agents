// Deterministic seeded pseudo-random helpers. Nothing in this project uses
// Math.random(): every "organic" placement derives from CONFIG.seed, so the
// render is identical every time, at every resolution.

import { CONFIG } from '../config/breakfast-config';

/** mulberry32 — small, fast, deterministic PRNG */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** A reusable list of N deterministic values in [0,1) for a named stream. */
export const seededSeries = (label: string, n: number): number[] => {
  let h: number = CONFIG.seed;
  for (let i = 0; i < label.length; i++) {
    h = (Math.imul(h, 31) + label.charCodeAt(i)) | 0;
  }
  const rnd = mulberry32(h);
  return Array.from({ length: n }, () => rnd());
};

/** Deterministic smooth wobble: sum of two incommensurate sines. */
export const wobble = (t: number, speed: number, phase: number): number =>
  Math.sin(t * speed + phase * Math.PI * 2) * 0.6 +
  Math.sin(t * speed * 1.73 + phase * 5.1) * 0.4;
