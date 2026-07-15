import type React from 'react';
import { seededSeries } from '../utils/rand';
import { clamp01 } from '../utils/time';

/**
 * Condensation: seeded static droplets over a region, plus one hero
 * droplet that slides down when `slideP` goes 0 -> 1.
 */
export const Condensation: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  seedLabel: string;
  count?: number;
  /** overall visibility 0..1 (droplets "form" as this rises) */
  amount?: number;
  /** progress of the single sliding hero droplet */
  slideP?: number;
  tint?: string;
}> = ({ x, y, width, height, seedLabel, count = 26, amount = 1, slideP = 0, tint = 'rgba(230,247,255,0.75)' }) => {
  const rs = seededSeries(seedLabel, count * 3);
  const visible = Math.round(count * clamp01(amount));
  const slideX = x + width * 0.32;
  const slideY = y + height * 0.15 + clamp01(slideP) * height * 0.7;
  return (
    <g>
      {Array.from({ length: visible }).map((_, i) => {
        const dx = rs[i * 3];
        const dy = rs[i * 3 + 1];
        const dr = rs[i * 3 + 2];
        return (
          <g key={i} opacity={0.5 + dr * 0.5}>
            <ellipse cx={x + dx * width} cy={y + dy * height} rx={1.2 + dr * 3.4} ry={1.6 + dr * 4.2} fill={tint} />
            <ellipse cx={x + dx * width - 0.8} cy={y + dy * height - 1} rx={0.7 + dr * 1.2} ry={0.9 + dr * 1.4} fill="rgba(255,255,255,0.85)" />
          </g>
        );
      })}
      {slideP > 0 && slideP < 1 && (
        <g>
          <rect x={slideX - 1.4} y={y + height * 0.15} width={2.8} height={slideY - (y + height * 0.15)} rx={1.4} fill={tint} opacity={0.5} />
          <ellipse cx={slideX} cy={slideY} rx={3.4} ry={4.6} fill={tint} />
          <ellipse cx={slideX - 1} cy={slideY - 1.4} rx={1.1} ry={1.5} fill="rgba(255,255,255,0.9)" />
        </g>
      )}
    </g>
  );
};
