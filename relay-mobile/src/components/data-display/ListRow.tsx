import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

export interface ListRowProps {
  leading?: React.ReactNode;
  primaryText: string;
  secondaryText?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}
const MIN_ROW_HEIGHT = 56; // Product minimum row height requirement

export function ListRow({
  leading,
  primaryText,
  secondaryText,
  trailing,
  onPress,
  style,
}: ListRowProps): React.ReactElement {
  const row = (
    <View
      style={[
        {
          minHeight: MIN_ROW_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.space12,
          paddingHorizontal: spacing.space16,
          columnGap: spacing.space12,
        },
        style,
      ]}
    >
      {leading}
      <View style={{ flex: 1 }}>
        <Text variant="body" colorToken={color.textPrimary}>
          {primaryText}
        </Text>
        {secondaryText ? (
          <Text variant="caption" colorToken={color.textSecondary}>
            {secondaryText}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );

  if (onPress) {
    const accessibilityLabel = secondaryText ? `${primaryText}. ${secondaryText}` : primaryText;
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
        {row}
      </Pressable>
    );
  }

  return row;
}
