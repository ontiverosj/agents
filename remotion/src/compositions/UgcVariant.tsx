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

// Parameterized short-form TikTok Shop UGC variant: one 10s creator
// clip (chosen via props) + a real-product end card with CTA and
// shop-button space. Render each variant with:
//   npx remotion render UgcVariant out.mp4 --props='{"clip":"ugc/variants/v1.mp4","caption":"..."}'
export const UGC_VARIANT_FPS = 24;
export const UGC_VARIANT_WIDTH = 720;
export const UGC_VARIANT_HEIGHT = 1280;

const CLIP_DUR = 240; // 10s
const CARD_DUR = 108; // 4.5s
const XF = 12;
export const UGC_VARIANT_DURATION = CLIP_DUR + CARD_DUR - XF;

export type UgcVariantProps = {
  clip: string;
  caption: string;
};

const Caption: React.FC<{ text: string }> = ({ text }) => {
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
          {text}
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

// End card built around the real product cutout on a warm backdrop.
const RealProductEndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const bottleIn = spring({ frame: frame - 4, fps, config: { damping: 13 } });
  const ctaIn = spring({ frame: frame - 16, fps, config: { damping: 15 } });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse 120% 90% at 50% 30%, #ffb25e 0%, #f07f1e 45%, #a34d0a 100%)',
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start' }}>
        <Img
          src={staticFile('ugc/product-cutout.png')}
          style={{
            marginTop: 150,
            height: 620,
            transform: `scale(${bottleIn})`,
            filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.35))',
          }}
        />
      </AbsoluteFill>
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
              textShadow: '0 2px 12px rgba(0,0,0,0.45)',
            }}
          >
            Tap the orange cart and make it a One A Day habit <OrangeHeart size={30} />
          </span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: '#000', opacity: fadeOut }} />
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

export const UgcVariant: React.FC<UgcVariantProps> = ({ clip, caption }) => {
  const clipVolume = (f: number) =>
    interpolate(f, [CLIP_DUR - XF, CLIP_DUR], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Sequence durationInFrames={CLIP_DUR}>
        <OffthreadVideo
          src={staticFile(clip)}
          volume={clipVolume}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Caption text={caption} />
      </Sequence>
      <Sequence from={CLIP_DUR - XF} durationInFrames={CARD_DUR}>
        <CrossfadeIn>
          <RealProductEndCard />
        </CrossfadeIn>
        <Audio src={staticFile('audio/ambience.mp3')} volume={0.15} />
      </Sequence>
    </AbsoluteFill>
  );
};
