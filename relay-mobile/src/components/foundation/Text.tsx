import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type StyleProp, type TextStyle } from 'react-native';
import { color } from '@/tokens/colors';
import { typography } from '@/tokens/typography';

type Variant = keyof typeof typography;

export interface TextProps extends RNTextProps {
  variant: Variant;
  colorToken?: string;
}

export function Text({ variant, colorToken = color.textPrimary, style, ...rest }: TextProps): React.ReactElement {
  const base = typography[variant] as TextStyle;
  const merged: StyleProp<TextStyle> = [base, { color: colorToken }, style];
  return <RNText style={merged} {...rest} />;
}
