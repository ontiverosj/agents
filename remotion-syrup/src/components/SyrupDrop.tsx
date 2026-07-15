import type React from 'react';
import { SyrupColor } from '../config/breakfast-config';
import { clamp01 } from '../utils/time';

export interface SyrupDropProps {
  color: SyrupColor;
  /** origin of the drop (bottom of a planet) */
  x: number;
  y: number;
  /** landing y (pancake surface) */
  landY: number;
  /** drop lifecycle 0..1: 0-0.25 bead grows, 0.25-0.45 strand stretches,
   *  0.45-0.7 falls, 0.7-1 splash + pool spread */
  p: number;
  /** size scale */
  size?: number;
}

/**
 * SyrupDrop: one full drip lifecycle — bead, stretching strand, detach,
 * fall, sticky splash, spreading pool. Everything derives from a single
 * progress value so scenes can sequence and time-warp drops freely.
 */
export const SyrupDrop: React.FC<SyrupDropProps> = ({ color, x, y, landY, p, size = 1 }) => {
  if (p <= 0) return null;
  const bead = clamp01(p / 0.25);
  const strand = clamp01((p - 0.25) / 0.2);
  const fall = clamp01((p - 0.45) / 0.25);
  const splash = clamp01((p - 0.7) / 0.3);

  const beadR = (10 + bead * 14) * size;
  const strandLen = strand * 90 * size;
  // eased fall with slight acceleration
  const fallY = y + strandLen + fall * fall * (landY - y - strandLen);

  return (
    <g>
      {/* stretching strand while attached */}
      {strand > 0 && fall < 1 && (
        <path
          d={`M ${x - 4 * size} ${y}
              C ${x - 3 * size} ${y + strandLen * 0.5}, ${x - 2 * size} ${y + strandLen * 0.8}, ${x - 1.5 * size} ${y + strandLen}
              L ${x + 1.5 * size} ${y + strandLen}
              C ${x + 2 * size} ${y + strandLen * 0.8}, ${x + 3 * size} ${y + strandLen * 0.5}, ${x + 4 * size} ${y}
              Z`}
          fill={color.c1}
          opacity={0.85 * (1 - fall)}
        />
      )}

      {/* the falling bead (teardrop) */}
      {splash < 1 && (
        <g transform={`translate(${x} ${fall > 0 ? fallY : y + strandLen})`} opacity={0.95}>
          <path
            d={`M 0 ${-beadR * 1.3}
                C ${beadR * 0.9} ${-beadR * 0.3}, ${beadR} ${beadR * 0.4}, 0 ${beadR}
                C ${-beadR} ${beadR * 0.4}, ${-beadR * 0.9} ${-beadR * 0.3}, 0 ${-beadR * 1.3} Z`}
            fill={color.c1}
          />
          <ellipse cx={-beadR * 0.3} cy={-beadR * 0.3} rx={beadR * 0.22} ry={beadR * 0.34} fill="rgba(255,255,255,0.7)" />
          <path
            d={`M 0 ${-beadR * 1.3} C ${beadR * 0.5} ${-beadR * 0.6}, ${beadR * 0.6} ${beadR * 0.2}, 0 ${beadR}`}
            fill="none"
            stroke={color.c2}
            strokeWidth={1.4 * size}
            opacity={0.5}
          />
        </g>
      )}

      {/* splash + spreading pool */}
      {splash > 0 && (
        <g transform={`translate(${x} ${landY})`}>
          <ellipse rx={(20 + splash * 60) * size} ry={(6 + splash * 14) * size} fill={color.c1} opacity={0.9} />
          <ellipse rx={(12 + splash * 34) * size} ry={(4 + splash * 8) * size} fill={color.c2} opacity={0.45} />
          <ellipse cx={-8 * size} cy={-2 * size} rx={(6 + splash * 12) * size} ry={(2 + splash * 3) * size} fill="rgba(255,255,255,0.5)" />
          {/* crown droplets right at impact */}
          {splash < 0.45 &&
            [-1, 1].map((s) => (
              <circle
                key={s}
                cx={s * (14 + splash * 40) * size}
                cy={-(10 + splash * 16) * size * (1 - splash)}
                r={3.4 * size * (1 - splash)}
                fill={color.c1}
              />
            ))}
        </g>
      )}
    </g>
  );
};
