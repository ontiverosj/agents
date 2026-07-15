import type React from 'react';
import { AbsoluteFill } from 'remotion';
import { MacroCamera } from '../effects/MacroCamera';
import { DepthOfFieldOverlay, Defocus } from '../effects/DepthOfFieldOverlay';
import { HeatDistortion } from '../effects/HeatDistortion';
import { KitchenBackdrop, SvgStage, STAGE, PLANETS } from '../components/Stage';
import { PancakeStack } from '../components/PancakeStack';
import { SyrupPlanet } from '../components/SyrupPlanet';
import { SyrupDrop } from '../components/SyrupDrop';
import { useSeconds, sceneDur, prog, clamp01 } from '../utils/time';

/**
 * Scene 2 — Heating and softening (0:04–0:14)
 * Surfaces pit, sweat and stretch. The pink planet elongates first; the
 * others follow at staggered times. A first hanging drop forms and the
 * focus shifts from the pancake surface to that drop.
 */
export const Scene2Heating: React.FC = () => {
  const { t } = useSeconds();
  const dur = sceneDur('heating');

  // per-planet melt: pink (meltRank 0) starts at 1.5s, each rank +1.4s,
  // melting toward ~0.7 by scene end (drops start falling in scene 3)
  const meltFor = (rank: number) => clamp01(prog(t, 1.5 + rank * 1.4, dur + 2.5) * 0.75);

  const pink = PLANETS.find((p) => p.color.name === 'strawberry')!;
  const pinkMelt = meltFor(pink.meltRank);
  const dropP = clamp01(prog(t, 6.5, dur) * 0.42); // bead forms, never releases yet
  const focusToDrop = prog(t, 6, 9);

  return (
    <AbsoluteFill>
      <KitchenBackdrop tone="warm" blur={13} />
      <MacroCamera durationSec={dur} pushFrom={1.02} pushTo={1.09} orbitDeg={9} arcPx={-18} phase={0.5}>
        <HeatDistortion amount={0.4} id="s2">
          {/* pancake layer — defocuses slightly as focus racks to the drop */}
          <Defocus blur={focusToDrop * 3.2}>
            <SvgStage>
              <PancakeStack cx={STAGE.stackCx} topY={STAGE.stackTopY} rx={STAGE.stackRx} />
            </SvgStage>
          </Defocus>
          <SvgStage>
            {PLANETS.map((p) => (
              <SyrupPlanet
                key={p.idSuffix}
                color={p.color}
                cx={p.x}
                cy={p.y + meltFor(p.meltRank) * 26}
                r={p.r}
                t={t + 4}
                phase={p.phase}
                melt={meltFor(p.meltRank)}
                idSuffix={`s2-${p.idSuffix}`}
              />
            ))}
            {/* the first hanging drop under the pink planet */}
            <SyrupDrop
              color={pink.color}
              x={pink.x}
              y={pink.y + pink.r * 1.15 + pinkMelt * 26}
              landY={STAGE.stackTopY - 10}
              p={dropP}
              size={1}
            />
          </SvgStage>
        </HeatDistortion>
      </MacroCamera>
      <DepthOfFieldOverlay strength={1} />
    </AbsoluteFill>
  );
};
