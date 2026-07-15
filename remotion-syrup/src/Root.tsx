import type React from 'react';
import { Composition } from 'remotion';
import { BreakfastASMR } from './compositions/BreakfastASMR';
import { CONFIG } from './config/breakfast-config';

/**
 * Two compositions, one creative timeline. Scene timing lives ONLY in
 * CONFIG (seconds); each composition derives its own frame counts from
 * its fps, so the preview and the 4K master never drift apart.
 */
export const RemotionRoot: React.FC = () => {
  const { preview, master } = CONFIG.compositions;
  return (
    <>
      <Composition
        id={preview.id}
        component={BreakfastASMR}
        width={preview.width}
        height={preview.height}
        fps={preview.fps}
        durationInFrames={CONFIG.durationSec * preview.fps}
      />
      <Composition
        id={master.id}
        component={BreakfastASMR}
        width={master.width}
        height={master.height}
        fps={master.fps}
        durationInFrames={CONFIG.durationSec * master.fps}
      />
    </>
  );
};
