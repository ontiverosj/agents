import type React from 'react';
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';

// Dark wooden table at sunrise: warm planks, a soft golden glow from the
// upper left, and a gentle vignette to keep focus on the food.
export const WoodTable: React.FC<{ children?: ReactNode }> = ({ children }) => {
  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(180deg, #2a1a10 0%, #3a2415 45%, #241408 100%)',
      }}
    >
      {/* Wood planks */}
      <AbsoluteFill
        style={{
          background:
            'repeating-linear-gradient(180deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 118px, rgba(0,0,0,0.35) 120px, rgba(0,0,0,0) 122px)',
        }}
      />
      {/* Subtle grain */}
      <AbsoluteFill
        style={{
          background:
            'repeating-linear-gradient(92deg, rgba(255,255,255,0.015) 0px, rgba(0,0,0,0.02) 3px, rgba(255,255,255,0.01) 6px)',
        }}
      />
      {/* Sunrise glow, upper left */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 1400px 900px at 22% 8%, rgba(255,190,110,0.30) 0%, rgba(255,160,80,0.10) 45%, rgba(0,0,0,0) 70%)',
        }}
      />
      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 1600px 1100px at 50% 55%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
