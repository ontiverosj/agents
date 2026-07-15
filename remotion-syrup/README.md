# SYRUP PLANETS & BLUE LEMONADE

A 60-second vertical breakfast ASMR film built entirely in Remotion +
React + TypeScript. Tiny glowing syrup planets soften, melt and rain onto
a pancake stack; a blue syrup ripple match-cuts into a surreal cobalt
lemon that is sliced and squeezed into sparkling electric-blue lemonade.
No narration, no captions, no music — texture, motion and close-mic'd
sound only.

## Compositions

| ID | Resolution | FPS | Duration |
|---|---|---|---|
| `BreakfastASMRPreview` | 1080 × 1920 | 30 | 60 s (1,800 frames) |
| `BreakfastASMR4K` | 2160 × 3840 | 60 | 60 s (3,600 frames) |

Both render the **same component** from the **same seconds-based timeline**
(`src/config/breakfast-config.ts`); frame counts are derived per-fps, so
the two outputs are creatively identical.

## Commands

```sh
# install
npm install

# (re)generate the placeholder SFX (deterministic, offline)
npm run gen:audio

# open Remotion Studio
npm run dev

# type checking
npm run typecheck

# render the 1080x1920 preview
npm run render:preview

# render the 4K master (slow — 3,600 frames)
npm run render:4k

# render a short test range (frames 420–540)
npm run render:test

# render one still for visual QA
npm run still

# automated Node render (renderMedia API): preview | 4k [--frames=a-b]
npm run render:node            # preview
node scripts/render.mjs 4k     # master
```

Rendered files land in `out/`.

> On this machine, pass the preinstalled browser to CLI renders:
> `--browser-executable=/opt/pw-browsers/chromium --chrome-mode=chrome-for-testing`

## Timeline (seconds)

| Scene | Window | Beat |
|---|---|---|
| 1 hook | 0–4 | macro stack, six floating syrup planets, no title/fade |
| 2 heating | 4–14 | surfaces pit & sweat; pink elongates first; first hanging drop |
| 3 rainfall | 14–27 | planets drip one by one; edge-flow shot; top-down finish; slow-mo landing |
| 4 glaze | 27–38 | spoon spreads a jewel glaze; prismatic ripples; blue ripple transition |
| 5 lemon reveal | 38–42 | ripple match-cuts to a cobalt lemon; overhead → 3/4; leaf→peel rack focus |
| 6 knife cut | 42–49 | one controlled slice, slow-mo separation, icy-blue interior close-up |
| 7 lemonade | 49–57 | squeeze, luminous pour over ice, swirl, contained splash, lemon wheel |
| 8 hero | 57–60 | pancakes + lemonade hero; loop drop mirrors the opening; no fade out |

All timing, palettes, camera/DOF/motion intensities, per-family audio
volumes, scene enable flags, the pancake/French-toast switch and the
determinism seed live in `src/config/breakfast-config.ts`.

## Architecture

```
src/
  Root.tsx                     two compositions, one timeline
  index.ts                     registerRoot
  compositions/BreakfastASMR.tsx   scene sequencing + transitions + grade + audio
  config/breakfast-config.ts   the single source of creative truth
  scenes/Scene1Hook … Scene8Hero   one file per scene, no mega-component
  components/                  PancakeStack, SyrupPlanet, SyrupDrop, SyrupFlow,
                               BlueLemon, KnifeSlice, LemonadeGlass, Condensation,
                               ParticleBubbles, Stage (backdrop + layout)
  effects/                     MacroCamera, DepthOfFieldOverlay (+Defocus),
                               HeatDistortion, SceneTransition, FilmFinish
  audio/manifest.ts            every cue: file/start/duration/volume/fades
  audio/AsmrAudioLayer.tsx     frame-accurate playback via @remotion/media <Audio>
  utils/time.ts                seconds→frames, eased progress, slow-mo warp
  utils/rand.ts                seeded deterministic randomness (no Math.random)
scripts/
  generate-placeholder-audio.mjs   offline synthesized SFX (39 files)
  render.mjs                       renderMedia() automation
public/assets/                 visuals/ (drop-in photoreal assets) + audio/
```

Determinism: every render is bit-identical — animation is a pure function
of frame/fps, all randomness is seeded from `CONFIG.seed`, film grain is
seeded per frame, and there are no network requests, no `Math.random()`,
no `Date.now()`.

## Placeholder assets to replace for a photoreal master

See `public/assets/README.md` for the full replacement table, specs and
generation prompts. In short: all visuals are code-native SVG/CSS
placeholders, and all 39 WAVs are synthesized placeholders. A 4K render of
placeholders is NOT photographic 4K — supply source assets at ≥2160px on
the short edge (video plates 2160×3840@60) for a true 4K master.

## Known limitations

- Visuals are tasteful stylized 2.5D, not photoreal — by design, pending
  the drop-in assets above.
- Audio "stereo placement" is baked into each placeholder file's pan
  (constant-power) rather than automated per-cue at runtime.
- Loudness targets (-16 LUFS / -1 dBTP) are approximated by conservative
  gain staging of the placeholders, not measured; run a loudness pass when
  real recordings are dropped in.
- No linter is configured (the QA gate is `tsc --noEmit` + still/range
  renders).
- The `HeatDistortion` SVG displacement is subtle by design; extremely old
  Chromium builds may rasterize it slightly differently, but the pinned
  Remotion browser renders it deterministically.
