import type React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { FadeTransitionProps } from '../types';

// Fades children in from the start of the sequence, or out toward its end.
export const FadeTransition: React.FC<FadeTransitionProps> = ({
  children,
  durationInFrames = 15,
  direction = 'in',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: totalDuration } = useVideoConfig();

  const opacity =
    direction === 'in'
      ? interpolate(frame, [0, durationInFrames], [0, 1], {
          extrapolateRight: 'clamp',
        })
      : interpolate(
          frame,
          [totalDuration - durationInFrames, totalDuration],
          [1, 0],
          { extrapolateLeft: 'clamp' }
        );

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
