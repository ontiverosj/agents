import type React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { FadeTransition } from '../transitions/FadeTransition';

// Cinematic breakfast ASMR montage: a photoreal AI-generated hero clip
// followed by four photoreal macro stills brought to life with slow
// Ken Burns camera moves and crossfades. 62s at 30fps.
//
// Timeline (frames @30fps):
//   0-360     hero video (native audio)
//   360-735   croissant still
//   735-1110  pancakes still
//   1110-1485 strawberry still
//   1485-1860 coffee still
const HERO = 360;
const SHOT = 375;
const XFADE = 25;

type Move = {
  src: string;
  zoom: [number, number];
  pan: [number, number]; // total x/y drift in px at full scale
};

const SHOTS: Move[] = [
  { src: 'stills/croissant.jpg', zoom: [1.05, 1.22], pan: [-40, -18] },
  { src: 'stills/pancakes.jpg', zoom: [1.25, 1.08], pan: [50, 20] },
  { src: 'stills/strawberry.jpg', zoom: [1.06, 1.24], pan: [-45, 22] },
  { src: 'stills/coffee.jpg', zoom: [1.22, 1.06], pan: [40, -20] },
];

// A still photo with a slow push/pull and drift, like a locked-off
// macro shot on a slider.
const KenBurnsShot: React.FC<Move> = ({ src, zoom, pan }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;
  const scale = interpolate(t, [0, 1], zoom);
  const x = interpolate(t, [0, 1], [0, pan[0]]);
  const y = interpolate(t, [0, 1], [0, pan[1]]);
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#120b06' }}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${x}px, ${y}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const BreakfastAsmr: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#120b06' }}>
      {/* Hero: photoreal AI clip with its own ASMR audio */}
      <Sequence durationInFrames={HERO + XFADE}>
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <OffthreadVideo
            src={staticFile('footage/hero-breakfast.mp4')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Four photoreal stills with slow camera moves, crossfaded */}
      {SHOTS.map((shot, i) => {
        const from = HERO + i * SHOT;
        const isLast = i === SHOTS.length - 1;
        return (
          <Sequence key={shot.src} from={from} durationInFrames={SHOT + (isLast ? 0 : XFADE)}>
            <FadeTransition durationInFrames={XFADE}>
              <KenBurnsShot {...shot} />
            </FadeTransition>
          </Sequence>
        );
      })}

      {/* Gentle fade to black at the very end */}
      <Sequence from={HERO + SHOT * 4 - 45}>
        <FadeOutToBlack />
      </Sequence>

      {/* Unifying vignette over everything */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 1700px 1150px at 50% 48%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.42) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

const FadeOutToBlack: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 45], [0, 1], {
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{ backgroundColor: '#000', opacity }} />;
};
