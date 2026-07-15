import type React from 'react';
import { seededSeries } from '../utils/rand';
import { CONFIG } from '../config/breakfast-config';

/**
 * ParticleBubbles: deterministic rising bubbles inside a rectangular
 * region. Placement, size and speed all come from a named seed stream,
 * so every render is identical.
 */
export const ParticleBubbles: React.FC<{
  t: number;
  x: number;
  y: number;
  width: number;
  height: number;
  count?: number;
  color?: string;
  seedLabel: string;
  /** average rise speed in design px/sec */
  speed?: number;
  maxR?: number;
}> = ({ t, x, y, width, height, count = 14, color = 'rgba(255,255,255,0.55)', seedLabel, speed = 40, maxR = 5 }) => {
  const n = Math.round(count * CONFIG.motion.intensity);
  const rs = seededSeries(seedLabel, n * 3);
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const sx = rs[i * 3];
        const so = rs[i * 3 + 1];
        const sr = rs[i * 3 + 2];
        const cycle = height / (speed * (0.6 + sr * 0.8));
        const local = ((t * (0.6 + sr * 0.8) * speed + so * height) % height) / height;
        const by = y + height - local * height;
        const bx = x + sx * width + Math.sin(t * 1.4 + i) * 4;
        const opacity = Math.sin(local * Math.PI) * 0.9;
        void cycle;
        return <circle key={i} cx={bx} cy={by} r={1.5 + sr * maxR} fill={color} opacity={opacity} />;
      })}
    </g>
  );
};
