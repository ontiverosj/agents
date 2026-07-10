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

// TikTok Shop UGC ad: a generated creator clip with an on-screen hook
// caption, followed by a product end card with CTA text and clear
// space in the lower third for the platform's shopping button.
// 720x1280 @ 24fps to match the generated clip.
export const UGC_AD_FPS = 24;
export const UGC_AD_WIDTH = 720;
export const UGC_AD_HEIGHT = 1280;

const CLIP_DUR = 240; // 10s
const CARD_DUR = 132; // 5.5s
const XF = 12;
export const UGC_AD_DURATION = CLIP_DUR + CARD_DUR - XF; // 360 = 15s

// TikTok-style caption: bold white text on a soft dark pill.
const HookCaption: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 10, fps, config: { damping: 14 } });
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

// End card: product close-up with a slow push-in, CTA text, and the
// lower third left clear for TikTok's shopping button.
const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const zoom = 1 + (frame / durationInFrames) * 0.08;
  const ctaIn = spring({ frame: frame - 18, fps, config: { damping: 15 } });
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
      {/* Soft gradient so the CTA reads over the image */}
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
    </AbsoluteFill>
  );
};

const CrossfadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, XF], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const UgcAd: React.FC = () => {
  const clipVolume = (f: number) =>
    interpolate(f, [CLIP_DUR - XF, CLIP_DUR], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Sequence durationInFrames={CLIP_DUR}>
        <OffthreadVideo
          src={staticFile('ugc/ugc-clip.mp4')}
          volume={clipVolume}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <HookCaption />
      </Sequence>
      <Sequence from={CLIP_DUR - XF} durationInFrames={CARD_DUR}>
        <CrossfadeIn>
          <EndCard />
        </CrossfadeIn>
        {/* Quiet ambience so the end card isn't dead silent */}
        <Audio src={staticFile('audio/ambience.mp3')} volume={0.15} />
      </Sequence>
    </AbsoluteFill>
  );
};
