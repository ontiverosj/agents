import type React from 'react';
import { AbsoluteFill } from 'remotion';
import { MacroCamera } from '../effects/MacroCamera';
import { DepthOfFieldOverlay } from '../effects/DepthOfFieldOverlay';
import { HeatDistortion } from '../effects/HeatDistortion';
import { KitchenBackdrop, SvgStage, STAGE, PLANETS } from '../components/Stage';
import { PancakeStack } from '../components/PancakeStack';
import { SyrupPlanet } from '../components/SyrupPlanet';
import { ParticleBubbles } from '../components/ParticleBubbles';
import { useSeconds, sceneDur } from '../utils/time';

/**
 * Scene 1 — Immediate visual hook (0:00–0:04)
 * Extreme macro on the warm stack; six syrup planets float above it,
 * rotating, glistening, wobbling in the rising heat. No title, no fade.
 */
export const Scene1Hook: React.FC = () => {
  const { t } = useSeconds();
  const dur = sceneDur('hook');

  return (
    <AbsoluteFill>
      <KitchenBackdrop tone="warm" blur={12} />
      <MacroCamera durationSec={dur} pushFrom={1.0} pushTo={1.04} arcPx={26} phase={0.2}>
        <HeatDistortion amount={0.25} id="s1">
          <SvgStage>
            <PancakeStack cx={STAGE.stackCx} topY={STAGE.stackTopY} rx={STAGE.stackRx} />
            {/* floating syrup planets */}
            {PLANETS.map((p) => (
              <g key={p.idSuffix} transform={`translate(0 ${Math.sin(t * 0.8 + p.phase * 6.28) * 8})`}>
                <SyrupPlanet
                  color={p.color}
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  t={t}
                  phase={p.phase}
                  melt={0}
                  idSuffix={`s1-${p.idSuffix}`}
                />
              </g>
            ))}
            {/* heat sparkle rising between planets and stack */}
            <ParticleBubbles
              t={t}
              x={220}
              y={760}
              width={640}
              height={320}
              count={10}
              seedLabel="s1-heat"
              speed={26}
              maxR={2.2}
              color="rgba(255,240,205,0.5)"
            />
          </SvgStage>
        </HeatDistortion>
      </MacroCamera>
      <DepthOfFieldOverlay strength={0.9} />
    </AbsoluteFill>
  );
};
