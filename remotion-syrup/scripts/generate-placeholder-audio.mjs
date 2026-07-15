// Deterministic placeholder SFX generator — writes 16-bit stereo WAV files
// for every sound the manifest expects, with no dependencies and no network.
// Each file is a labeled PLACEHOLDER meant to be replaced by professional
// close-mic'd recordings (same filenames). Peaks stay under -6 dBFS so the
// mixed program stays comfortably below -1 dBTP.
//
// Usage: node scripts/generate-placeholder-audio.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'assets', 'audio');
const SR = 44100;

// mulberry32 — same PRNG family as the visuals; fixed seed => identical files
const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const writeWav = (relPath, left, right) => {
  const n = left.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // stereo
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    buf.writeInt16LE((l * 32767) | 0, 44 + i * 4);
    buf.writeInt16LE((r * 32767) | 0, 44 + i * 4 + 2);
  }
  const full = join(OUT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, buf);
  console.log('wrote', relPath, `${(buf.length / 1024).toFixed(0)} KB`);
};

/** pan in [-1, 1]; equal-power */
const panGains = (pan) => {
  const p = (pan + 1) / 2;
  return [Math.cos((p * Math.PI) / 2), Math.sin((p * Math.PI) / 2)];
};

const silence = (sec) => new Float32Array(Math.round(sec * SR));

/** decaying sine ping with harmonics — ticks, clicks, rings, resonance */
const ping = ({ dur, freq, decay = 8, harmonics = [1], amp = 0.3, pan = 0, glide = 1, seed = 1 }) => {
  const n = Math.round(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const [gl, gr] = panGains(pan);
  const rnd = mulberry32(seed);
  const jitter = 0.98 + rnd() * 0.04;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = freq * jitter * (1 + (glide - 1) * (t / dur));
    let s = 0;
    harmonics.forEach((h, k) => {
      s += Math.sin(2 * Math.PI * f * h * t) / (k + 1);
    });
    const env = Math.exp(-t * decay) * Math.min(1, t * 400);
    const v = s * env * amp;
    L[i] = v * gl;
    R[i] = v * gr;
  }
  return [L, R];
};

/** filtered noise burst — knife contact, taps, compressions */
const noiseBurst = ({ dur, decay = 14, amp = 0.3, pan = 0, lp = 6, seed = 2 }) => {
  const n = Math.round(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const [gl, gr] = panGains(pan);
  const rnd = mulberry32(seed);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const white = rnd() * 2 - 1;
    acc += (white - acc) / lp; // one-pole lowpass
    const env = Math.exp(-t * decay) * Math.min(1, t * 900);
    const v = acc * env * amp * 3;
    L[i] = v * gl;
    R[i] = v * gr;
  }
  return [L, R];
};

/** descending liquid blip — drips (weight = size of drop) */
const drip = ({ dur, f0 = 900, f1 = 220, amp = 0.32, pan = 0, seed = 3, thock = 0.5 }) => {
  const n = Math.round(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const [gl, gr] = panGains(pan);
  const rnd = mulberry32(seed);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const p = t / dur;
    const f = f0 + (f1 - f0) * Math.min(1, p * 3);
    const body = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 16);
    const white = rnd() * 2 - 1;
    acc += (white - acc) / 3;
    const impact = acc * Math.exp(-t * 40) * thock;
    const env = Math.min(1, t * 600);
    const v = (body * 0.8 + impact) * env * amp;
    L[i] = v * gl;
    R[i] = v * gr;
  }
  return [L, R];
};

/** sparse crackle — carbonation, warm crackle, griddle */
const crackle = ({ dur, density = 30, amp = 0.18, pan = 0, seed = 4, bright = false }) => {
  const n = Math.round(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const rnd = mulberry32(seed);
  const events = Math.round(dur * density);
  for (let e = 0; e < events; e++) {
    const at = Math.floor(rnd() * (n - 400));
    const decay = bright ? 2400 : 900;
    const f = bright ? 3000 + rnd() * 4000 : 700 + rnd() * 1800;
    const a = amp * (0.3 + rnd() * 0.7);
    const [gl, gr] = panGains(rnd() * 2 - 1);
    for (let i = 0; i < 360; i++) {
      const t = i / SR;
      const v = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * decay) * a;
      L[at + i] += v * gl;
      R[at + i] += v * gr;
    }
  }
  // gentle envelope so loops sit under everything
  for (let i = 0; i < n; i++) {
    const fade = Math.min(1, i / (SR * 0.3), (n - i) / (SR * 0.3));
    L[i] *= fade;
    R[i] *= fade;
  }
  return [L, R];
};

