import type React from 'react';
import { AbsoluteFill } from 'remotion';
import { MacroCamera } from '../effects/MacroCamera';
import { DepthOfFieldOverlay } from '../effects/DepthOfFieldOverlay';
import { SvgStage, PLANETS } from '../components/Stage';
import { KitchenBackdrop } from '../components/Stage';
import { ParticleBubbles } from '../components/ParticleBubbles';
import { useSeconds, sceneDur, prog, clamp01 } from '../utils/time';
import { CONFIG } from '../config/breakfast-config';

/**
 * Scene 4 — Glossy syrup finish (0:27–0:38)
 * Overhead macro. A small spoon sweeps across the top pancake, blending
 * the pools into one jewel-toned glaze with prismatic ripples. Ends on an
 * expanding electric-blue ripple: the match-cut into the blue lemon.
 */
export const Scene4Glaze: React.FC = () => {
  const { t } = useSeconds();
  const dur = sceneDur('glaze');

  // spoon sweeps: two slow passes
  const sweep = Math.sin(prog(t, 0.5, 8.5) * Math.PI * 2) * 240;
  const spoonIn = clamp01(prog(t, 0, 1.2));
  const blend = clamp01(prog(t, 1, 8));
  const rippleP = prog(t, 9.5, dur); // the blue transition ripple
  const spoonOut = clamp01(prog(t, 8.4, 9.4));

  return (
    <AbsoluteFill>
      <KitchenBackdrop tone="warm" blur={14} />
      <MacroCamera durationSec={dur} pushFrom={1.05} pushTo={1.0} arcPx={12} phase={0.4}>
        <SvgStage>
          {/* overhead plate + pancake top */}
          <circle cx={540} cy={960} r={470} fill="#efe7da" />
          <circle cx={540} cy={960} r={430} fill="#faf5ec" />
          <circle cx={540} cy={960} r={352} fill="#eab766" />

          {/* individual pools fading into one blended glaze */}
          {PLANETS.map((p, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <ellipse
                key={p.idSuffix}
                cx={540 + Math.cos(a) * 120 * (1 - blend * 0.8)}
                cy={960 + Math.sin(a) * 120 * (1 - blend * 0.8)}
                rx={130 + blend * 120}
                ry={116 + blend * 108}
                fill={p.color.c1}
                opacity={0.32}
              />
            );
          })}
          {/* unified jewel glaze */}
          <circle cx={540} cy={960} r={330 * clamp01(0.3 + blend)} fill="url(#glaze-jewel)" opacity={0.5 + blend * 0.35} />
          <defs>
            <radialGradient id="glaze-jewel" cx="0.42" cy="0.4" r="0.9">
              <stop offset="0%" stopColor="#ffd9a8" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#e86fae" stopOpacity="0.6" />
              <stop offset="75%" stopColor="#7a5cff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#41c4ff" stopOpacity="0.6" />
            </radialGradient>
          </defs>

          {/* prismatic ripple rings following the spoon */}
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={540 + sweep * 0.5}
              cy={960}
              r={80 + ((t * 40 + i * 90) % 280)}
              fill="none"
              stroke={`hsl(${(t * 40 + i * 120) % 360} 80% 70%)`}
              strokeWidth={3}
              opacity={0.22 * blend * (1 - ((t * 40 + i * 90) % 280) / 280)}
            />
          ))}

          {/* tiny bubbles in the glaze */}
          <ParticleBubbles t={t} x={300} y={760} width={480} height={380} count={12} seedLabel="s4-bubbles" speed={12} maxR={2.6} color="rgba(255,255,255,0.5)" />

          {/* spoon spreading the syrup */}
          <g transform={`translate(${540 + sweep} ${820 - (1 - spoonIn) * 320 + spoonOut * 420}) rotate(${sweep * 0.05})`} opacity={1 - spoonOut}>
            <rect x={-16} y={-330} width={32} height={280} rx={16} fill="url(#spoon-steel)" />
            <ellipse cx={0} cy={0} rx={62} ry={78} fill="url(#spoon-steel)" />
            <ellipse cx={-12} cy={-14} rx={26} ry={36} fill="rgba(255,255,255,0.55)" />
            <defs>
              <linearGradient id="spoon-steel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#eef2f6" />
                <stop offset="60%" stopColor="#b9c3cc" />
                <stop offset="100%" stopColor="#8b959f" />
              </linearGradient>
            </defs>
            {/* syrup wake behind the spoon */}
            <ellipse cx={-sweep * 0.3} cy={40} rx={110} ry={26} fill="rgba(255,255,255,0.28)" />
          </g>

          {/* the expanding electric-blue transition ripple */}
          {rippleP > 0 && (
            <g>
              <circle cx={540} cy={960} r={rippleP * 560} fill={CONFIG.lemonPalette.peelLight} opacity={0.25 + rippleP * 0.55} />
              {[0.85, 0.65, 0.45].map((k, i) => (
                <circle key={i} cx={540} cy={960} r={rippleP * 560 * k} fill="none" stroke="#8fd8ff" strokeWidth={5 - i} opacity={(1 - rippleP) * 0.8} />
              ))}
            </g>
          )}
        </SvgStage>
      </MacroCamera>
      <DepthOfFieldOverlay strength={0.85} />
    </AbsoluteFill>
  );
};
