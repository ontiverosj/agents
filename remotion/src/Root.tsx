import type React from 'react';
import { Composition } from 'remotion';
import { Main } from './compositions/Main';
import { BreakfastAsmr } from './compositions/BreakfastAsmr';
import {
  BREAKFAST_TOTAL_DURATION,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from './types';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={180}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{
          title: 'Hello Remotion',
          subtitle: 'Programmatic video generation',
          accentColor: '#4a90d9',
        }}
      />
      <Composition
        id="BreakfastAsmr"
        component={BreakfastAsmr}
        durationInFrames={BREAKFAST_TOTAL_DURATION}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
    </>
  );
};
