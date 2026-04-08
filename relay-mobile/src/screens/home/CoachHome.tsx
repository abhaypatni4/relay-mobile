import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { EventCard, eventStartDate } from '@/components/data-display/EventCard';
import { api } from '@/services/api';
import { useTeamEvents, type ApiEventListItem } from '@/hooks/useTeamEvents';
import { useTeamStore } from '@/store/teamStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { HomeStackParamList, MainTabParamList } from '@/types/navigation';

type HomeNav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Home'>,
  BottomTabNavigationProp<MainTabParamList>
>;

export function CoachHome(): React.ReactElement {
  const navigation = useNavigation<HomeNav>();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const { data: events = [], isLoading } = useTeamEvents(teamId);

  const now = Date.now();
  const nextUpcoming = useMemo(() => {
    const u = [...events]
      .filter((e) => eventStartDate(e).getTime() >= now)
      .sort((a, b) => eventStartDate(a).getTime() - eventStartDate(b).getTime());
    return u[0];
  }, [events, now]);

  const openEvent = (e: ApiEventListItem) => {
    if (e.type === 'trip') {
      void (async () => {
        try {
          const { data } = await api.get<ApiEventListItem & { tripWorkspace?: { id: string } }>(
            `/teams/${teamId}/events/${e.id}`,
          );
          if (data.tripWorkspace?.id) {
            navigation.navigate('EventsTab', {
              screen: 'TripDetail',
              params: { tripId: data.tripWorkspace.id, eventId: data.id },
            });
          }
        } catch {
          /* empty */
        }
      })();
      return;
    }
    navigation.navigate('EventsTab', { screen: 'EventDetail', params: { eventId: e.id } });
  };

  if (isLoading) {
    return (
      <View style={{ padding: spacing.space16 }}>
        <Text variant="body" colorToken={color.textSecondary}>
          Loading…
        </Text>
      </View>
    );
  }

  return (
    <View style={{ padding: spacing.space16 }}>
      {nextUpcoming ? <EventCard event={nextUpcoming} onPress={() => openEvent(nextUpcoming)} /> : null}
      <View style={{ marginTop: spacing.space24 }}>
        <Text variant="body" colorToken={color.textSecondary}>
          Availability coming soon
        </Text>
      </View>
    </View>
  );
}
