import type React from 'react';
import { Sequence } from 'remotion';
import { WoodTable } from '../components/breakfast/WoodTable';
import { CroissantScene } from '../components/breakfast/CroissantScene';
import { PancakesScene } from '../components/breakfast/PancakesScene';
import { StrawberryScene } from '../components/breakfast/StrawberryScene';
import { CoffeeScene } from '../components/breakfast/CoffeeScene';
import { FadeTransition } from '../transitions/FadeTransition';
import { BREAKFAST_SCENE_DURATION as SCENE } from '../types';

// A cozy luxury breakfast on a dark wooden table at sunrise, told in four
// slow macro-style scenes: croissant + butter, pancakes + syrup,
// strawberry slicing, and coffee with steam. 62s at 30fps.
export const BreakfastToon: React.FC = () => {
  return (
    <WoodTable>
      <Sequence durationInFrames={SCENE}>
        <FadeTransition durationInFrames={20}>
          <CroissantScene />
        </FadeTransition>
      </Sequence>
      <Sequence from={SCENE} durationInFrames={SCENE}>
        <FadeTransition durationInFrames={20}>
          <PancakesScene />
        </FadeTransition>
      </Sequence>
      <Sequence from={SCENE * 2} durationInFrames={SCENE}>
        <FadeTransition durationInFrames={20}>
          <StrawberryScene />
        </FadeTransition>
      </Sequence>
      <Sequence from={SCENE * 3} durationInFrames={SCENE}>
        <FadeTransition direction="out" durationInFrames={30}>
          <CoffeeScene />
        </FadeTransition>
      </Sequence>
    </WoodTable>
  );
};
