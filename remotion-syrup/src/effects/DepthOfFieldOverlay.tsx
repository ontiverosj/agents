import type React from 'react';
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { CONFIG } from '../config/breakfast-config';

/**
 * Defocus wraps a non-hero layer in a real gaussian blur. Use it on
 * background and foreground layers while the hero subject stays sharp —
 * the whole frame must never be soft.
 */
export const Defocus: React.FC<{ blur: number; children: ReactNode; opacity?: number }> = ({
  blur,
  children,
  opacity = 1,
}) => (
  <AbsoluteFill
    style={{
      filter: `blur(${blur * CONFIG.depthOfField.intensity}px)`,
      opacity,
    }}
  >
    {children}
  </AbsoluteFill>
);

/**
 * DepthOfFieldOverlay adds the shallow-focus "field" feel on top of a scene:
 * softly darkened, defocused top and bottom bands that read as out-of-focus
 * foreground/background without blurring the hero.
 */
export const DepthOfFieldOverlay: React.FC<{ strength?: number }> = ({ strength = 1 }) => {
  const s = strength * CONFIG.depthOfField.intensity;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(40,26,12,${0.28 * s}) 0%, rgba(40,26,12,0) 18%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(0deg, rgba(30,18,8,${0.34 * s}) 0%, rgba(30,18,8,0) 22%)`,
        }}
      />
    </AbsoluteFill>
  );
};
