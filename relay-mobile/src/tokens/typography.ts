import type { TextStyle } from 'react-native';

type Level = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'lineHeight'>;

export const typography = {
  display: {
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 36,
  } satisfies Level,
  title: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  } satisfies Level,
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  } satisfies Level,
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  } satisfies Level,
  caption: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 15,
  } satisfies Level,
} as const;
