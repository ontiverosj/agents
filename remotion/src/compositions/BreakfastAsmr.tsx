import type React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { FadeTransition } from '../transitions/FadeTransition';

// Cinematic breakfast ASMR montage in two aspect ratios.
//
// 16:9 (BreakfastAsmr): photoreal AI hero clip (native audio) + four
// photoreal macro stills with Ken Burns moves and ElevenLabs foley.
// 9:16 (BreakfastAsmrVertical): five vertical stills, fully scored.
// Both 62s at 30fps (1860 frames).
const XFADE = 25;

type Shot = {
  src: string;
  audio?: string;
  zoom: [number, number];
  pan: [number, number]; // total x/y drift in px
};

const SHOTS_WIDE: Shot[] = [
  { src: 'stills/croissant.jpg', audio: 'audio/croissant.mp3', zoom: [1.05, 1.22], pan: [-40, -18] },
  { src: 'stills/pancakes.jpg', audio: 'audio/syrup.mp3', zoom: [1.25, 1.08], pan: [50, 20] },
  { src: 'stills/strawberry.jpg', audio: 'audio/strawberry.mp3', zoom: [1.06, 1.24], pan: [-45, 22] },
  { src: 'stills/coffee.jpg', audio: 'audio/coffee.mp3', zoom: [1.22, 1.06], pan: [40, -20] },
];

const SHOTS_VERTICAL: Shot[] = [
  { src: 'stills-vertical/spread.jpg', audio: 'audio/kitchen.mp3', zoom: [1.04, 1.2], pan: [-20, -35] },
  { src: 'stills-vertical/croissant.jpg', audio: 'audio/croissant.mp3', zoom: [1.05, 1.22], pan: [18, -40] },
  { src: 'stills-vertical/pancakes.jpg', audio: 'audio/syrup.mp3', zoom: [1.24, 1.06], pan: [-16, 45] },
  { src: 'stills-vertical/strawberry.jpg', audio: 'audio/strawberry.mp3', zoom: [1.06, 1.24], pan: [20, 40] },
  { src: 'stills-vertical/coffee.jpg', audio: 'audio/coffee.mp3', zoom: [1.22, 1.05], pan: [-18, -38] },
];

// A still photo with a slow push/pull and drift, like a locked-off
// macro shot on a slider.
const KenBurnsShot: React.FC<Shot> = ({ src, zoom, pan }) => {
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

const FadeOutToBlack: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 45], [0, 1], {
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{ backgroundColor: '#000', opacity }} />;
};

type MontageProps = {
  hero?: { src: string; durationInFrames: number };
  shots: Shot[];
  shotDuration: number;
};

const Montage: React.FC<MontageProps> = ({ hero, shots, shotDuration }) => {
  const heroDur = hero ? hero.durationInFrames : 0;
  const total = heroDur + shots.length * shotDuration;

  // Foley fades in quickly, holds, and fades out before the next shot.
  const cueVolume = (f: number) =>
    interpolate(f, [0, 15, shotDuration - 30, shotDuration], [0, 0.9, 0.9, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  return (
    <AbsoluteFill style={{ backgroundColor: '#120b06' }}>
      {hero ? (
        <Sequence durationInFrames={heroDur + XFADE}>
          <AbsoluteFill style={{ overflow: 'hidden' }}>
            <OffthreadVideo
              src={staticFile(hero.src)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </AbsoluteFill>
        </Sequence>
      ) : null}

      {shots.map((shot, i) => {
        const from = heroDur + i * shotDuration;
        const isLast = i === shots.length - 1;
        const isFirst = i === 0 && !hero;
        return (
          <Sequence key={shot.src} from={from} durationInFrames={shotDuration + (isLast ? 0 : XFADE)}>
            {isFirst ? (
              <KenBurnsShot {...shot} />
            ) : (
              <FadeTransition durationInFrames={XFADE}>
                <KenBurnsShot {...shot} />
              </FadeTransition>
            )}
            {shot.audio ? <Audio src={staticFile(shot.audio)} volume={cueVolume} /> : null}
          </Sequence>
        );
      })}

      {/* Soft kitchen ambience under everything after the hero */}
      <Sequence from={heroDur}>
        <Audio loop src={staticFile('audio/ambience.mp3')} volume={0.22} />
      </Sequence>

      {/* Gentle fade to black at the very end */}
      <Sequence from={total - 45}>
        <FadeOutToBlack />
      </Sequence>

      {/* Unifying vignette over everything */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 130% 110% at 50% 48%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.42) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

// 16:9 — hero video + 4 stills: 360 + 4*375 = 1860 frames
export const BreakfastAsmr: React.FC = () => (
  <Montage
    hero={{ src: 'footage/hero-breakfast.mp4', durationInFrames: 360 }}
    shots={SHOTS_WIDE}
    shotDuration={375}
  />
);

// 9:16 — 5 vertical stills: 5*372 = 1860 frames
export const BreakfastAsmrVertical: React.FC = () => (
  <Montage shots={SHOTS_VERTICAL} shotDuration={372} />
);
