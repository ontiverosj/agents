// Deterministic seeded randomness so the same inputs produce stable results,
// while a "variant" salt lets users regenerate fresh ideas on demand.

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createRng(seedStr) {
  return mulberry32(hashString(String(seedStr)));
}

function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN(rand, arr, n) {
  const copy = arr.slice();
  const out = [];
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  }
  return out;
}

function shuffle(rand, arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function intBetween(rand, min, max) {
  return min + Math.floor(rand() * (max - min + 1));
}

module.exports = { createRng, pick, pickN, shuffle, intBetween, hashString };
