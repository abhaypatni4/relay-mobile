import React from 'react';
import { ActivityIndicator, Pressable, type ViewStyle } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';

export interface LoadingButtonProps {
  label: string;
  isLoading: boolean;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'destructive';
  style?: ViewStyle;
}

export function LoadingButton({
  label,
  isLoading,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
}: LoadingButtonProps): React.ReactElement {
  const MIN_TOUCH_TARGET = 48; // WCAG minimum touch target
  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading || disabled}
      style={({ pressed }) => [
        {
          minHeight: MIN_TOUCH_TARGET,
          paddingHorizontal: spacing.space16,
          borderRadius: radius.md,
          backgroundColor: variant === 'destructive' ? color.stateDestructive : color.actionPrimary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed && !isLoading ? 0.9 : 1,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={color.actionOnPrimary} />
      ) : (
        <Text variant="label" colorToken={color.actionOnPrimary}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
