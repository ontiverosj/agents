import type React from 'react';
import { AbsoluteFill } from 'remotion';
import { MacroCamera } from '../effects/MacroCamera';
import { DepthOfFieldOverlay } from '../effects/DepthOfFieldOverlay';
import { SvgStage, KitchenBackdrop } from '../components/Stage';
import { BlueLemon } from '../components/BlueLemon';
import { ChefKnife, JuiceBeads } from '../components/KnifeSlice';
import { CONFIG } from '../config/breakfast-config';
import { useSeconds, sceneDur, prog, clamp01, slowMoWarp } from '../utils/time';

const L = CONFIG.lemonPalette;

/**
 * Scene 6 — Chef knife cut (0:42–0:49)
 * One confident controlled slice; a subtle slow-motion emphasis as the
 * halves separate; then an extreme close-up of the icy-blue interior and
 * one half turning toward camera. No hands in frame; the knife moves in a
 * single clean vertical stroke.
 */
export const Scene6KnifeCut: React.FC = () => {
  const { t: rawT } = useSeconds();
  const dur = sceneDur('knifeCut');
  // slow-motion emphasis exactly while the halves separate
  const t = slowMoWarp(rawT, 2.4, 3.4, 0.5);

  const interior = rawT >= 4.2; // cut to interior close-up

  const knifeDown = clamp01(prog(t, 0.6, 2.3)); // blade travels through the fruit
  const knifeUp = clamp01(prog(t, 3.4, 4.1));
  const separate = clamp01(prog(t, 2.3, 3.6)); // halves part
  const halfTurn = clamp01(prog(rawT, 5.4, 6.6)); // final half rotates toward camera

  const lemonCx = 540;
  const lemonCy = 1030;
  const r = 190;
  const knifeY = -560 + knifeDown * 560 - knifeUp * 620;

  return (
    <AbsoluteFill>
      <KitchenBackdrop tone="cool" tableY={1080} blur={12} />
      {!interior ? (
        <MacroCamera durationSec={4.2} pushFrom={1.02} pushTo={1.08} arcPx={-14} phase={0.1}>
          <SvgStage>
            {/* stone board, low side angle */}
            <rect x={40} y={1130} width={1000} height={70} rx={22} fill="#dfe4e8" />
            <rect x={40} y={1180} width={1000} height={26} rx={12} fill="#b9c1c7" />

            {/* two halves (clipped from the side view) part as separate rises */}
            <g transform={`translate(${-separate * 46} 0) rotate(${-separate * 2} ${lemonCx} ${lemonCy})`}>
              <g clipPath="url(#s6-left)">
                <BlueLemon cx={lemonCx} cy={lemonCy} r={r} view="side" withLeaf={false} idSuffix="s6l" />
              </g>
              {separate > 0.05 && (
                <ellipse cx={lemonCx - 6} cy={lemonCy} rx={16} ry={r * 0.82} fill={L.interior} stroke="#fff" strokeWidth={4} />
              )}
            </g>
            <g transform={`translate(${separate * 52} 0) rotate(${separate * 2.4} ${lemonCx} ${lemonCy})`}>
              <g clipPath="url(#s6-right)">
                <BlueLemon cx={lemonCx} cy={lemonCy} r={r} view="side" withLeaf idSuffix="s6r" />
              </g>
              {separate > 0.05 && (
                <ellipse cx={lemonCx + 6} cy={lemonCy} rx={16} ry={r * 0.82} fill={L.interior} stroke="#fff" strokeWidth={4} />
              )}
            </g>
            <defs>
              <clipPath id="s6-left">
                <rect x={lemonCx - r * 1.5} y={lemonCy - r * 1.4} width={r * 1.5} height={r * 2.8} />
              </clipPath>
              <clipPath id="s6-right">
                <rect x={lemonCx} y={lemonCy - r * 1.4} width={r * 1.5} height={r * 2.8} />
              </clipPath>
            </defs>

            {/* the knife: tracked vertical stroke through the fruit */}
            <g transform={`translate(${lemonCx - 150} ${lemonCy + knifeY}) rotate(3)`}>
              <ChefKnife scale={1.15} />
            </g>

            {/* juice beads on the board + blade */}
            <JuiceBeads
              color={L.vesicle}
              opacity={clamp01(separate * 1.4)}
              points={[
                [lemonCx - 90, 1142],
                [lemonCx - 30, 1150],
                [lemonCx + 44, 1146],
                [lemonCx + 110, 1152],
                [lemonCx - 130, 1156],
              ]}
            />
          </SvgStage>
        </MacroCamera>
      ) : (
        /* ---- interior extreme close-up ---- */
        <MacroCamera durationSec={2.8} pushFrom={1.04} pushTo={1.1} arcPx={10} phase={0.6}>
          <SvgStage>
            <rect x={40} y={1220} width={1000} height={70} rx={22} fill="#dfe4e8" />
            {/* far half, slightly defocused feel via opacity */}
            <g opacity={0.75} transform="translate(210 -130) scale(0.72)">
              <BlueLemon cx={340} cy={1060} r={210} view="side" withLeaf={false} idSuffix="s6far" />
            </g>
            {/* hero half turning toward camera */}
            <g transform={`translate(${halfTurn * 24} ${halfTurn * -10}) rotate(${-6 + halfTurn * 10} 620 1000)`}>
              <BlueLemon cx={620} cy={1000} r={250} view="halfInterior" idSuffix="s6hero" />
            </g>
            <JuiceBeads
              color={L.vesicle}
              points={[
                [430, 1246],
                [560, 1252],
                [700, 1242],
                [810, 1250],
              ]}
            />
          </SvgStage>
        </MacroCamera>
      )}
      <DepthOfFieldOverlay strength={1} />
    </AbsoluteFill>
  );
};