/** continuous pour — lowpassed noise with level swell + liquid shimmer */
const pour = ({ dur, amp = 0.26, pan = 0, seed = 5, shimmer = 500 }) => {
  const n = Math.round(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const [gl, gr] = panGains(pan);
  const rnd = mulberry32(seed);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const p = t / dur;
    const white = rnd() * 2 - 1;
    acc += (white - acc) / 4;
    const shim = Math.sin(2 * Math.PI * (shimmer + Math.sin(t * 3) * 120) * t) * 0.12;
    const env = Math.min(1, t * 6) * Math.min(1, (dur - t) * 3) * (0.7 + 0.3 * Math.sin(p * Math.PI));
    const v = (acc * 1.6 + shim) * env * amp;
    L[i] = v * gl;
    R[i] = v * gr;
  }
  return [L, R];
};

/** slow textured stretch/spread — syrup pulling and folding */
const stretch = ({ dur, amp = 0.2, pan = 0, seed = 6, f = 140 }) => {
  const n = Math.round(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const [gl, gr] = panGains(pan);
  const rnd = mulberry32(seed);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const p = t / dur;
    const white = rnd() * 2 - 1;
    acc += (white - acc) / 10;
    const creak = Math.sin(2 * Math.PI * (f + p * 90) * t + Math.sin(t * 30) * 2) * 0.5;
    const env = Math.sin(p * Math.PI);
    const v = (acc + creak * 0.4) * env * amp;
    L[i] = v * gl;
    R[i] = v * gr;
  }
  return [L, R];
};

/** room tone: very low brown-ish noise, loop-clean */
const roomTone = ({ dur, amp = 0.05, seed = 7 }) => {
  const n = Math.round(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const rnd = mulberry32(seed);
  let al = 0;
  let ar = 0;
  for (let i = 0; i < n; i++) {
    al += ((rnd() * 2 - 1) - al) / 40;
    ar += ((rnd() * 2 - 1) - ar) / 40;
    const fade = Math.min(1, i / (SR * 0.5), (n - i) / (SR * 0.5));
    L[i] = al * amp * 4 * fade;
    R[i] = ar * amp * 4 * fade;
  }
  return [L, R];
};

const mix = (a, b) => {
  const n = Math.max(a[0].length, b[0].length);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    L[i] = (a[0][i] ?? 0) + (b[0][i] ?? 0);
    R[i] = (a[1][i] ?? 0) + (b[1][i] ?? 0);
  }
  return [L, R];
};

