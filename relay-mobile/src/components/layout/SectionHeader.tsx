import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

export interface SectionHeaderProps {
  title: string;
  count?: number;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({
  title,
  count,
  actionLabel,
  onActionPress,
}: SectionHeaderProps): React.ReactElement {
  const heading = count !== undefined ? `${title} (${count})` : title;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.space8,
        paddingVertical: spacing.space4,
      }}
    >
      <Text variant="label" colorToken={color.textPrimary}>
        {heading}
      </Text>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} accessibilityRole="button">
          <Text variant="label" colorToken={color.actionPrimary}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
