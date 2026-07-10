import type React from 'react';
import { Audio, staticFile } from 'remotion';
import type { BackgroundAudioProps } from '../types';

// Plays an audio file from the public/ directory for the length of the
// enclosing sequence. Pass a path relative to public/, e.g. "music/theme.mp3".
export const BackgroundAudio: React.FC<BackgroundAudioProps> = ({
  src,
  volume = 1,
}) => {
  return <Audio src={staticFile(src)} volume={volume} />;
};