// ---------------------------------------------------------------- catalog
const files = {
  'ambience/room-tone.wav': () => roomTone({ dur: 60 }),

  'pancake/plate-contact.wav': () => ping({ dur: 0.8, freq: 320, decay: 10, harmonics: [1, 2.7], amp: 0.24, seed: 11 }),
  'pancake/griddle-loop.wav': () => crackle({ dur: 10, density: 14, amp: 0.09, seed: 12 }),
  'pancake/compress.wav': () => noiseBurst({ dur: 0.7, decay: 9, amp: 0.2, lp: 14, seed: 13 }),

  'syrup/glass-click.wav': () => ping({ dur: 0.5, freq: 1750, decay: 26, harmonics: [1, 2.4], amp: 0.22, pan: -0.4, seed: 21 }),
  'syrup/glass-click-2.wav': () => ping({ dur: 0.5, freq: 2100, decay: 26, harmonics: [1, 2.1], amp: 0.2, pan: 0.45, seed: 22 }),
  'syrup/warm-crackle.wav': () => crackle({ dur: 3.4, density: 20, amp: 0.1, seed: 23 }),
  'syrup/bubble-close.wav': () => drip({ dur: 0.7, f0: 480, f1: 160, amp: 0.3, thock: 0.9, seed: 24 }),
  'syrup/crystal-tick.wav': () => ping({ dur: 0.4, freq: 2600, decay: 34, harmonics: [1, 3.1], amp: 0.18, pan: -0.3, seed: 25 }),
  'syrup/crystal-tick-2.wav': () => ping({ dur: 0.4, freq: 3100, decay: 34, harmonics: [1, 2.7], amp: 0.16, pan: 0.35, seed: 26 }),
  'syrup/stretch.wav': () => stretch({ dur: 1.6, amp: 0.18, seed: 27 }),
  'syrup/bubble-pop.wav': () => drip({ dur: 0.35, f0: 900, f1: 500, amp: 0.2, thock: 0.4, seed: 28 }),
  'syrup/drip-heavy.wav': () => drip({ dur: 0.9, f0: 520, f1: 130, amp: 0.36, thock: 1, pan: -0.25, seed: 29 }),
  'syrup/drip-mid.wav': () => drip({ dur: 0.8, f0: 700, f1: 200, amp: 0.3, thock: 0.7, pan: 0.2, seed: 30 }),
  'syrup/drip-mid-2.wav': () => drip({ dur: 0.8, f0: 760, f1: 230, amp: 0.28, thock: 0.7, pan: 0.4, seed: 31 }),
  'syrup/drip-light.wav': () => drip({ dur: 0.7, f0: 980, f1: 330, amp: 0.24, thock: 0.4, pan: -0.4, seed: 32 }),
  'syrup/fold.wav': () => stretch({ dur: 1.4, amp: 0.22, f: 90, seed: 33 }),
  'syrup/spread-sticky.wav': () => stretch({ dur: 3.0, amp: 0.16, f: 70, seed: 34 }),

  'knife/scrape-soft.wav': () => crackle({ dur: 3.6, density: 60, amp: 0.07, bright: true, seed: 41 }),
  'knife/utensil-ceramic.wav': () => ping({ dur: 0.6, freq: 1250, decay: 16, harmonics: [1, 1.9, 3.2], amp: 0.22, seed: 42 }),
  'knife/board-touch.wav': () => noiseBurst({ dur: 0.5, decay: 18, amp: 0.18, lp: 10, seed: 43 }),
  'knife/knife-place.wav': () => mix(noiseBurst({ dur: 0.6, decay: 16, amp: 0.16, lp: 8, seed: 44 }), ping({ dur: 0.6, freq: 900, decay: 20, amp: 0.1, seed: 45 })),
  'knife/knife-contact.wav': () => mix(noiseBurst({ dur: 0.5, decay: 22, amp: 0.26, lp: 5, seed: 46 }), ping({ dur: 0.5, freq: 1500, decay: 30, amp: 0.12, seed: 47 })),
  'knife/board-tap.wav': () => noiseBurst({ dur: 0.4, decay: 24, amp: 0.22, lp: 9, seed: 48 }),

  'citrus/peel-rupture.wav': () => crackle({ dur: 1.1, density: 90, amp: 0.14, bright: true, seed: 51 }),
  'citrus/pulp-separate.wav': () => mix(stretch({ dur: 1.3, amp: 0.16, f: 110, seed: 52 }), crackle({ dur: 1.3, density: 40, amp: 0.08, seed: 53 })),
  'citrus/squeeze.wav': () => mix(stretch({ dur: 1.9, amp: 0.18, f: 130, seed: 54 }), pour({ dur: 1.9, amp: 0.08, shimmer: 900, seed: 55 })),

  'ice/movement-faint.wav': () => crackle({ dur: 2.6, density: 10, amp: 0.08, seed: 61 }),
  'ice/clink.wav': () => ping({ dur: 0.6, freq: 1900, decay: 14, harmonics: [1, 2.9, 4.2], amp: 0.24, pan: -0.3, seed: 62 }),
  'ice/clink-2.wav': () => ping({ dur: 0.6, freq: 2300, decay: 14, harmonics: [1, 2.5, 4.6], amp: 0.2, pan: 0.35, seed: 63 }),
  'ice/settle.wav': () => mix(ping({ dur: 0.9, freq: 1500, decay: 10, harmonics: [1, 2.2], amp: 0.14, seed: 64 }), noiseBurst({ dur: 0.9, decay: 12, amp: 0.08, lp: 8, seed: 65 })),

  'liquid/condensation-drop.wav': () => drip({ dur: 0.6, f0: 1100, f1: 420, amp: 0.2, thock: 0.3, seed: 71 }),
  'liquid/droplets-stone.wav': () => mix(drip({ dur: 0.7, f0: 1000, f1: 380, amp: 0.16, thock: 0.4, pan: -0.3, seed: 72 }), drip({ dur: 0.7, f0: 1300, f1: 520, amp: 0.12, thock: 0.3, pan: 0.4, seed: 73 })),
  'liquid/stream-pour.wav': () => pour({ dur: 3.8, amp: 0.26, seed: 74 }),
  'liquid/fizz-loop.wav': () => crackle({ dur: 8, density: 130, amp: 0.06, bright: true, seed: 75 }),

  'glass/plate-resonance.wav': () => ping({ dur: 1.6, freq: 640, decay: 4.5, harmonics: [1, 2.1, 3.4], amp: 0.16, seed: 81 }),
  'glass/glass-ring.wav': () => ping({ dur: 1.6, freq: 1180, decay: 3.6, harmonics: [1, 2.8], amp: 0.18, seed: 82 }),
  'glass/glass-resonance.wav': () => ping({ dur: 1.2, freq: 860, decay: 5, harmonics: [1, 2.3, 3.9], amp: 0.18, seed: 83 }),

  'transitions/ripple-ring.wav': () => mix(ping({ dur: 1.8, freq: 980, decay: 3, harmonics: [1, 2], amp: 0.14, seed: 91 }), pour({ dur: 1.8, amp: 0.06, shimmer: 1400, seed: 92 })),
};

console.log('Generating placeholder ASMR audio (deterministic, seed-locked)...');
for (const [rel, gen] of Object.entries(files)) {
  const [L, R] = gen();
  writeWav(rel, L, R);
}
void silence;
console.log(`\nDone: ${Object.keys(files).length} placeholder files under public/assets/audio/`);
console.log('These are labeled placeholders — replace with pro recordings (same names).');
