import type React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

// Scene 2 (~15.5s): maple syrup pours slowly over a stack of fluffy
// pancakes, pools on top, and drips down the sides.
export const PancakesScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Syrup stream: appears, pours for a long beat, then tapers off.
  const streamTip = interpolate(frame, [25, 70], [140, 470], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const streamTop = interpolate(frame, [260, 320], [140, 470], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pouring = frame >= 25 && streamTop < 470;

  // Pool spreads across the top pancake while pouring.
  const pool = interpolate(frame, [60, 300], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Drips slide down the stack edges with staggered delays.
  const drips = [
    { x: 745, delay: 150, len: 200 },
    { x: 1180, delay: 210, len: 240 },
    { x: 900, delay: 290, len: 160 },
  ];

  const zoom = interpolate(frame, [0, 465], [1.02, 1.1]);

  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
      <svg viewBox="0 0 1920 1080" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="pancake" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eebb62" />
            <stop offset="100%" stopColor="#c98f3c" />
          </linearGradient>
          <linearGradient id="syrup" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a55a20" />
            <stop offset="100%" stopColor="#7a3c12" />
          </linearGradient>
        </defs>

        {/* Plate + shadow */}
        <ellipse cx="960" cy="805" rx="480" ry="58" fill="rgba(0,0,0,0.35)" />
        <ellipse cx="960" cy="790" rx="450" ry="52" fill="#efe6d8" />
        <ellipse cx="960" cy="782" rx="400" ry="42" fill="#faf4ea" />

        {/* Pancake stack */}
        {[740, 690, 640, 590, 540].map((cy, i) => (
          <g key={cy}>
            <ellipse cx="960" cy={cy} rx={300 - i * 8} ry="52" fill="url(#pancake)" />
            <ellipse cx="960" cy={cy - 12} rx={300 - i * 8} ry="44" fill={i === 4 ? '#f2c876' : '#e3ac54'} />
          </g>
        ))}

        {/* Syrup pool on top */}
        <ellipse cx="960" cy="522" rx={40 + pool * 215} ry={8 + pool * 30} fill="url(#syrup)" opacity={pool > 0 ? 1 : 0} />
        <ellipse cx="915" cy="512" rx={pool * 90} ry={pool * 9} fill="rgba(255,200,130,0.5)" />

        {/* Syrup drips over the edges */}
        {drips.map((d) => {
          const t = interpolate(frame, [d.delay, d.delay + 90], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return t > 0 ? (
            <g key={d.x}>
              <rect x={d.x - 9} y={530} width="18" height={t * d.len} rx="9" fill="url(#syrup)" />
              <circle cx={d.x} cy={530 + t * d.len} r="11" fill="#7a3c12" />
            </g>
          ) : null;
        })}

        {/* Pouring stream from above */}
        {pouring ? (
          <>
            <rect x="949" y={streamTop} width="22" height={streamTip - streamTop} rx="11" fill="url(#syrup)" />
            <ellipse cx="960" cy={streamTip} rx="30" ry="10" fill="#8a4516" opacity="0.9" />
          </>
        ) : null}

        {/* Butter cube on top, softening */}
        <g transform="translate(960, 495)">
          <rect
            x="-40"
            y={-30 + interpolate(frame, [120, 450], [0, 12], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
            width="80"
            height={54 - interpolate(frame, [120, 450], [0, 14], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
            rx="10"
            fill="#f5d867"
          />
          <rect x="-40" y="-30" width="80" height="20" rx="9" fill="#fae89a" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
