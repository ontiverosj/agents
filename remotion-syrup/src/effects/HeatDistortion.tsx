import type React from 'react';
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { useSeconds } from '../utils/time';

/**
 * HeatDistortion: a restrained rising-heat shimmer. Instead of cartoon
 * smoke, it applies a slow-scrolling turbulence displacement to whatever it
 * wraps. The turbulence seed is fixed; only the displacement scale breathes
 * over time, so output is deterministic.
 */
export const HeatDistortion: React.FC<{
  children: ReactNode;
  /** 0..1 — how strong the shimmer is */
  amount?: number;
  id: string;
}> = ({ children, amount = 0.4, id }) => {
  const { t } = useSeconds();
  const scale = 2 + amount * 4 * (0.6 + 0.4 * Math.sin(t * 1.3));
  return (
    <AbsoluteFill>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id={`heat-${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={scale} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: `url(#heat-${id})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
