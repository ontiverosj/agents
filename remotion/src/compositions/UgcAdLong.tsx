import type React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// Full-length TikTok Shop UGC ad following the 8-beat script: hook,
// relatable problem, product intro, product demo, lifestyle, social
// proof, routine b-roll, and spoken CTA — one generated clip per beat
// with the same creator throughout, plus a product end card leaving
// space for the shop button. 720x1280 @ 24fps.
export const UGC_LONG_FPS = 24;
export const UGC_LONG_WIDTH = 720;
export const UGC_LONG_HEIGHT = 1280;

const XF = 12; // 0.5s crossfade

const BEATS = [
  { src: 'ugc/long/beat1-hook.mp4', durationInFrames: 192 },
  { src: 'ugc/long/beat2-problem.mp4', durationInFrames: 240 },
  { src: 'ugc/long/beat3-introduce.mp4', durationInFrames: 240 },
  { src: 'ugc/long/beat4-show.mp4', durationInFrames: 240 },
  { src: 'ugc/long/beat5-lifestyle.mp4', durationInFrames: 240 },
  { src: 'ugc/long/beat6-social.mp4', durationInFrames: 240 },
  { src: 'ugc/long/beat7-routine.mp4', durationInFrames: 240 },
  { src: 'ugc/long/beat8-cta.mp4', durationInFrames: 240 },
];

const starts = BEATS.reduce<number[]>((acc, _, i) => {
  if (i === 0) return [0];
  return [...acc, acc[i - 1] + BEATS[i - 1].durationInFrames - XF];
}, []);

const CARD_DUR = 108; // 4.5s end card
const CARD_FROM = starts[starts.length - 1] + BEATS[BEATS.length - 1].durationInFrames - XF;
export const UGC_LONG_DURATION = CARD_FROM + CARD_DUR;

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

// TikTok-style caption shown during the hook.
const HookCaption: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 8, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ alignItems: 'center', pointerEvents: 'none' }}>
      <div
        style={{
          marginTop: 140,
          transform: `scale(${pop})`,
          backgroundColor: 'rgba(0,0,0,0.55)',
          borderRadius: 18,
          padding: '14px 22px',
          maxWidth: 560,
        }}
      >
        <span
          style={{
            color: '#fff',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 800,
            fontSize: 34,
            lineHeight: 1.25,
            textAlign: 'center',
            display: 'block',
          }}
        >
          The vitamin I actually remember to take
        </span>
      </div>
    </AbsoluteFill>
  );
};

const OrangeHeart: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ verticalAlign: '-2px' }}>
    <path
      d="M12 21s-7.5-4.9-10-9.5C.5 8 2 4.5 5.5 4.5c2 0 3.4 1.1 4.2 2.4L12 9l2.3-2.1c.8-1.3 2.2-2.4 4.2-2.4C22 4.5 23.5 8 22 11.5 19.5 16.1 12 21 12 21z"
      fill="#ff7a1a"
    />
  </svg>
);

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const zoom = 1 + (frame / durationInFrames) * 0.08;
  const ctaIn = spring({ frame: frame - 14, fps, config: { damping: 15 } });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ backgroundColor: '#0e0a06', overflow: 'hidden' }}>
      <Img
        src={staticFile('ugc/endcard.jpg')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${zoom})`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 78%, rgba(0,0,0,0.65) 100%)',
        }}
      />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
        <div
          style={{
            transform: `translateY(${(1 - ctaIn) * 40}px)`,
            opacity: ctaIn,
            textAlign: 'center',
            // Keep the bottom ~220px clear for the shop button.
            marginBottom: 240,
            maxWidth: 600,
            padding: '0 30px',
          }}
        >
          <span
            style={{
              color: '#fff',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 800,
              fontSize: 34,
              lineHeight: 1.3,
              textShadow: '0 2px 12px rgba(0,0,0,0.6)',
            }}
          >
            Tap the orange cart and add these to your morning routine <OrangeHeart size={30} />
          </span>
        </div>
      </AbsoluteFill>
      {/* Final fade to black */}
      <AbsoluteFill style={{ backgroundColor: '#000', opacity: fadeOut }} />
    </AbsoluteFill>
  );
};

export const UgcAdLong: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {BEATS.map((beat, i) => {
        const { durationInFrames } = beat;
        const volume = (f: number) =>
          interpolate(
            f,
            [0, XF, durationInFrames - XF, durationInFrames],
            [i === 0 ? 1 : 0, 1, 1, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
        return (
          <Sequence key={beat.src} from={starts[i]} durationInFrames={durationInFrames}>
            <CrossfadeIn enabled={i > 0}>
              <OffthreadVideo
                src={staticFile(beat.src)}
                volume={volume}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </CrossfadeIn>
            {i === 0 ? <HookCaption /> : null}
          </Sequence>
        );
      })}
      <Sequence from={CARD_FROM} durationInFrames={CARD_DUR}>
        <CrossfadeIn>
          <EndCard />
        </CrossfadeIn>
        <Audio src={staticFile('audio/ambience.mp3')} volume={0.15} />
      </Sequence>
    </AbsoluteFill>
  );
};
