import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import { useUiStore } from '@/store/uiStore';

function formatSynced(ts: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(ts));
  } catch {
    return '';
  }
}

export function OfflineBanner(): React.ReactElement | null {
  const isOffline = useUiStore((s) => s.isOffline);
  const lastSyncedAt = useUiStore((s) => s.lastSyncedAt);
  if (!isOffline) {
    return null;
  }
  const suffix =
    lastSyncedAt !== null && formatSynced(lastSyncedAt)
      ? ` — last updated ${formatSynced(lastSyncedAt)}`
      : '';
  return (
    <View
      style={{
        paddingVertical: spacing.space8,
        paddingHorizontal: spacing.space16,
        backgroundColor: color.stateOfflineBanner,
      }}
    >
      <Text variant="label" colorToken={color.surfaceElevated}>
        You&apos;re offline — showing last saved info{suffix}
      </Text>
    </View>
  );
}
