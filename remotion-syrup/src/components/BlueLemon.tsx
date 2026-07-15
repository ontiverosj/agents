import type React from 'react';
import { CONFIG } from '../config/breakfast-config';
import { seededSeries } from '../utils/rand';

const PORES = seededSeries('lemon-pores', 80);
const L = CONFIG.lemonPalette;

/**
 * BlueLemon: a realistic-form lemon with an impossible cobalt color.
 * view='top' draws the overhead disc used for the ripple match-cut,
 * view='side' draws the classic pointed-ends profile,
 * view='halfInterior' draws a cut face with juice vesicles.
 */
export const BlueLemon: React.FC<{
  cx: number;
  cy: number;
  r: number;
  view: 'top' | 'side' | 'halfInterior';
  withLeaf?: boolean;
  idSuffix: string;
  /** rotate the whole fruit, deg */
  rotate?: number;
}> = ({ cx, cy, r, view, withLeaf = true, idSuffix, rotate = 0 }) => {
  const gid = `lemon-${idSuffix}`;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate})`}>
      <defs>
        <radialGradient id={`${gid}-peel`} cx="0.38" cy="0.32" r="0.95">
          <stop offset="0%" stopColor={L.peelLight} />
          <stop offset="55%" stopColor="#1740b8" />
          <stop offset="100%" stopColor={L.peelDark} />
        </radialGradient>
        <radialGradient id={`${gid}-flesh`} cx="0.5" cy="0.45" r="0.7">
          <stop offset="0%" stopColor={L.interiorRim} />
          <stop offset="55%" stopColor={L.interior} />
          <stop offset="100%" stopColor="#a9cdf5" />
        </radialGradient>
      </defs>

      {view === 'top' && (
        <g>
          <circle r={r} fill={`url(#${gid}-peel)`} />
          {PORES.slice(0, 26).map((p, i) => {
            const a = PORES[i + 26] * Math.PI * 2;
            const rr = Math.sqrt(p) * 0.88;
            return (
              <circle key={i} cx={Math.cos(a) * r * rr} cy={Math.sin(a) * r * rr} r={0.9 + p * 1.8} fill="rgba(6,16,70,0.5)" />
            );
          })}
          <ellipse cx={-r * 0.32} cy={-r * 0.36} rx={r * 0.3} ry={r * 0.18} fill="rgba(143,216,255,0.5)" />
          <circle r={r * 0.07} fill={L.leafDark} />
        </g>
      )}

      {view === 'side' && (
        <g>
          {/* body with pointed nubs */}
          <path
            d={`M ${-r * 1.28} 0
                C ${-r * 1.28} ${-r * 0.28}, ${-r * 1.05} ${-r * 0.45}, ${-r * 0.85} ${-r * 0.55}
                C ${-r * 0.5} ${-r * 0.95}, ${r * 0.5} ${-r * 0.95}, ${r * 0.85} ${-r * 0.55}
                C ${r * 1.05} ${-r * 0.45}, ${r * 1.28} ${-r * 0.28}, ${r * 1.28} 0
                C ${r * 1.28} ${r * 0.28}, ${r * 1.05} ${r * 0.45}, ${r * 0.85} ${r * 0.55}
                C ${r * 0.5} ${r * 0.95}, ${-r * 0.5} ${r * 0.95}, ${-r * 0.85} ${r * 0.55}
                C ${-r * 1.05} ${r * 0.45}, ${-r * 1.28} ${r * 0.28}, ${-r * 1.28} 0 Z`}
            fill={`url(#${gid}-peel)`}
          />
          {PORES.slice(30, 52).map((p, i) => {
            const a = PORES[i + 52] * Math.PI * 2;
            return (
              <circle
                key={i}
                cx={Math.cos(a) * r * Math.sqrt(p) * 1.05}
                cy={Math.sin(a) * r * Math.sqrt(p) * 0.72}
                r={0.9 + p * 1.7}
                fill="rgba(6,16,70,0.45)"
              />
            );
          })}
          <ellipse cx={-r * 0.4} cy={-r * 0.4} rx={r * 0.34} ry={r * 0.16} fill="rgba(143,216,255,0.55)" transform="rotate(-16)" />
          {withLeaf && (
            <g transform={`translate(${r * 0.9} ${-r * 0.62}) rotate(-18)`}>
              <rect x={-3} y={-26} width={6} height={26} rx={3} fill={L.leafDark} />
              <path d="M 0 -22 C 34 -46, 62 -30, 44 -4 C 26 8, 6 -2, 0 -22 Z" fill={L.leaf} />
              <path d="M 2 -20 C 22 -30, 40 -22, 40 -10" stroke={L.leafDark} strokeWidth={2} fill="none" opacity={0.7} />
            </g>
          )}
        </g>
      )}

      {view === 'halfInterior' && (
        <g>
          <circle r={r} fill={`url(#${gid}-peel)`} />
          <circle r={r * 0.88} fill={`url(#${gid}-flesh)`} />
          <circle r={r * 0.88} fill="none" stroke="#ffffff" strokeWidth={r * 0.05} opacity={0.8} />
          {/* vesicle wedges */}
          {Array.from({ length: 9 }).map((_, i) => {
            const a0 = (i / 9) * Math.PI * 2 + 0.06;
            const a1 = ((i + 1) / 9) * Math.PI * 2 - 0.06;
            const rr = r * 0.8;
            return (
              <path
                key={i}
                d={`M 0 0 L ${Math.cos(a0) * rr} ${Math.sin(a0) * rr} A ${rr} ${rr} 0 0 1 ${Math.cos(a1) * rr} ${Math.sin(a1) * rr} Z`}
                fill={i % 2 ? L.vesicle : L.vesicleDeep}
                opacity={0.5}
              />
            );
          })}
          {/* juice glisten */}
          {PORES.slice(60, 72).map((p, i) => {
            const a = PORES[i + 8] * Math.PI * 2;
            return (
              <circle key={i} cx={Math.cos(a) * r * 0.55 * p} cy={Math.sin(a) * r * 0.55 * p} r={1 + p * 2.2} fill="rgba(255,255,255,0.65)" />
            );
          })}
          <circle r={r * 0.1} fill={L.interiorRim} />
        </g>
      )}
    </g>
  );
};
