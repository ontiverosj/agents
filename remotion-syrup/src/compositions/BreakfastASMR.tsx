import type React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { CONFIG, SCENE_ORDER, SceneKey } from '../config/breakfast-config';
import { toFrames } from '../utils/time';
import { FadeIn } from '../effects/SceneTransition';
import { RippleReveal } from '../effects/SceneTransition';
import { FilmFinish } from '../effects/FilmFinish';
import { AsmrAudioLayer } from '../audio/AsmrAudioLayer';
import { Scene1Hook } from '../scenes/Scene1Hook';
import { Scene2Heating } from '../scenes/Scene2Heating';
import { Scene3Rainfall } from '../scenes/Scene3Rainfall';
import { Scene4Glaze } from '../scenes/Scene4Glaze';
import { Scene5LemonReveal } from '../scenes/Scene5LemonReveal';
import { Scene6KnifeCut } from '../scenes/Scene6KnifeCut';
import { Scene7Lemonade } from '../scenes/Scene7Lemonade';
import { Scene8Hero } from '../scenes/Scene8Hero';

const SCENE_COMPONENTS: Record<SceneKey, React.FC> = {
  hook: Scene1Hook,
  heating: Scene2Heating,
  rainfall: Scene3Rainfall,
  glaze: Scene4Glaze,
  lemonReveal: Scene5LemonReveal,
  knifeCut: Scene6KnifeCut,
  lemonade: Scene7Lemonade,
  hero: Scene8Hero,
};

/**
 * BreakfastASMR — the single creative timeline. Scene windows come from
 * CONFIG (in seconds) and are converted to frames at the active fps, so
 * the 30fps preview and 60fps 4K master are frame-for-frame the same film.
 *
 * Scene sequencing rules:
 * - every scene extends CONFIG.transitionSec into its successor,
 * - the incoming scene fades in on top (soft crossfade, no black frames),
 * - lemonReveal enters through RippleReveal (the blue-ripple match cut).
 */
export const BreakfastASMR: React.FC = () => {
  const { fps, width } = useVideoConfig();
  const scale = width / CONFIG.design.width;
  const overlap = CONFIG.transitionSec;

  return (
    <AbsoluteFill style={{ backgroundColor: '#2b1a0c' }}>
      {/* Scale design space (1080x1920) to the actual output resolution */}
      <AbsoluteFill
        style={{
          width: CONFIG.design.width,
          height: CONFIG.design.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {SCENE_ORDER.map((key, idx) => {
          const win = CONFIG.scenes[key];
          if (!win.enabled) return null;
          const Comp = SCENE_COMPONENTS[key];
          const isLast = idx === SCENE_ORDER.length - 1;
          const from = toFrames(win.start, fps);
          const durationInFrames = toFrames(win.end - win.start + (isLast ? 0 : overlap), fps);
          const first = idx === 0;

          const content =
            key === 'lemonReveal' ? (
              // blue-ripple match cut from the glaze scene
              <RippleReveal durationSec={overlap * 1.4} centerY="50%">
                <Comp />
              </RippleReveal>
            ) : (
              <FadeIn durationSec={overlap} enabled={!first}>
                <Comp />
              </FadeIn>
            );

          return (
            <Sequence key={key} from={from} durationInFrames={durationInFrames} name={`scene:${key}`}>
              {content}
            </Sequence>
          );
        })}
        <FilmFinish />
      </AbsoluteFill>
      <AsmrAudioLayer />
    </AbsoluteFill>
  );
};
