import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { color } from '@/tokens/colors';

export function Divider({ style }: { style?: ViewStyle }): React.ReactElement {
  return (
    <View
      style={[{ height: 1, width: '100%', backgroundColor: color.borderDefault }, style]}
    />
  );
}
