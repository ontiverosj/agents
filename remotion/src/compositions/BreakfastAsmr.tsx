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
  rotate?: number; // total degrees of slow roll
};

const SHOTS_WIDE: Shot[] = [
  { src: 'stills/croissant.jpg', audio: 'audio/croissant.mp3', zoom: [1.05, 1.35], pan: [-70, -35], rotate: 1.2 },
  { src: 'stills/pancakes.jpg', audio: 'audio/syrup.mp3', zoom: [1.35, 1.06], pan: [80, 40], rotate: -1.2 },
  { src: 'stills/strawberry.jpg', audio: 'audio/strawberry.mp3', zoom: [1.06, 1.35], pan: [-75, 45], rotate: 1.1 },
  { src: 'stills/coffee.jpg', audio: 'audio/coffee.mp3', zoom: [1.33, 1.05], pan: [70, -40], rotate: -1.1 },
];

const SHOTS_VERTICAL: Shot[] = [
  { src: 'stills-vertical/spread.jpg', audio: 'audio/kitchen.mp3', zoom: [1.0, 1.3], pan: [-35, -70], rotate: -1.2 },
  { src: 'stills-vertical/croissant.jpg', audio: 'audio/croissant.mp3', zoom: [1.05, 1.35], pan: [35, -80], rotate: 1.2 },
  { src: 'stills-vertical/pancakes.jpg', audio: 'audio/syrup.mp3', zoom: [1.35, 1.05], pan: [-30, 85], rotate: -1.2 },
  { src: 'stills-vertical/strawberry.jpg', audio: 'audio/strawberry.mp3', zoom: [1.05, 1.35], pan: [40, 75], rotate: 1.1 },
  { src: 'stills-vertical/coffee.jpg', audio: 'audio/coffee.mp3', zoom: [1.33, 1.04], pan: [-35, -75], rotate: -1.0 },
  { src: 'stills-vertical/flatlay.jpg', audio: 'audio/closing.mp3', zoom: [1.3, 1.02], pan: [30, 65], rotate: 1.0 },
];

// A still photo with a slow push/pull and drift, like a locked-off
// macro shot on a slider.
const KenBurnsShot: React.FC<Shot> = ({ src, zoom, pan, rotate = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;
  // Main camera move plus a gentle "handheld breathing" oscillation so
  // the shot never sits perfectly still.
  const scale = interpolate(t, [0, 1], zoom) * (1 + 0.006 * Math.sin(frame / 26));
  const x = interpolate(t, [0, 1], [0, pan[0]]) + 5 * Math.sin(frame / 33);
  const y = interpolate(t, [0, 1], [0, pan[1]]) + 4 * Math.cos(frame / 41);
  const rot = interpolate(t, [0, 1], [0, rotate]);
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#120b06' }}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) rotate(${rot}deg) translate(${x}px, ${y}px)`,
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
  // Extra frames the last shot holds while fading out.
  tailFrames?: number;
};

const Montage: React.FC<MontageProps> = ({ hero, shots, shotDuration, tailFrames = 0 }) => {
  const heroDur = hero ? hero.durationInFrames : 0;
  const total = heroDur + shots.length * shotDuration + tailFrames;

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
          <Sequence key={shot.src} from={from} durationInFrames={shotDuration + (isLast ? tailFrames : XFADE)}>
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

// 9:16 — 6 vertical stills at 10s each + 2s closing hold: 6*300 + 60 = 1860 frames
export const BreakfastAsmrVertical: React.FC = () => (
  <Montage shots={SHOTS_VERTICAL} shotDuration={300} tailFrames={60} />
);
