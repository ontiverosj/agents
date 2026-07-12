import type React from 'react';
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { RealProductEndCard } from './UgcVariant';

// 62-second ASMR TikTok Shop ad: six whispered 10s beats with the same
// creator at a condenser mic (intro, bottle tapping, cap + rattle,
// tablet close-up, coffee placement, whispered CTA), crossfaded, then
// the real-product end card. 720x1280 @ 24fps.
export const UGC_ASMR_FPS = 24;
export const UGC_ASMR_WIDTH = 720;
export const UGC_ASMR_HEIGHT = 1280;

const XF = 12;
const BEAT_DUR = 240;

const BEATS = [
  'ugc/asmr/b1-intro.mp4',
  'ugc/asmr/b2-tapping.mp4',
  'ugc/asmr/b3-cap-rattle.mp4',
  'ugc/asmr/b4-tablet.mp4',
  'ugc/asmr/b5-coffee.mp4',
  'ugc/asmr/b6-cta.mp4',
];

const starts = BEATS.map((_, i) => i * (BEAT_DUR - XF));
const CARD_DUR = 108;
const CARD_FROM = starts[starts.length - 1] + BEAT_DUR - XF;
export const UGC_ASMR_DURATION = CARD_FROM + CARD_DUR; // 1476 = 61.5s

const Caption: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 10, fps, config: { damping: 16 } });
  const fade = interpolate(frame, [170, 200], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ alignItems: 'center', pointerEvents: 'none', opacity: fade }}>
      <div
        style={{
          marginTop: 140,
          transform: `scale(${pop})`,
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: 18,
          padding: '12px 22px',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 800,
            fontSize: 32,
            textAlign: 'center',
            display: 'block',
          }}
        >
          ASMR: the one-a-day routine
        </span>
      </div>
    </AbsoluteFill>
  );
};

const CrossfadeIn: React.FC<{ children: React.ReactNode; enabled?: boolean }> = ({
  children,
  enabled = true,
}) => {
  const frame = useCurrentFrame();
  const opacity = enabled
    ? interpolate(frame, [0, XF], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const UgcAsmrLong: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {BEATS.map((src, i) => {
        const volume = (f: number) =>
          interpolate(f, [0, XF, BEAT_DUR - XF, BEAT_DUR], [i === 0 ? 1 : 0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
        return (
          <Sequence key={src} from={starts[i]} durationInFrames={BEAT_DUR}>
            <CrossfadeIn enabled={i > 0}>
              <OffthreadVideo
                src={staticFile(src)}
                volume={volume}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </CrossfadeIn>
            {i === 0 ? <Caption /> : null}
          </Sequence>
        );
      })}
      {/* Silent end card — no ambience bed, to keep the ASMR mood */}
      <Sequence from={CARD_FROM} durationInFrames={CARD_DUR}>
        <CrossfadeIn>
          <RealProductEndCard />
        </CrossfadeIn>
      </Sequence>
    </AbsoluteFill>
  );
};
