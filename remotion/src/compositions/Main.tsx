import type React from 'react';
import { Sequence } from 'remotion';
import { TitleCard } from '../components/TitleCard';
import { FadeTransition } from '../transitions/FadeTransition';
import { BaseTemplate } from '../templates/BaseTemplate';
import type { MainCompositionProps } from '../types';

export const Main: React.FC<MainCompositionProps> = ({
  title,
  subtitle,
  accentColor,
}) => {
  return (
    <BaseTemplate>
      <Sequence durationInFrames={90}>
        <FadeTransition>
          <TitleCard title={title} subtitle={subtitle} color={accentColor} />
        </FadeTransition>
      </Sequence>
      <Sequence from={90}>
        <FadeTransition direction="out">
          <TitleCard title="Thanks for watching" color={accentColor} />
        </FadeTransition>
      </Sequence>
    </BaseTemplate>
  );
};
