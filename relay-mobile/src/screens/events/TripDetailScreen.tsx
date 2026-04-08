import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import React from 'react';
import { Text } from '@/components/foundation/Text';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { EventsStackParamList } from '@/types/navigation';

/** Placeholder until full trip workspace UI (M3+). */
export function TripDetailScreen(): React.ReactElement {
  const route = useRoute<RouteProp<EventsStackParamList, 'TripDetail'>>();
  const { tripId } = route.params;

  return (
    <ScreenContainer scrollable>
      <Text variant="title" style={{ marginBottom: spacing.space8 }}>
        Trip
      </Text>
      <Text variant="body" colorToken={color.textSecondary}>
        Trip details will appear here. (Placeholder)
      </Text>
      <Text variant="caption" colorToken={color.textDisabled} style={{ marginTop: spacing.space16 }}>
        {tripId}
      </Text>
    </ScreenContainer>
  );
}
