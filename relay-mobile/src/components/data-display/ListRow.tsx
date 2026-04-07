import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

export interface ListRowProps {
  leading?: React.ReactNode;
  primary: string;
  secondary?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function ListRow({
  leading,
  primary,
  secondary,
  trailing,
  onPress,
  style,
}: ListRowProps): React.ReactElement {
  const row = (
    <View
      style={[
        {
          minHeight: 56,
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
          {primary}
        </Text>
        {secondary ? (
          <Text variant="caption" colorToken={color.textSecondary}>
            {secondary}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {row}
      </Pressable>
    );
  }

  return row;
}
