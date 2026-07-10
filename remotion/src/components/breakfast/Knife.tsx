import type React from 'react';

// Simple chef's knife, blade pointing down-left. Position and animate via
// the parent <g transform>.
export const Knife: React.FC = () => {
  return (
    <g>
      <defs>
        <linearGradient id="blade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8ecf0" />
          <stop offset="55%" stopColor="#b7bfc7" />
          <stop offset="100%" stopColor="#8d959d" />
        </linearGradient>
      </defs>
      {/* Blade */}
      <path
        d="M 0 60 L 250 0 L 250 44 C 180 74, 80 78, 18 72 Z"
        fill="url(#blade)"
        stroke="#77808a"
        strokeWidth="2"
      />
      {/* Handle */}
      <rect x="246" y="-4" width="130" height="52" rx="20" fill="#3d2a1c" />
      <circle cx="290" cy="22" r="5" fill="#93826f" />
      <circle cx="330" cy="22" r="5" fill="#93826f" />
    </g>
  );
};
