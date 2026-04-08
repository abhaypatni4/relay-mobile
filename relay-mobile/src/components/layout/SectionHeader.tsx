import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';

export interface SectionHeaderProps {
  title: string;
  count?: number;
  statusDotColor?: string;
  statusDotA11yLabel?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({
  title,
  count,
  statusDotColor,
  statusDotA11yLabel,
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
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {statusDotColor ? (
          <View
            style={{
              width: spacing.space8,
              height: spacing.space8,
              borderRadius: radius.sm,
              backgroundColor: statusDotColor,
              marginRight: spacing.space8,
            }}
            accessibilityRole="image"
            accessibilityLabel={statusDotA11yLabel ?? 'Section status'}
          />
        ) : null}
        <Text variant="label" colorToken={color.textPrimary}>
          {heading}
        </Text>
      </View>
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
