import type React from 'react';
import { AbsoluteFill } from 'remotion';
import { MacroCamera } from '../effects/MacroCamera';
import { DepthOfFieldOverlay } from '../effects/DepthOfFieldOverlay';
import { KitchenBackdrop, SvgStage, STAGE, PLANETS } from '../components/Stage';
import { PancakeStack } from '../components/PancakeStack';
import { SyrupPlanet } from '../components/SyrupPlanet';
import { SyrupDrop } from '../components/SyrupDrop';
import { SyrupFlow } from '../components/SyrupFlow';
import { useSeconds, sceneDur, prog, clamp01, slowMoWarp } from '../utils/time';
import { CONFIG } from '../config/breakfast-config';

/**
 * Scene 3 — Syrup planet rainfall (0:14–0:27)
 * The planets melt and drip one by one; the camera follows the first drop
 * down (shot A), cuts to a low grazing angle for the edge flow (shot B),
 * and finishes on a top-down macro (shot C) that hands off to scene 4.
 * The first landing uses a deterministic slow-motion time warp.
 */
export const Scene3Rainfall: React.FC = () => {
  const { t: rawT } = useSeconds();
  const dur = sceneDur('rainfall');
  // slow-motion feel around the first landing (1.6s..2.6s local)
  const t = slowMoWarp(rawT, 1.6, 2.6, 0.45);

  const shotB = rawT >= 5 && rawT < 10;
  const shotC = rawT >= 10;

  // drip schedule (local seconds, order: amber, pink, purple, blue, honey, prism)
  const dripStart = [0.4, 2.6, 4.2, 5.6, 7.4, 8.6];
  const dropP = (i: number) => clamp01(prog(t, dripStart[i], dripStart[i] + 3.4));
  const meltOf = (i: number) => clamp01(0.7 + dropP(i) * 0.3);
  const planetGone = (i: number) => clamp01(1 - prog(t, dripStart[i] + 2.2, dripStart[i] + 3.6));

  const pooledColors = PLANETS.filter((_, i) => dropP(i) > 0.75).map((p) => p.color.c1);
  const glaze = clamp01(pooledColors.length / 6 + prog(t, 9, 13) * 0.3);

  // Shot A camera: follow the first falling drop downward
  const followY = prog(t, 1.2, 3) * -140;

  return (
    <AbsoluteFill>
      <KitchenBackdrop tone="warm" blur={12} />

      {/* ---- Shot A: main stage, follow the first drop (0–5s) ---- */}
      {!shotB && !shotC && (
        <MacroCamera durationSec={5} pushFrom={1.05} pushTo={1.12} phase={0.7}>
          <AbsoluteFill style={{ transform: `translateY(${-followY}px)` }}>
            <SvgStage>
              <PancakeStack cx={STAGE.stackCx} topY={STAGE.stackTopY} rx={STAGE.stackRx} glaze={glaze * 0.5} glazeColors={pooledColors} />
              {PLANETS.map((p, i) => (
                <SyrupPlanet
                  key={p.idSuffix}
                  color={p.color}
                  cx={p.x}
                  cy={p.y + 30}
                  r={p.r}
                  t={t + 8}
                  phase={p.phase}
                  melt={meltOf(i)}
                  opacity={planetGone(i)}
                  idSuffix={`s3a-${p.idSuffix}`}
                />
              ))}
              {PLANETS.map((p, i) => (
                <SyrupDrop
                  key={`drop-${p.idSuffix}`}
                  color={p.color}
                  x={p.x}
                  y={p.y + p.r + 34}
                  landY={STAGE.stackTopY - 8 + (i % 3) * 10}
                  p={dropP(i)}
                  size={1 + (i === 0 ? 0.3 : 0)}
                />
              ))}
            </SvgStage>
          </AbsoluteFill>
        </MacroCamera>
      )}

      {/* ---- Shot B: low grazing angle, syrup wrapping the edge (5–10s) ---- */}
      {shotB && (
        <MacroCamera durationSec={5} pushFrom={1.0} pushTo={1.06} arcPx={30} phase={0.3}>
          <SvgStage>
            {/* side-on stack, larger, horizon low */}
            <g transform="translate(0 140) scale(1.18)">
              <PancakeStack cx={455} topY={900} rx={390} glaze={glaze} glazeColors={pooledColors} />
              {/* pink rolling over the edge + blue strand */}
              <SyrupFlow color={CONFIG.syrupPalette[1]} x={150} y={905} width={340} p={prog(t, 5.2, 8.5)} maxDrop={190} />
              <SyrupFlow color={CONFIG.syrupPalette[3]} x={520} y={898} width={300} p={prog(t, 6.2, 9.5)} maxDrop={240} />
              <SyrupFlow color={CONFIG.syrupPalette[0]} x={330} y={912} width={260} p={prog(t, 7, 10)} maxDrop={140} />
            </g>
          </SvgStage>
        </MacroCamera>
      )}

      {/* ---- Shot C: top-down macro, pools spreading (10–13s) ---- */}
      {shotC && (
        <MacroCamera durationSec={3} pushFrom={1.08} pushTo={1.02} phase={0.9}>
          <SvgStage>
            {/* overhead: plate, stack top, pools */}
            <circle cx={540} cy={980} r={470} fill="#efe7da" />
            <circle cx={540} cy={980} r={430} fill="#faf5ec" />
            <circle cx={540} cy={980} r={352} fill="url(#s3c-top)" />
            <defs>
              <radialGradient id="s3c-top" cx="0.42" cy="0.38" r="0.85">
                <stop offset="0%" stopColor="#f4cf8b" />
                <stop offset="70%" stopColor="#eab766" />
                <stop offset="100%" stopColor="#c9953f" />
              </radialGradient>
            </defs>
            {PLANETS.map((p, i) => {
              const spread = clamp01(prog(t, 9.5 + i * 0.35, 12.6));
              const a = (i / 6) * Math.PI * 2;
              return (
                <g key={p.idSuffix}>
                  <ellipse
                    cx={540 + Math.cos(a) * 130}
                    cy={980 + Math.sin(a) * 130}
                    rx={40 + spread * 130}
                    ry={34 + spread * 110}
                    fill={p.color.c1}
                    opacity={0.55}
                  />
                </g>
              );
            })}
            {/* the final two planets collapsing into cascade, seen from above */}
            {[4, 5].map((i) => {
              const p = PLANETS[i];
              const fall = clamp01(prog(t, 10.4 + (i - 4) * 0.8, 12.2 + (i - 4) * 0.8));
              return (
                <g key={p.idSuffix} opacity={1 - fall}>
                  <circle cx={540 + (i === 4 ? -70 : 90)} cy={980 + (i === 4 ? 60 : -40)} r={p.r * (1 - fall * 0.4)} fill={p.color.c1} />
                  <circle cx={540 + (i === 4 ? -84 : 76)} cy={980 + (i === 4 ? 44 : -56)} r={p.r * 0.22} fill="rgba(255,255,255,0.7)" />
                </g>
              );
            })}
            {/* gloss */}
            <ellipse cx={430} cy={860} rx={140} ry={60} fill="rgba(255,255,255,0.3)" transform="rotate(-18 430 860)" />
          </SvgStage>
        </MacroCamera>
      )}

      <DepthOfFieldOverlay strength={1} />
    </AbsoluteFill>
  );
};
