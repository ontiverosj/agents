import type React from 'react';
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { CONFIG } from '../config/breakfast-config';
import { useSeconds, prog } from '../utils/time';

export interface MacroCameraProps {
  children: ReactNode;
  /** local seconds over which the move completes (defaults to scene length passed here) */
  durationSec: number;
  /** scale at t=0 (1 = 100%) */
  pushFrom?: number;
  /** scale at t=durationSec */
  pushTo?: number;
  /** total left-to-right arc drift, design px (positive = rightward) */
  arcPx?: number;
  /** total vertical drift, design px */
  driftYPx?: number;
  /** simulated orbit, degrees of rotation across the move */
  orbitDeg?: number;
  /** handheld micro movement amplitude multiplier (1 = CONFIG default) */
  handheld?: number;
  /** optional deterministic time offset so scenes don't share phase */
  phase?: number;
}

/**
 * MacroCamera wraps a scene stage and applies slow, deterministic camera
 * language: push-ins, lateral arcs, tiny orbits and sub-pixel handheld
 * micro-movement. All moves are seconds-driven so they are identical at
 * 30 and 60 fps.
 */
export const MacroCamera: React.FC<MacroCameraProps> = ({
  children,
  durationSec,
  pushFrom = 1,
  pushTo = 1,
  arcPx = 0,
  driftYPx = 0,
  orbitDeg = 0,
  handheld = 1,
  phase = 0,
}) => {
  const { t } = useSeconds();
  const k = CONFIG.camera.intensity;
  const p = prog(t, 0, durationSec);
  // ease the master move very gently (slow in/out)
  const e = p * p * (3 - 2 * p);

  const scale = pushFrom + (pushTo - pushFrom) * e * k + (1 - k) * 0;
  const x = arcPx * (e - 0.5) * k;
  const y = driftYPx * e * k;
  const rot = orbitDeg * (e - 0.5) * k;

  // Sub-pixel handheld micro movement (never exceeds CONFIG.camera.handheldPx
  // in design units).
  const amp = CONFIG.camera.handheldPx * handheld;
  const hx = amp * (Math.sin(t * 1.9 + phase) * 0.6 + Math.sin(t * 3.7 + phase * 2.3) * 0.4);
  const hy = amp * (Math.cos(t * 1.4 + phase * 1.7) * 0.6 + Math.sin(t * 2.9 + phase) * 0.4);

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x + hx}px, ${y + hy}px) rotate(${rot}deg) scale(${scale})`,
        transformOrigin: '50% 55%',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
