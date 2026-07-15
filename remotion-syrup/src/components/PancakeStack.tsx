import type React from 'react';
import { CONFIG } from '../config/breakfast-config';
import { seededSeries } from '../utils/rand';

// Layered 2.5D pancake / French-toast stack, drawn in SVG design units.
// Replaceable with a photographic asset (see public/assets/README.md).

const PORES = seededSeries('pancake-pores', 60);

export interface PancakeStackProps {
  /** center x in design units */
  cx: number;
  /** y of the TOP surface center */
  topY: number;
  /** stack half-width */
  rx: number;
  /** how much glossy syrup coats the top (0..1) */
  glaze?: number;
  /** colors currently pooled on top (subset of the syrup palette) */
  glazeColors?: string[];
}

export const PancakeStack: React.FC<PancakeStackProps> = ({
  cx,
  topY,
  rx,
  glaze = 0,
  glazeColors = [],
}) => {
  const frenchToast = CONFIG.base === 'frenchToast';
  const bodyTop = frenchToast ? '#e9c27a' : '#eab766';
  const bodyBottom = frenchToast ? '#b57f33' : '#c08a3c';
  const rim = frenchToast ? '#8a5a1d' : '#9a6524';
  const layerH = 66;
  const layers = 4;
  const ry = rx * 0.24;

  return (
    <g>
      {/* plate + shadow */}
      <ellipse cx={cx} cy={topY + layers * layerH + 66} rx={rx * 1.5} ry={ry * 1.7} fill="rgba(30,16,4,0.38)" />
      <ellipse cx={cx} cy={topY + layers * layerH + 52} rx={rx * 1.42} ry={ry * 1.55} fill="#efe7da" />
      <ellipse cx={cx} cy={topY + layers * layerH + 44} rx={rx * 1.26} ry={ry * 1.35} fill="#faf5ec" />

      {/* stack body, bottom to top */}
      {Array.from({ length: layers }).map((_, i) => {
        const y = topY + (layers - 1 - i) * layerH;
        return (
          <g key={i}>
            <rect x={cx - rx} y={y} width={rx * 2} height={layerH} fill={`url(#pancake-side)`} />
            <ellipse cx={cx} cy={y + layerH} rx={rx} ry={ry} fill={rim} />
            <ellipse cx={cx} cy={y} rx={rx} ry={ry} fill={i === layers - 1 ? bodyTop : bodyBottom} />
          </g>
        );
      })}

      {/* golden edge highlights */}
      <ellipse cx={cx} cy={topY} rx={rx} ry={ry} fill="url(#pancake-top)" />
      {/* pores on the top surface */}
      {PORES.slice(0, 30).map((r, i) => {
        const a = PORES[i + 30] * Math.PI * 2;
        const rr = Math.sqrt(r) * 0.85;
        const px = cx + Math.cos(a) * rx * rr;
        const py = topY + Math.sin(a) * ry * rr;
        return <circle key={i} cx={px} cy={py} r={1.6 + r * 2.4} fill="rgba(122,74,18,0.35)" />;
      })}

      {/* glossy glaze pool on top */}
      {glaze > 0 && (
        <g opacity={Math.min(1, glaze * 1.2)}>
          {glazeColors.map((c, i) => {
            const spread = glaze * (0.55 + 0.45 * ((i + 1) / Math.max(1, glazeColors.length)));
            return (
              <ellipse
                key={c + i}
                cx={cx + (i - (glazeColors.length - 1) / 2) * 26 * (1 - glaze * 0.6)}
                cy={topY}
                rx={rx * 0.92 * spread}
                ry={ry * 0.9 * spread}
                fill={c}
                opacity={0.55}
              />
            );
          })}
          <ellipse cx={cx - rx * 0.25} cy={topY - ry * 0.2} rx={rx * 0.4 * glaze} ry={ry * 0.3 * glaze} fill="rgba(255,255,255,0.35)" />
        </g>
      )}

      <defs>
        <linearGradient id="pancake-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bodyBottom} />
          <stop offset="55%" stopColor={frenchToast ? '#caa059' : '#d9a656'} />
          <stop offset="100%" stopColor={rim} />
        </linearGradient>
        <radialGradient id="pancake-top" cx="0.42" cy="0.38" r="0.8">
          <stop offset="0%" stopColor={frenchToast ? '#f4dba2' : '#f4cf8b'} />
          <stop offset="70%" stopColor={bodyTop} />
          <stop offset="100%" stopColor={frenchToast ? '#c08b3e' : '#c9953f'} />
        </radialGradient>
      </defs>
    </g>
  );
};
