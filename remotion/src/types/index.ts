import type { ReactNode } from 'react';

// Shared video dimensions and timing constants
export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;

// Props accepted by the Main composition
export type MainCompositionProps = {
  title: string;
  subtitle: string;
  accentColor: string;
};

export type TitleCardProps = {
  title: string;
  subtitle?: string;
  color?: string;
};

export type FadeTransitionProps = {
  children: ReactNode;
  durationInFrames?: number;
  direction?: 'in' | 'out';
};

export type BackgroundAudioProps = {
  src: string;
  volume?: number;
};
