import type React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

/**
 * FilmFinish: the final grade layer applied over every scene — a warm
 * highlight wash, a gentle vignette and fine animated grain. The grain's
 * turbulence seed derives from the frame number, so it is deterministic
 * per frame while still "boiling" like film.
 */
export const FilmFinish: React.FC<{ grain?: number; vignette?: number }> = ({
  grain = 0.035,
  vignette = 0.32,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* warm grade */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(200deg, rgba(255,214,150,0.10) 0%, rgba(255,255,255,0) 40%, rgba(70,40,110,0.06) 100%)',
          mixBlendMode: 'soft-light',
        }}
      />
      {/* vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 120% 105% at 50% 46%, rgba(0,0,0,0) 58%, rgba(10,6,2,${vignette}) 100%)`,
        }}
      />
      {/* animated fine grain */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: grain }}>
        <filter id="film-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed={(frame % 600) + 1}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#film-grain)" />
      </svg>
    </AbsoluteFill>
  );
};
