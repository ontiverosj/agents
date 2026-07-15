import type React from 'react';
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { CONFIG } from '../config/breakfast-config';
import { Defocus } from '../effects/DepthOfFieldOverlay';

const { width: DW, height: DH } = CONFIG.design;

/**
 * SvgStage: an SVG canvas in design units that always fills the frame.
 * Everything visual is drawn in 1080x1920 design space; the composition
 * root scales that space to the real output resolution.
 */
export const SvgStage: React.FC<{ children: ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg
    viewBox={`0 0 ${DW} ${DH}`}
    width="100%"
    height="100%"
    style={{ position: 'absolute', inset: 0, display: 'block', ...style }}
    preserveAspectRatio="xMidYMid slice"
  >
    {children}
  </svg>
);

/**
 * KitchenBackdrop: warm breakfast-morning background — window light from
 * the upper left, soft bokeh discs, a wooden/stone table plane. Rendered
 * defocused behind every hero subject.
 */
export const KitchenBackdrop: React.FC<{ tone?: 'warm' | 'cool'; tableY?: number; blur?: number }> = ({
  tone = 'warm',
  tableY = 1180,
  blur = 10,
}) => {
  const warm = tone === 'warm';
  return (
    <Defocus blur={blur}>
      <AbsoluteFill
        style={{
          background: warm
            ? 'linear-gradient(205deg, #ffe9c4 0%, #f6d29b 26%, #caa06a 55%, #7c5a33 100%)'
            : 'linear-gradient(205deg, #eaf6ff 0%, #cfe6f5 30%, #9fc0d8 60%, #5c7a94 100%)',
        }}
      />
      <SvgStage>
        {/* window light shafts */}
        <rect x={-120} y={-100} width={520} height={900} fill={warm ? 'rgba(255,244,214,0.5)' : 'rgba(240,250,255,0.55)'} transform="rotate(18 200 300)" />
        {/* bokeh discs */}
        {[
          [180, 320, 90],
          [420, 180, 60],
          [760, 260, 110],
          [920, 520, 70],
          [640, 420, 46],
        ].map(([bx, by, br], i) => (
          <circle key={i} cx={bx} cy={by} r={br} fill={warm ? 'rgba(255,238,190,0.35)' : 'rgba(214,240,255,0.4)'} />
        ))}
        {/* table plane */}
        <rect x={0} y={tableY} width={CONFIG.design.width} height={CONFIG.design.height - tableY} fill={warm ? 'url(#table-warm)' : 'url(#table-cool)'} />
        <defs>
          <linearGradient id="table-warm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b98a54" />
            <stop offset="100%" stopColor="#6e4a26" />
          </linearGradient>
          <linearGradient id="table-cool" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cdd6dd" />
            <stop offset="100%" stopColor="#8c99a4" />
          </linearGradient>
        </defs>
      </SvgStage>
    </Defocus>
  );
};

/** Layout constants shared by the breakfast scenes */
export const STAGE = {
  stackCx: 540,
  stackTopY: 1120,
  stackRx: 330,
  planetBaseY: 700,
};

/** The six syrup planets: fixed positions, sizes and melt stagger order */
export const PLANETS = CONFIG.syrupPalette.map((color, i) => {
  const xs = [250, 415, 585, 755, 480, 660];
  const ys = [660, 590, 570, 640, 760, 750];
  const rs = [64, 54, 58, 62, 48, 44];
  // pink (index 1) elongates first, then others staggered
  const meltOrder = [2, 0, 3, 1, 4, 5];
  return {
    color,
    x: xs[i],
    y: ys[i],
    r: rs[i],
    phase: (i * 137.5) % 1,
    meltRank: meltOrder[i],
    idSuffix: color.name,
  };
});
