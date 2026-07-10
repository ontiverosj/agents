import type React from 'react';
import { Composition } from 'remotion';
import { Main } from './compositions/Main';
import { BreakfastAsmr, BreakfastAsmrVertical } from './compositions/BreakfastAsmr';
import { BreakfastToon } from './compositions/BreakfastToon';
import {
  UgcAdLong,
  UGC_LONG_DURATION,
  UGC_LONG_FPS,
  UGC_LONG_HEIGHT,
  UGC_LONG_WIDTH,
} from './compositions/UgcAdLong';
import {
  UgcAd,
  UGC_AD_DURATION,
  UGC_AD_FPS,
  UGC_AD_HEIGHT,
  UGC_AD_WIDTH,
} from './compositions/UgcAd';
import {
  ElevenLabsCut,
  ELEVENLABS_CUT_DURATION,
  ELEVENLABS_CUT_FPS,
  ELEVENLABS_CUT_HEIGHT,
  ELEVENLABS_CUT_WIDTH,
} from './compositions/ElevenLabsCut';
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
      <Composition
        id="BreakfastAsmrVertical"
        component={BreakfastAsmrVertical}
        durationInFrames={BREAKFAST_TOTAL_DURATION}
        fps={VIDEO_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="UgcAdLong"
        component={UgcAdLong}
        durationInFrames={UGC_LONG_DURATION}
        fps={UGC_LONG_FPS}
        width={UGC_LONG_WIDTH}
        height={UGC_LONG_HEIGHT}
      />
      <Composition
        id="UgcAd"
        component={UgcAd}
        durationInFrames={UGC_AD_DURATION}
        fps={UGC_AD_FPS}
        width={UGC_AD_WIDTH}
        height={UGC_AD_HEIGHT}
      />
      <Composition
        id="BreakfastElevenLabs"
        component={ElevenLabsCut}
        durationInFrames={ELEVENLABS_CUT_DURATION}
        fps={ELEVENLABS_CUT_FPS}
        width={ELEVENLABS_CUT_WIDTH}
        height={ELEVENLABS_CUT_HEIGHT}
      />
      <Composition
        id="BreakfastToon"
        component={BreakfastToon}
        durationInFrames={BREAKFAST_TOTAL_DURATION}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
    </>
  );
};
