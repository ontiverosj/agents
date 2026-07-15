import type React from 'react';
import { AbsoluteFill } from 'remotion';
import { MacroCamera } from '../effects/MacroCamera';
import { DepthOfFieldOverlay } from '../effects/DepthOfFieldOverlay';
import { SvgStage, KitchenBackdrop } from '../components/Stage';
import { LemonadeGlass } from '../components/LemonadeGlass';
import { BlueLemon } from '../components/BlueLemon';
import { CONFIG } from '../config/breakfast-config';
import { useSeconds, sceneDur, prog, clamp01 } from '../utils/time';

const LM = CONFIG.lemonade;

/**
 * Scene 7 — Electric-blue lemonade (0:49–0:57)
 * Squeeze the blue lemon over ice, pour the luminous stream, watch the
 * swirl wrap the cubes; one contained splash; lemon wheel lands on the
 * rim; the camera tilts up with the rising liquid.
 */
export const Scene7Lemonade: React.FC = () => {
  const { t } = useSeconds();
  const dur = sceneDur('lemonade');

  const squeeze = clamp01(prog(t, 0.3, 2.2)); // lemon half squeezing above the glass
  const squeezeOut = clamp01(prog(t, 1.9, 2.6));
  const pour = clamp01(prog(t, 2.2, 5.8)); // stream + rising level
  const pouring = t >= 2.2 && t <= 5.9;
  const fill = clamp01(squeeze * 0.12 + pour * 0.78);
  const splashP = clamp01(prog(t, 6.2, 7.0));
  const wheelP = clamp01(prog(t, 4.6, 5.6));

  // camera tilts up with the liquid: stage moves down as level rises
  const tiltY = fill * 60;

  const glassTop = 640;
  const glassH = 760;
  const streamX = 590;

  return (
    <AbsoluteFill>
      <KitchenBackdrop tone="cool" tableY={1420} blur={13} />
      <MacroCamera durationSec={dur} pushFrom={1.0} pushTo={1.05} orbitDeg={5} arcPx={22} phase={0.35}>
        <AbsoluteFill style={{ transform: `translateY(${tiltY}px)` }}>
          <SvgStage>
            {/* squeezing lemon half above the glass */}
            <g
              transform={`translate(${480 + squeezeOut * 260} ${300 - squeezeOut * 180}) rotate(${-24 + squeeze * 14})`}
              opacity={1 - squeezeOut}
            >
              <BlueLemon cx={0} cy={0} r={130} view="halfInterior" idSuffix="s7-squeeze" rotate={180} />
              {/* squeeze compression */}
              <ellipse cx={0} cy={-6} rx={130 * (1 - squeeze * 0.12)} ry={130 * (1 - squeeze * 0.2)} fill="rgba(10,30,120,0)" />
            </g>

            {/* juice drops from the squeeze */}
            {squeeze > 0.25 &&
              squeezeOut < 1 &&
              [0, 1, 2].map((i) => {
                const dp = clamp01(((t - 0.8 - i * 0.4) % 1.2) / 1.2);
                return (
                  <circle
                    key={i}
                    cx={500 + i * 26}
                    cy={330 + dp * (glassTop - 300)}
                    r={7 - i}
                    fill={LM.top}
                    opacity={dp > 0 && dp < 0.95 ? 0.9 : 0}
                  />
                );
              })}

            {/* pouring stream */}
            {pouring && (
              <g>
                <path
                  d={`M ${streamX} 240
                      C ${streamX - 6} 420, ${streamX + 6} 560, ${streamX} ${glassTop + 60}`}
                  stroke={`url(#stream-grad)`}
                  strokeWidth={16 - Math.sin(t * 7) * 2}
                  fill="none"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="stream-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={LM.top} />
                    <stop offset="100%" stopColor={LM.mid} />
                  </linearGradient>
                </defs>
                <ellipse cx={streamX} cy={glassTop + 66} rx={26} ry={8} fill="#9fe8ff" opacity={0.8} />
              </g>
            )}

            {/* the glass */}
            <LemonadeGlass
              cx={540}
              topY={glassTop}
              width={370}
              height={glassH}
              fill={fill}
              t={t}
              splashP={splashP}
              wheelP={wheelP}
              condensationAmount={0.4 + fill * 0.6}
              slideP={prog(t, 6.6, 7.8)}
              idSuffix="s7"
            />
          </SvgStage>
        </AbsoluteFill>
      </MacroCamera>
      <DepthOfFieldOverlay strength={0.95} />
    </AbsoluteFill>
  );
};
