import type React from 'react';
import { AbsoluteFill } from 'remotion';
import { MacroCamera } from '../effects/MacroCamera';
import { DepthOfFieldOverlay, Defocus } from '../effects/DepthOfFieldOverlay';
import { SvgStage, KitchenBackdrop } from '../components/Stage';
import { BlueLemon } from '../components/BlueLemon';
import { Condensation } from '../components/Condensation';
import { useSeconds, sceneDur, prog, clamp01 } from '../utils/time';

/**
 * Scene 5 — Blue lemon reveal (0:38–0:42)
 * The blue ripple has become the round top of a blue lemon on a stone
 * board. The camera lowers from directly overhead into a 3/4 macro angle
 * with a rack-focus from the leaf to the peel.
 */
export const Scene5LemonReveal: React.FC = () => {
  const { t } = useSeconds();
  const dur = sceneDur('lemonReveal');

  const lower = clamp01(prog(t, 0.6, 2.6)); // overhead -> 3/4
  const rack = clamp01(prog(t, 2.2, 3.4)); // leaf -> peel focus
  const leafBlur = rack * 3.2;
  const peelBlur = (1 - rack) * 3.2;

  return (
    <AbsoluteFill>
      <KitchenBackdrop tone="cool" tableY={1060} blur={12} />
      <MacroCamera durationSec={dur} pushFrom={1.0} pushTo={1.06} phase={0.8}>
        <SvgStage>
          {/* stone cutting board */}
          <g transform={`translate(0 ${lower * 60})`}>
            <ellipse cx={540} cy={1210} rx={430} ry={110 + lower * 30} fill="#c9cfd4" />
            <ellipse cx={540} cy={1196} rx={430} ry={110 + lower * 30} fill="#e2e7ea" />
            {[0, 1, 2, 3, 4].map((i) => (
              <ellipse key={i} cx={340 + i * 110} cy={1180 + (i % 2) * 24} rx={30} ry={8} fill="rgba(150,160,168,0.35)" />
            ))}
          </g>
        </SvgStage>

        {/* overhead lemon (fades as the camera lowers) */}
        <Defocus blur={0} opacity={1 - lower}>
          <SvgStage>
            <BlueLemon cx={540} cy={960} r={230} view="top" idSuffix="s5-top" />
          </SvgStage>
        </Defocus>

        {/* 3/4 side lemon */}
        <AbsoluteFill style={{ opacity: lower }}>
          {/* peel layer */}
          <Defocus blur={peelBlur}>
            <SvgStage>
              <BlueLemon cx={540} cy={1020} r={200} view="side" withLeaf={false} idSuffix="s5-side" />
              <Condensation x={380} y={900} width={320} height={220} seedLabel="s5-cond" amount={clamp01(prog(t, 1.4, 3))} slideP={prog(t, 1.4, 2.6)} />
            </SvgStage>
          </Defocus>
          {/* leaf layer (separate so we can rack focus) */}
          <Defocus blur={leafBlur}>
            <SvgStage>
              <g transform="translate(714 894) rotate(-18)">
                <rect x={-4} y={-30} width={8} height={30} rx={4} fill="#276b34" />
                <path d="M 0 -26 C 42 -56, 78 -36, 56 -4 C 34 12, 8 -2, 0 -26 Z" fill="#3d9c4f" />
                <path d="M 3 -24 C 28 -36, 50 -28, 50 -12" stroke="#276b34" strokeWidth={2.4} fill="none" opacity={0.7} />
              </g>
            </SvgStage>
          </Defocus>
        </AbsoluteFill>
      </MacroCamera>
      <DepthOfFieldOverlay strength={0.9} />
    </AbsoluteFill>
  );
};
