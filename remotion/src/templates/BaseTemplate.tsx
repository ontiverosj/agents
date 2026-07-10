import type React from 'react';
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';

type BaseTemplateProps = {
  children: ReactNode;
  backgroundColor?: string;
};

// Common canvas wrapper: gives every composition a consistent background
// and stacking context. Compose scenes inside it.
export const BaseTemplate: React.FC<BaseTemplateProps> = ({
  children,
  backgroundColor = '#0b0e14',
}) => {
  return <AbsoluteFill style={{ backgroundColor }}>{children}</AbsoluteFill>;
};
