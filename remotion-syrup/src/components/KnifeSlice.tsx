import type React from 'react';

/**
 * ChefKnife: a clean chef's knife drawn tip-left. Positioned/animated by
 * the parent transform; the blade edge sits on the group's baseline (y=0).
 */
export const ChefKnife: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <g transform={`scale(${scale})`}>
    <defs>
      <linearGradient id="knife-steel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f2f5f8" />
        <stop offset="55%" stopColor="#c3ccd4" />
        <stop offset="100%" stopColor="#96a0aa" />
      </linearGradient>
    </defs>
    {/* blade: broad chef profile, edge at y=0 */}
    <path
      d="M 0 0 L 300 -86 L 300 -16 C 210 6, 90 8, 16 4 Z"
      fill="url(#knife-steel)"
      stroke="#7d8791"
      strokeWidth="2"
    />
    {/* spine highlight */}
    <path d="M 34 -12 L 292 -80" stroke="rgba(255,255,255,0.8)" strokeWidth="3" strokeLinecap="round" opacity={0.7} />
    {/* bolster + handle */}
    <rect x={296} y={-92} width={18} height={82} rx={6} fill="#4a5560" />
    <rect x={310} y={-86} width={126} height={62} rx={22} fill="#2c1d12" />
    <circle cx={348} cy={-55} r={5} fill="#9a8570" />
    <circle cx={392} cy={-55} r={5} fill="#9a8570" />
  </g>
);

/** Juice beads that collect along the blade edge / board after the cut */
export const JuiceBeads: React.FC<{ points: Array<[number, number]>; color: string; opacity?: number }> = ({
  points,
  color,
  opacity = 1,
}) => (
  <g opacity={opacity}>
    {points.map(([x, y], i) => (
      <g key={i}>
        <ellipse cx={x} cy={y} rx={4 + (i % 3)} ry={3 + (i % 2)} fill={color} opacity={0.85} />
        <ellipse cx={x - 1.2} cy={y - 1} rx={1.2} ry={0.9} fill="rgba(255,255,255,0.8)" />
      </g>
    ))}
  </g>
);
