import type React from 'react';
import { Sequence, staticFile, interpolate, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { AUDIO_MANIFEST, AudioCue } from './manifest';
import { CONFIG } from '../config/breakfast-config';
import { toFrames } from '../utils/time';

/**
 * AsmrAudioLayer: places every manifest cue at a frame-accurate position
 * for the active fps, with per-cue fades and family/master volume mixing.
 * Placeholder WAVs are pre-panned in stereo at generation time, so cue
 * "stereo placement" survives even though volume here is scalar.
 */
const Cue: React.FC<{ cue: AudioCue }> = ({ cue }) => {
  const { fps } = useVideoConfig();
  const base = CONFIG.audio.master * CONFIG.audio.families[cue.family] * cue.vol;
  const fadeInF = toFrames(cue.fadeIn ?? 0.03, fps);
  const fadeOutF = toFrames(cue.fadeOut ?? 0.05, fps);
  const durF = Math.max(1, toFrames(cue.dur, fps));

  return (
    <Sequence from={toFrames(cue.start, fps)} durationInFrames={durF}>
      <Audio
        src={staticFile(`assets/audio/${cue.file}`)}
        volume={(f) =>
          base *
          interpolate(f, [0, Math.max(1, fadeInF), Math.max(2, durF - fadeOutF), durF], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
      />
    </Sequence>
  );
};

export const AsmrAudioLayer: React.FC = () => {
  return (
    <>
      {AUDIO_MANIFEST.map((cue, i) => (
        <Cue key={`${cue.file}-${cue.start}-${i}`} cue={cue} />
      ))}
    </>
  );
};
