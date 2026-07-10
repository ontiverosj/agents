import type React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { Knife } from './Knife';

// Scene 3 (~15.5s): a fresh strawberry is cut into perfect slices that
// fan out beside it, one deliberate cut at a time.
const CUTS = [
  { at: 60, slideX: 240, rot: 8 },
  { at: 150, slideX: 330, rot: 16 },
  { at: 240, slideX: 420, rot: 24 },
];

export const StrawberryScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Knife chops down for each cut, lifting between them.
  const knifeCycle = CUTS.reduce((y, cut) => {
    const t = interpolate(
      frame,
      [cut.at - 35, cut.at, cut.at + 12, cut.at + 40],
      [-480, 130, 130, -480],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    return Math.max(y, t);
  }, -480);

  // Strawberry narrows from the right as slices come off.
  const cutsDone = CUTS.filter((c) => frame >= c.at).length;
  const bodyClip = 1080 - cutsDone * 42;

  const zoom = interpolate(frame, [0, 465], [1, 1.08]);

  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
      <svg viewBox="0 0 1920 1080" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="berry" cx="0.4" cy="0.35" r="0.9">
            <stop offset="0%" stopColor="#e8555f" />
            <stop offset="70%" stopColor="#c92c3a" />
            <stop offset="100%" stopColor="#9e1e2c" />
          </radialGradient>
          <clipPath id="berryClip">
            <rect x="0" y="0" width={bodyClip} height="1080" />
          </clipPath>
        </defs>

        {/* Shadow */}
        <ellipse cx="900" cy="800" rx="380" ry="42" fill="rgba(0,0,0,0.35)" />

        {/* Whole strawberry (clipped narrower as slices come off) */}
        <g clipPath="url(#berryClip)">
          <path
            d="M 880 430 C 1030 430 1100 560 1020 680 C 970 752 920 780 880 795 C 840 780 790 752 740 680 C 660 560 730 430 880 430 Z"
            fill="url(#berry)"
          />
          {/* Seeds */}
          {[
            [820, 520], [900, 505], [960, 560], [790, 600], [870, 615],
            [950, 640], [820, 690], [895, 710], [755, 545],
          ].map(([x, y]) => (
            <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="7" ry="10" fill="#f7d774" opacity="0.85" />
          ))}
          {/* Leaves */}
          <path d="M 880 435 L 820 380 L 862 428 L 845 365 L 882 425 L 912 362 L 898 428 L 950 382 L 895 438 Z" fill="#3f9142" />
          <rect x="872" y="352" width="14" height="46" rx="7" fill="#57a75a" />
          {/* Highlight */}
          <ellipse cx="820" cy="530" rx="52" ry="80" fill="rgba(255,255,255,0.18)" transform="rotate(-18 820 530)" />
        </g>

        {/* Cut faces + slices fanning out to the right */}
        {CUTS.map((cut, i) => {
          const t = interpolate(frame, [cut.at, cut.at + 55], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          if (t <= 0) return null;
          const x = 1040 + t * cut.slideX;
          return (
            <g key={cut.at} transform={`translate(${x}, ${640 - i * 8}) rotate(${t * cut.rot})`}>
              {/* Slice: red rim, pale interior, white core streaks */}
              <ellipse cx="0" cy="0" rx="58" ry="120" fill="#d43a46" />
              <ellipse cx="0" cy="0" rx="46" ry="106" fill="#f2939b" />
              <ellipse cx="0" cy="0" rx="20" ry="66" fill="#fbe3e5" />
              <path d="M 0 -60 L 0 60 M -14 -40 L 14 40 M 14 -40 L -14 40" stroke="#fff" strokeWidth="5" opacity="0.7" strokeLinecap="round" />
            </g>
          );
        })}

        {/* Knife (aligned over the strawberry's right edge) */}
        <g transform={`translate(920, ${knifeCycle + 430}) rotate(10)`}>
          <Knife />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
