import type React from 'react';
import { SyrupColor } from '../config/breakfast-config';
import { wobble } from '../utils/rand';
import { clamp01 } from '../utils/time';

export interface SyrupPlanetProps {
  color: SyrupColor;
  cx: number;
  cy: number;
  r: number;
  /** local seconds — drives rotation, wobble, internal fluid */
  t: number;
  /** unique per-planet phase 0..1 */
  phase: number;
  /**
   * melt state 0..1:
   * 0 = pristine sphere, 0..0.4 = surface pits + sweat beads,
   * 0.4..0.8 = elongation and a hanging drop, 0.8..1 = collapsing.
   */
  melt?: number;
  /** overall opacity (planets vanish once fully dripped) */
  opacity?: number;
  idSuffix: string;
}

/**
 * SyrupPlanet: a marble-sized translucent syrup sphere. Internal drifting
 * gradients read as slow fluid movement, a specular dot + rim light sell
 * the gloss, and the melt parameter drives pitting, sweating, elongation
 * and collapse — all deterministic functions of (t, phase, melt).
 */
export const SyrupPlanet: React.FC<SyrupPlanetProps> = ({
  color,
  cx,
  cy,
  r,
  t,
  phase,
  melt = 0,
  opacity = 1,
  idSuffix,
}) => {
  if (opacity <= 0) return null;
  const wob = wobble(t, 1.2, phase) * 0.02 + 1;
  const stretch = 1 + clamp01((melt - 0.4) / 0.4) * 0.35; // elongate under gravity
  const collapse = clamp01((melt - 0.8) / 0.2);
  const scaleY = (wob * stretch) * (1 - collapse * 0.55);
  const scaleX = (2 - wob) * (1 - clamp01((melt - 0.4) / 0.6) * 0.12) * (1 + collapse * 0.25);
  const rot = t * 9 + phase * 360; // slow rotation, deg
  const innerShift = Math.sin(t * 0.7 + phase * 6.28) * r * 0.18;
  const pit = clamp01(melt / 0.4);
  const gid = `planet-${idSuffix}`;

  return (
    <g opacity={opacity} transform={`translate(${cx} ${cy}) scale(${scaleX} ${scaleY})`}>
      <defs>
        <radialGradient id={`${gid}-body`} cx="0.38" cy="0.32" r="0.95">
          <stop offset="0%" stopColor={color.c1} stopOpacity="0.95" />
          <stop offset="62%" stopColor={color.c1} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color.c2} stopOpacity="0.96" />
        </radialGradient>
        <radialGradient id={`${gid}-fluid`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${gid}-clip`}>
          <circle r={r} />
        </clipPath>
      </defs>

      {/* body */}
      {color.prismatic ? (
        <g>
          <circle r={r} fill={`url(#${gid}-body)`} />
          <g clipPath={`url(#${gid}-clip)`} opacity={0.75}>
            <g transform={`rotate(${rot * 1.6})`}>
              {['#ff5f5f', '#ffb44d', '#ffe24d', '#5fe08a', '#4db4ff', '#9a6bff'].map((c, i) => (
                <path
                  key={c}
                  d={`M 0 0 L ${Math.cos((i * 60 * Math.PI) / 180) * r * 1.4} ${Math.sin((i * 60 * Math.PI) / 180) * r * 1.4}
                     A ${r * 1.4} ${r * 1.4} 0 0 1 ${Math.cos(((i + 1) * 60 * Math.PI) / 180) * r * 1.4} ${Math.sin(((i + 1) * 60 * Math.PI) / 180) * r * 1.4} Z`}
                  fill={c}
                  opacity={0.55}
                />
              ))}
            </g>
          </g>
        </g>
      ) : (
        <circle r={r} fill={`url(#${gid}-body)`} />
      )}

      {/* internal fluid drift */}
      <g clipPath={`url(#${gid}-clip)`}>
        <circle cx={innerShift} cy={r * 0.15 - innerShift * 0.4} r={r * 0.7} fill={`url(#${gid}-fluid)`} />
        <circle cx={-innerShift * 0.7} cy={-r * 0.25 + innerShift * 0.3} r={r * 0.45} fill={`url(#${gid}-fluid)`} opacity={0.6} />
        {/* tiny internal bubbles */}
        {[0.2, 0.55, 0.8].map((b, i) => (
          <circle
            key={i}
            cx={Math.sin(t * 0.5 + phase * 9 + i * 2.1) * r * 0.5}
            cy={Math.cos(t * 0.4 + phase * 7 + i * 1.7) * r * 0.5}
            r={r * 0.05 + i}
            fill="rgba(255,255,255,0.35)"
          />
        ))}
      </g>

      {/* melt pitting on the surface */}
      {pit > 0 && (
        <g clipPath={`url(#${gid}-clip)`} opacity={pit * 0.5}>
          {[0.15, 0.4, 0.62, 0.85].map((a, i) => (
            <circle
              key={i}
              cx={Math.cos(a * Math.PI * 2 + phase * 4) * r * 0.6}
              cy={Math.sin(a * Math.PI * 2 + phase * 4) * r * 0.6 + r * 0.2}
              r={r * (0.06 + 0.04 * i)}
              fill={color.c2}
              opacity={0.6}
            />
          ))}
        </g>
      )}

      {/* sweat beads forming on the underside */}
      {pit > 0.3 && (
        <g opacity={clamp01((pit - 0.3) / 0.7)}>
          {[-0.3, 0.05, 0.34].map((dx, i) => (
            <ellipse
              key={i}
              cx={dx * r}
              cy={r * (0.92 + 0.06 * Math.sin(t * 2 + i))}
              rx={r * 0.09}
              ry={r * 0.12}
              fill={color.c1}
              opacity={0.85}
            />
          ))}
        </g>
      )}

      {/* rim light + specular */}
      <circle r={r} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={r * 0.05} strokeDasharray={`${r * 1.4} ${r * 6}`} strokeDashoffset={-rot * 0.4} />
      <ellipse cx={-r * 0.36} cy={-r * 0.42} rx={r * 0.2} ry={r * 0.12} fill="rgba(255,255,255,0.8)" transform={`rotate(${-24})`} />
      <ellipse cx={r * 0.3} cy={r * 0.34} rx={r * 0.1} ry={r * 0.06} fill="rgba(255,255,255,0.28)" />
    </g>
  );
};
