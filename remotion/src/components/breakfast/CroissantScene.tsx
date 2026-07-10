import type React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Knife } from './Knife';

// Scene 1 (~15.5s): a golden croissant is sliced open in slow motion,
// halves part, and a pat of warm butter drops on and slowly melts
// across the flaky layers.
export const CroissantScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Knife descends slowly, rests in the cut, then lifts away.
  const knifeY = interpolate(frame, [30, 120, 150, 200], [-450, 165, 165, -500], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cutDone = frame >= 120;

  // Halves drift apart after the cut.
  const gap = spring({ frame: frame - 130, fps, config: { damping: 30, mass: 2.2 } }) * 55;

  // Butter drops in, then melts (flattens and spreads) very slowly.
  const butterDrop = spring({ frame: frame - 210, fps, config: { damping: 14 } });
  const butterY = interpolate(butterDrop, [0, 1], [-420, 0]);
  const melt = interpolate(frame, [240, 450], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const butterScaleY = 1 - melt * 0.65;
  const butterScaleX = 1 + melt * 0.85;

  // Slow push-in for the tracking-shot feel.
  const zoom = interpolate(frame, [0, 465], [1, 1.09]);

  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
      <svg viewBox="0 0 1920 1080" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="croissant" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8b45a" />
            <stop offset="55%" stopColor="#d1913a" />
            <stop offset="100%" stopColor="#a5641e" />
          </linearGradient>
          <clipPath id="leftHalf">
            <rect x="0" y="0" width="960" height="1080" />
          </clipPath>
          <clipPath id="rightHalf">
            <rect x="960" y="0" width="960" height="1080" />
          </clipPath>
        </defs>

        {/* Shadow on the table */}
        <ellipse cx="960" cy="770" rx={400 + gap} ry="46" fill="rgba(0,0,0,0.35)" />

        {/* Left half */}
        <g clipPath="url(#leftHalf)" transform={`translate(${-gap}, 0)`}>
          <CroissantBody />
        </g>
        {/* Right half */}
        <g clipPath="url(#rightHalf)" transform={`translate(${gap}, 0)`}>
          <CroissantBody />
        </g>

        {/* Cut faces revealed between the halves */}
        {cutDone ? (
          <>
            <ellipse cx={958 - gap} cy="615" rx="14" ry="115" fill="#f3ddb0" />
            <ellipse cx={962 + gap} cy="615" rx="14" ry="115" fill="#eed3a0" />
          </>
        ) : null}

        {/* Crumbs scatter when the knife lands */}
        {cutDone
          ? [0, 1, 2, 3, 4, 5].map((i) => {
              const t = Math.min((frame - 120) / 70, 1);
              const dx = (i - 2.5) * 36 * t;
              const dy = 90 * t + 30 * t * t;
              const o = 1 - t;
              return (
                <circle
                  key={i}
                  cx={960 + dx}
                  cy={700 + dy}
                  r={5 - (i % 3)}
                  fill="#d1913a"
                  opacity={o}
                />
              );
            })
          : null}

        {/* Butter pat, melting */}
        {frame >= 210 ? (
          <g transform={`translate(960, ${470 + butterY})`}>
            <g transform={`scale(${butterScaleX}, ${butterScaleY})`}>
              <rect x="-52" y="-34" width="104" height="68" rx="14" fill="#f5d867" />
              <rect x="-52" y="-34" width="104" height="26" rx="12" fill="#fae89a" />
            </g>
            {/* Melted sheen spreading over the layers */}
            <ellipse cx="0" cy="30" rx={70 + melt * 150} ry={10 + melt * 9} fill="rgba(250,222,120,0.45)" />
          </g>
        ) : null}

        {/* Knife */}
        <g transform={`translate(830, ${knifeY + 380}) rotate(12)`}>
          <Knife />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const CroissantBody: React.FC = () => (
  <g>
    {/* Tips */}
    <ellipse cx="640" cy="660" rx="72" ry="52" fill="url(#croissant)" transform="rotate(38 640 660)" />
    <ellipse cx="1280" cy="660" rx="72" ry="52" fill="url(#croissant)" transform="rotate(-38 1280 660)" />
    {/* Side lobes */}
    <ellipse cx="780" cy="625" rx="125" ry="95" fill="url(#croissant)" transform="rotate(18 780 625)" />
    <ellipse cx="1140" cy="625" rx="125" ry="95" fill="url(#croissant)" transform="rotate(-18 1140 625)" />
    {/* Body */}
    <ellipse cx="960" cy="605" rx="185" ry="130" fill="url(#croissant)" />
    {/* Flaky layer lines */}
    <path d="M 855 505 C 830 570, 830 650, 862 715" stroke="#a5641e" strokeWidth="7" fill="none" opacity="0.55" strokeLinecap="round" />
    <path d="M 1065 505 C 1090 570, 1090 650, 1058 715" stroke="#a5641e" strokeWidth="7" fill="none" opacity="0.55" strokeLinecap="round" />
    <path d="M 700 570 C 685 615, 690 665, 715 700" stroke="#a5641e" strokeWidth="6" fill="none" opacity="0.45" strokeLinecap="round" />
    <path d="M 1220 570 C 1235 615, 1230 665, 1205 700" stroke="#a5641e" strokeWidth="6" fill="none" opacity="0.45" strokeLinecap="round" />
    {/* Top sheen */}
    <ellipse cx="930" cy="540" rx="110" ry="38" fill="rgba(255,235,180,0.35)" />
  </g>
);
