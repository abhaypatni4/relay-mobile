import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ScreenContainer({
  children,
  scrollable = false,
  style,
}: ScreenContainerProps): React.ReactElement {
  const content = scrollable ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: spacing.space16, flexGrow: 1 }}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, padding: spacing.space16 }}>{children}</View>
  );

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: color.surfaceBase }, style]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
