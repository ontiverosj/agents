import type React from 'react';
import { CONFIG } from '../config/breakfast-config';
import { seededSeries } from '../utils/rand';
import { ParticleBubbles } from './ParticleBubbles';
import { Condensation } from './Condensation';
import { clamp01 } from '../utils/time';

const LM = CONFIG.lemonade;
const ICE_SEED = seededSeries('ice-cubes', 12);

/**
 * LemonadeGlass: chilled glass with ice, rising luminous blue lemonade,
 * swirl gradient, bubbles, a lemon wheel and condensation.
 *
 * fill: 0..1 liquid level
 * swirlT: seconds driving the internal swirl
 * splashP: 0..1 one contained splash impulse
 * wheelP: 0..1 lemon wheel presence
 */
export const LemonadeGlass: React.FC<{
  cx: number;
  topY: number;
  width: number;
  height: number;
  fill: number;
  t: number;
  splashP?: number;
  wheelP?: number;
  condensationAmount?: number;
  slideP?: number;
  idSuffix: string;
}> = ({ cx, topY, width, height, fill, t, splashP = 0, wheelP = 0, condensationAmount = 0.8, slideP = 0, idSuffix }) => {
  const gid = `glass-${idSuffix}`;
  const x = cx - width / 2;
  const bottomY = topY + height;
  const level = bottomY - 14 - clamp01(fill) * (height - 90);
  const swirl = Math.sin(t * 0.9) * 14;

  const iceCubes = [
    { dx: -0.22, dy: 0.78, s: 0.9, rot: -14 },
    { dx: 0.18, dy: 0.82, s: 1.05, rot: 22 },
    { dx: -0.05, dy: 0.58, s: 0.85, rot: 8 },
    { dx: 0.22, dy: 0.5, s: 0.8, rot: -28 },
  ];

  return (
    <g>
      <defs>
        <linearGradient id={`${gid}-liquid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={LM.top} />
          <stop offset="55%" stopColor={LM.mid} />
          <stop offset="100%" stopColor={LM.deep} />
        </linearGradient>
        <clipPath id={`${gid}-clip`}>
          <path d={`M ${x + 8} ${topY} L ${x + width - 8} ${topY} L ${x + width - 20} ${bottomY} L ${x + 20} ${bottomY} Z`} />
        </clipPath>
      </defs>

      {/* table shadow */}
      <ellipse cx={cx} cy={bottomY + 16} rx={width * 0.62} ry={16} fill="rgba(10,20,50,0.32)" />

      <g clipPath={`url(#${gid}-clip)`}>
        {/* liquid */}
        {fill > 0 && (
          <g>
            <rect x={x} y={level} width={width} height={bottomY - level} fill={`url(#${gid}-liquid)`} opacity={0.94} />
            {/* swirl bands */}
            <path
              d={`M ${x} ${level + 30 + swirl} C ${cx - 40} ${level + 10 - swirl}, ${cx + 40} ${level + 50 + swirl}, ${x + width} ${level + 22 - swirl}`}
              stroke="rgba(160,230,255,0.55)"
              strokeWidth={10}
              fill="none"
            />
            <path
              d={`M ${x} ${level + 80 - swirl} C ${cx - 60} ${level + 110 + swirl}, ${cx + 60} ${level + 60 - swirl}, ${x + width} ${level + 96 + swirl}`}
              stroke="rgba(20,80,200,0.5)"
              strokeWidth={14}
              fill="none"
            />
            {/* surface */}
            <ellipse cx={cx} cy={level} rx={width / 2 - 10} ry={10} fill="#8fe4ff" opacity={0.9} />
            {/* rising bubbles */}
            <ParticleBubbles
              t={t}
              x={x + 24}
              y={level}
              width={width - 48}
              height={bottomY - level - 10}
              count={16}
              seedLabel={`bubbles-${idSuffix}`}
              speed={55}
              maxR={3.5}
              color="rgba(220,246,255,0.8)"
            />
          </g>
        )}

        {/* ice cubes (refractive) */}
        {iceCubes.map((c, i) => {
          const shift = Math.sin(t * 0.6 + ICE_SEED[i] * 8) * 2 * clamp01(fill * 2);
          const cxx = cx + c.dx * width;
          const cyy = topY + c.dy * height + shift;
          const s = 52 * c.s;
          return (
            <g key={i} transform={`translate(${cxx} ${cyy}) rotate(${c.rot + shift})`} opacity={0.88}>
              <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={12} fill="rgba(235,250,255,0.5)" stroke="rgba(255,255,255,0.75)" strokeWidth={3} />
              <rect x={-s / 2 + 8} y={-s / 2 + 8} width={s * 0.4} height={s * 0.32} rx={8} fill="rgba(255,255,255,0.55)" />
              <path d={`M ${-s * 0.2} ${s * 0.24} L ${s * 0.28} ${-s * 0.18}`} stroke="rgba(190,225,255,0.8)" strokeWidth={2.4} />
            </g>
          );
        })}

        {/* contained splash */}
        {splashP > 0 && splashP < 1 && (
          <g transform={`translate(${cx} ${level})`} opacity={1 - splashP}>
            {[-2, -1, 0, 1, 2].map((s) => (
              <circle key={s} cx={s * 26 * splashP} cy={-30 * splashP * (1 - Math.abs(s) * 0.24)} r={5 - Math.abs(s)} fill="#aee9ff" />
            ))}
            <ellipse rx={40 * splashP + 16} ry={7} fill="rgba(230,250,255,0.7)" />
          </g>
        )}
      </g>

      {/* glass walls (over the liquid) */}
      <path
        d={`M ${x + 8} ${topY} L ${x + width - 8} ${topY} L ${x + width - 20} ${bottomY} L ${x + 20} ${bottomY} Z`}
        fill="rgba(240,250,255,0.09)"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth={6}
      />
      <path d={`M ${x + 26} ${topY + 26} L ${x + 34} ${bottomY - 26}`} stroke="rgba(255,255,255,0.4)" strokeWidth={9} strokeLinecap="round" />
      {/* rim ellipse */}
      <ellipse cx={cx} cy={topY} rx={width / 2 - 6} ry={12} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={5} />

      {/* lemon wheel on the rim */}
      {wheelP > 0 && (
        <g transform={`translate(${x + width - 26} ${topY + 4}) rotate(${-18 + (1 - wheelP) * 30}) scale(${0.9 * wheelP + 0.1})`} opacity={wheelP}>
          <circle r={44} fill={CONFIG.lemonPalette.peelLight} />
          <circle r={37} fill={CONFIG.lemonPalette.interior} />
          {Array.from({ length: 8 }).map((_, i) => {
            const a0 = (i / 8) * Math.PI * 2 + 0.08;
            const a1 = ((i + 1) / 8) * Math.PI * 2 - 0.08;
            return (
              <path
                key={i}
                d={`M 0 0 L ${Math.cos(a0) * 34} ${Math.sin(a0) * 34} A 34 34 0 0 1 ${Math.cos(a1) * 34} ${Math.sin(a1) * 34} Z`}
                fill={CONFIG.lemonPalette.vesicle}
                opacity={0.55}
              />
            );
          })}
        </g>
      )}

      {/* condensation on the outside */}
      <Condensation
        x={x + 14}
        y={topY + 40}
        width={width - 28}
        height={height - 80}
        seedLabel={`cond-${idSuffix}`}
        amount={condensationAmount}
        slideP={slideP}
      />
    </g>
  );
};
