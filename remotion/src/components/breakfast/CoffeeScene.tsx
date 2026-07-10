import type React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

// Scene 4 (~15.5s): hot coffee fills a clear glass cup; steam curls up
// and small bubbles shimmer on the surface.
export const CoffeeScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Coffee level rises while pouring.
  const fill = interpolate(frame, [30, 240], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const level = 790 - fill * 300; // surface y: 790 (empty) -> 490 (full)
  const pouring = frame >= 25 && frame <= 235;

  const zoom = interpolate(frame, [0, 465], [1.02, 1.1]);

  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
      <svg viewBox="0 0 1920 1080" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="coffee" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a3419" />
            <stop offset="100%" stopColor="#2e1a0c" />
          </linearGradient>
          <clipPath id="glassClip">
            <rect x="822" y="416" width="276" height="390" rx="26" />
          </clipPath>
        </defs>

        {/* Shadow */}
        <ellipse cx="960" cy="830" rx="260" ry="36" fill="rgba(0,0,0,0.4)" />

        {/* Coffee inside the glass */}
        <g clipPath="url(#glassClip)">
          <rect x="822" y={level} width="276" height={810 - level} fill="url(#coffee)" />
          {/* Crema on the surface */}
          <ellipse cx="960" cy={level} rx="138" ry="14" fill="#a9743f" opacity={fill > 0.02 ? 0.9 : 0} />
          {/* Bubbles drifting on the surface */}
          {fill > 0.1
            ? [0, 1, 2, 3].map((i) => {
                const wob = Math.sin(frame / 14 + i * 1.7) * 30;
                return (
                  <circle
                    key={i}
                    cx={900 + i * 40 + wob}
                    cy={level - 2}
                    r={5 + (i % 2) * 3}
                    fill="#c89058"
                    opacity="0.7"
                  />
                );
              })
            : null}
        </g>

        {/* Pouring stream */}
        {pouring ? (
          <>
            <rect x="948" y="150" width="24" height={level - 150} rx="12" fill="url(#coffee)" />
            <ellipse cx="960" cy={level} rx="34" ry="12" fill="#4a2a12" opacity="0.9" />
          </>
        ) : null}

        {/* Clear glass cup (drawn over the coffee) */}
        <rect x="816" y="410" width="288" height="402" rx="30" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.55)" strokeWidth="7" />
        {/* Glass highlight */}
        <rect x="846" y="440" width="26" height="330" rx="13" fill="rgba(255,255,255,0.22)" />
        {/* Handle */}
        <path d="M 1104 500 C 1210 500, 1210 700, 1104 700" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="16" strokeLinecap="round" />

        {/* Steam wisps once the cup is warming */}
        {frame >= 90
          ? [0, 1, 2].map((i) => {
              const cycle = 130;
              const t = ((frame - 90 + i * 45) % cycle) / cycle;
              const rise = t * 230;
              const opacity = Math.sin(t * Math.PI) * 0.4;
              const sway = Math.sin(frame / 22 + i * 2.1) * 14;
              return (
                <path
                  key={i}
                  d="M 0 0 C -22 -45, 22 -85, 0 -130 C -22 -175, 22 -215, 0 -250"
                  transform={`translate(${895 + i * 62 + sway}, ${level - 16 - rise})`}
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="13"
                  strokeLinecap="round"
                  fill="none"
                  opacity={opacity}
                />
              );
            })
          : null}
      </svg>
    </AbsoluteFill>
  );
};
