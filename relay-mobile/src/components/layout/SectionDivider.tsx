import React from 'react';
import { View } from 'react-native';
import { spacing } from '@/tokens/spacing';

/** Exactly 32px vertical gap; no visible rule. */
export function SectionDivider(): React.ReactElement {
  return <View style={{ height: spacing.space32 }} />;
}
