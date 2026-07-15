import type React from 'react';
import { AbsoluteFill } from 'remotion';
import { MacroCamera } from '../effects/MacroCamera';
import { DepthOfFieldOverlay } from '../effects/DepthOfFieldOverlay';
import { SvgStage, KitchenBackdrop } from '../components/Stage';
import { PancakeStack } from '../components/PancakeStack';
import { LemonadeGlass } from '../components/LemonadeGlass';
import { CONFIG } from '../config/breakfast-config';
import { useSeconds, sceneDur, prog, clamp01 } from '../utils/time';

/**
 * Scene 8 — Final breakfast hero shot (0:57–1:00)
 * Syrup-glazed pancakes beside the glowing blue lemonade in bright window
 * light. A final blue condensation drop falls at the position/motion of
 * the opening syrup planets, so the video loops seamlessly. The strongest
 * frame holds for the final half-second — no fade to black.
 */
export const Scene8Hero: React.FC = () => {
  const { t } = useSeconds();
  const dur = sceneDur('hero');

  // final loop drop: leaves the glass rim area and falls through the
  // same design-space corridor the scene-1 planets occupy (x≈540, y≈650+)
  const loopDropP = clamp01(prog(t, 2.2, 2.9));

  // hold: freeze all secondary motion in the last 0.5s
  const hold = t > dur - 0.5 ? 0 : 1;
  const tt = hold ? t : dur - 0.5;

  const glazeColors = CONFIG.syrupPalette.slice(0, 5).map((c) => c.c1);

  return (
    <AbsoluteFill>
      <KitchenBackdrop tone="warm" blur={12} />
      <MacroCamera durationSec={dur} pushFrom={1.0} pushTo={1.03} phase={0.55} handheld={hold ? 1 : 0}>
        <SvgStage>
          {/* steam wisps above the pancakes */}
          {[0, 1].map((i) => (
            <path
              key={i}
              d="M 0 0 C -16 -46, 16 -84, 0 -128 C -16 -170, 12 -204, 0 -240"
              transform={`translate(${300 + i * 90} ${1005 - ((tt * 26 + i * 60) % 130)})`}
              stroke="rgba(255,250,240,0.5)"
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
              opacity={0.35 * Math.sin((((tt * 26 + i * 60) % 130) / 130) * Math.PI)}
            />
          ))}

          {/* glazed pancakes, left */}
          <g transform="translate(-215 130) scale(0.82)">
            <PancakeStack cx={540} topY={1120} rx={330} glaze={1} glazeColors={glazeColors} />
          </g>

          {/* lemonade, right */}
          <g transform="translate(200 -40) scale(0.9)">
            <LemonadeGlass
              cx={640}
              topY={760}
              width={330}
              height={660}
              fill={0.9}
              t={tt}
              wheelP={1}
              condensationAmount={1}
              slideP={prog(t, 0.6, 1.8)}
              idSuffix="s8"
            />
          </g>

          {/* the loop drop — matches the opening frame's planet corridor */}
          {loopDropP > 0 && loopDropP < 1 && (
            <g>
              <circle cx={540} cy={640 + loopDropP * loopDropP * 420} r={9} fill={CONFIG.lemonade.top} />
              <circle cx={537} cy={636 + loopDropP * loopDropP * 420} r={2.6} fill="rgba(255,255,255,0.85)" />
            </g>
          )}
        </SvgStage>
      </MacroCamera>
      <DepthOfFieldOverlay strength={0.8} />
    </AbsoluteFill>
  );
};
