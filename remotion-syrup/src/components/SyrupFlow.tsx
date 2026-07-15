import type React from 'react';
import { SyrupColor } from '../config/breakfast-config';
import { clamp01 } from '../utils/time';

/**
 * SyrupFlow: syrup rolling over a pancake edge — a widening glossy sheet
 * with hanging strands whose lengths grow with progress.
 */
export const SyrupFlow: React.FC<{
  color: SyrupColor;
  /** top edge anchor */
  x: number;
  y: number;
  width: number;
  /** flow progress 0..1 */
  p: number;
  maxDrop?: number;
}> = ({ color, x, y, width, p, maxDrop = 160 }) => {
  if (p <= 0) return null;
  const strands = [0.12, 0.34, 0.52, 0.74, 0.9];
  return (
    <g>
      {/* sheet hugging the edge */}
      <rect x={x} y={y} width={width * clamp01(p * 1.4)} height={10 + p * 8} rx={6} fill={color.c1} opacity={0.9} />
      <rect x={x} y={y} width={width * clamp01(p * 1.4)} height={4} rx={2} fill="rgba(255,255,255,0.4)" />
      {/* hanging strands, staggered */}
      {strands.map((s, i) => {
        const local = clamp01((p - s * 0.5) / 0.5);
        if (local <= 0) return null;
        const sx = x + width * s;
        const len = local * maxDrop * (0.5 + 0.5 * ((i * 37) % 10) / 10);
        const w = 7 - i * 0.8;
        return (
          <g key={i}>
            <path
              d={`M ${sx - w} ${y + 8}
                  C ${sx - w * 0.6} ${y + len * 0.55}, ${sx - w * 0.35} ${y + len * 0.85}, ${sx} ${y + len}
                  C ${sx + w * 0.35} ${y + len * 0.85}, ${sx + w * 0.6} ${y + len * 0.55}, ${sx + w} ${y + 8} Z`}
              fill={color.c1}
              opacity={0.92}
            />
            <circle cx={sx} cy={y + len} r={w * 0.9} fill={color.c1} />
            <circle cx={sx - w * 0.3} cy={y + len - w * 0.4} r={w * 0.28} fill="rgba(255,255,255,0.6)" />
          </g>
        );
      })}
    </g>
  );
};
