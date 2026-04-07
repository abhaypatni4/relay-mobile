import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

export interface InlineErrorProps {
  message: string;
  style?: ViewStyle;
}

export function InlineError({ message, style }: InlineErrorProps): React.ReactElement {
  return (
    <View style={[{ marginTop: spacing.space4 }, style]}>
      <Text variant="label" colorToken={color.stateError}>
        {message}
      </Text>
    </View>
  );
}
