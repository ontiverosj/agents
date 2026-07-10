import type React from 'react';
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion';

// Breakfast cut assembled from four ElevenLabs-generated video clips
// (Gemini Omni Flash + Veo 3.1 Fast), sequenced with half-second
// crossfades. Native clip audio is kept and blended across each cut.
// 720x1280 @ 24fps, matching the source clips exactly.
const XF = 12; // crossfade length in frames (0.5s @ 24fps)

const CLIPS = [
  { src: 'footage/el/egg-bacon.mp4', durationInFrames: 192 },
  { src: 'footage/el/croissant.mp4', durationInFrames: 96 },
  { src: 'footage/el/strawberry.mp4', durationInFrames: 96 },
  { src: 'footage/el/coffee-pour.mp4', durationInFrames: 192 },
];

// Each clip starts XF frames before the previous one ends.
const starts = CLIPS.reduce<number[]>((acc, _, i) => {
  if (i === 0) return [0];
  return [...acc, acc[i - 1] + CLIPS[i - 1].durationInFrames - XF];
}, []);

export const ELEVENLABS_CUT_FPS = 24;
export const ELEVENLABS_CUT_WIDTH = 720;
export const ELEVENLABS_CUT_HEIGHT = 1280;
export const ELEVENLABS_CUT_DURATION =
  starts[starts.length - 1] + CLIPS[CLIPS.length - 1].durationInFrames;

const CrossfadeIn: React.FC<{ children: React.ReactNode; enabled: boolean }> = ({
  children,
  enabled,
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

const FadeOutToBlack: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 24], [0, 1], {
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{ backgroundColor: '#000', opacity }} />;
};

export const ElevenLabsCut: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {CLIPS.map((clip, i) => {
        const { durationInFrames } = clip;
        // Blend audio across cuts along with the video crossfade.
        const volume = (f: number) =>
          interpolate(
            f,
            [0, XF, durationInFrames - XF, durationInFrames],
            [i === 0 ? 1 : 0, 1, 1, i === CLIPS.length - 1 ? 1 : 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
        return (
          <Sequence key={clip.src} from={starts[i]} durationInFrames={durationInFrames}>
            <CrossfadeIn enabled={i > 0}>
              <OffthreadVideo
                src={staticFile(clip.src)}
                volume={volume}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </CrossfadeIn>
          </Sequence>
        );
      })}
      <Sequence from={ELEVENLABS_CUT_DURATION - 24}>
        <FadeOutToBlack />
      </Sequence>
    </AbsoluteFill>
  );
};
