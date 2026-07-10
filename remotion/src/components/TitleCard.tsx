import type React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { TitleCardProps } from '../types';

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  color = '#ffffff',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 200 } });
  const subtitleOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        fontFamily: 'Helvetica, Arial, sans-serif',
      }}
    >
      <h1
        style={{
          color,
          fontSize: 100,
          margin: 0,
          transform: `scale(${scale})`,
        }}
      >
        {title}
      </h1>
      {subtitle ? (
        <h2
          style={{
            color,
            fontSize: 40,
            fontWeight: 400,
            marginTop: 24,
            opacity: subtitleOpacity,
          }}
        >
          {subtitle}
        </h2>
      ) : null}
    </div>
  );
};
