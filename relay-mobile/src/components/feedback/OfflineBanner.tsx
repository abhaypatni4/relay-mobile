import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import { useUiStore } from '@/store/uiStore';

export function OfflineBanner(): React.ReactElement | null {
  const isOffline = useUiStore((s) => s.isOffline);
  if (!isOffline) {
    return null;
  }
  return (
    <View
      style={{
        paddingVertical: spacing.space8,
        paddingHorizontal: spacing.space16,
        backgroundColor: color.stateOfflineBanner,
      }}
    >
      <Text variant="label" colorToken={color.surfaceElevated}>
        You&apos;re offline — showing last saved info
      </Text>
    </View>
  );
}
