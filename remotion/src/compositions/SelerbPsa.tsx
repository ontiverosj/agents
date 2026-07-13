import type React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// Selerb NAD+ copycat-warning PSA: generated creator clip + an end card
// built from the real product marketing photo, so the exact jar and
// label are always shown regardless of how the AI rendered it in-hand.
// 720x1280 @ 24fps.
export const SELERB_PSA_FPS = 24;
export const SELERB_PSA_WIDTH = 720;
export const SELERB_PSA_HEIGHT = 1280;

const CLIP_DUR = 240; // 10s
const CARD_DUR = 120; // 5s
const XF = 12;
export const SELERB_PSA_DURATION = CLIP_DUR + CARD_DUR - XF;

export type SelerbPsaProps = {
  clip: string;
};

const Caption: React.FC = () => {
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
          PSA: watch out for the copycats
        </span>
      </div>
    </AbsoluteFill>
  );
};

// End card: real product photo on a Selerb-blue backdrop with the
// bottom kept clear for the shop button.
const SelerbEndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const jarIn = spring({ frame: frame - 4, fps, config: { damping: 13 } });
  const ctaIn = spring({ frame: frame - 16, fps, config: { damping: 15 } });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse 120% 90% at 50% 30%, #dbeafe 0%, #93b8e8 45%, #1e3a6e 100%)',
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start' }}>
        <Img
          src={staticFile('ugc/selerb-jar.png')}
          style={{
            marginTop: 140,
            height: 640,
            transform: `scale(${jarIn})`,
            filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.35))',
            borderRadius: 24,
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
            maxWidth: 620,
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
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            Only buy from the official Selerb shop — verified badge ✓
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

export const SelerbPsa: React.FC<SelerbPsaProps> = ({ clip }) => {
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
        <Caption />
      </Sequence>
      <Sequence from={CLIP_DUR - XF} durationInFrames={CARD_DUR}>
        <CrossfadeIn>
          <SelerbEndCard />
        </CrossfadeIn>
      </Sequence>
    </AbsoluteFill>
  );
};
