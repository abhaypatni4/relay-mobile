import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

export function TextVariantDemoScreen(): React.ReactElement {
  return (
    <ScreenContainer scrollable>
      <View style={{ gap: spacing.space16 }}>
        <Text variant="display" colorToken={color.textPrimary}>
          Display
        </Text>
        <Text variant="title" colorToken={color.textPrimary}>
          Title
        </Text>
        <Text variant="body" colorToken={color.textPrimary}>
          Body
        </Text>
        <Text variant="label" colorToken={color.textPrimary}>
          Label
        </Text>
        <Text variant="caption" colorToken={color.textSecondary}>
          Caption
        </Text>
      </View>
    </ScreenContainer>
  );
}
