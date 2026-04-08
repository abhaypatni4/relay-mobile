import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';

const shadowStyle: ViewStyle = {
  backgroundColor: color.surfaceElevated,
  borderRadius: radius.md,
  padding: spacing.space16,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
};

export interface CardContainerProps {
  children: React.ReactNode;
  pressable?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'summary' | 'none';
}

export function CardContainer({
  children,
  pressable = false,
  onPress,
  style,
  accessibilityLabel,
  accessibilityRole,
}: CardContainerProps): React.ReactElement {
  if (pressable && onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole ?? 'button'}
        style={({ pressed }) => [shadowStyle, pressed && { opacity: 0.92 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[shadowStyle, style]}>{children}</View>;
}
