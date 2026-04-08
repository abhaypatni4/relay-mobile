import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { color as colorTokens } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

const defaultSize = spacing.space24;

const icons: Record<string, React.FC<{ color: string; size: number }>> = {
  home: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
        stroke={color}
        strokeWidth={1.5}
      />
    </Svg>
  ),
  calendar: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 3v2M17 3v2M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth={1.5}
      />
    </Svg>
  ),
  feed: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 12h10M4 18h14" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  ),
  team: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={8} r={3} stroke={color} strokeWidth={1.5} />
      <Path d="M4 19v-1a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v1" stroke={color} strokeWidth={1.5} />
    </Svg>
  ),
  check: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5l4.5 4L19 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  note: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 6h10M8 10h10M8 14h6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  ),
  plus: ({ color, size }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  ),
};

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export function Icon({ name, size = defaultSize, color: stroke = colorTokens.textSecondary }: IconProps): React.ReactElement | null {
  const Cmp = icons[name];
  if (!Cmp) {
    return null;
  }
  return <Cmp color={stroke} size={size} />;
}
