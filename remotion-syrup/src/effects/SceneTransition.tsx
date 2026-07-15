import type React from 'react';
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { useSeconds, prog } from '../utils/time';

/**
 * FadeIn: standard scene entrance used at every scene boundary. The
 * incoming scene sits on top of the outgoing scene during the overlap and
 * fades in, producing a soft crossfade with zero black frames.
 */
export const FadeIn: React.FC<{ children: ReactNode; durationSec: number; enabled?: boolean }> = ({
  children,
  durationSec,
  enabled = true,
}) => {
  const { t } = useSeconds();
  const opacity = enabled ? prog(t, 0, durationSec) : 1;
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/**
 * RippleReveal: the blue-ripple match cut between the syrup glaze and the
 * blue lemon. The incoming scene is revealed inside an expanding circle
 * whose position matches the expanding blue syrup ripple in the outgoing
 * scene — creating the "ripple becomes lemon" moment.
 */
export const RippleReveal: React.FC<{
  children: ReactNode;
  durationSec: number;
  centerX?: string;
  centerY?: string;
}> = ({ children, durationSec, centerX = '50%', centerY = '46%' }) => {
  const { t } = useSeconds();
  const p = prog(t, 0, durationSec);
  const e = p * p * (3 - 2 * p);
  const radius = 6 + e * 130; // percent of the larger dimension
  return (
    <AbsoluteFill
      style={{
        clipPath: `circle(${radius}% at ${centerX} ${centerY})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
