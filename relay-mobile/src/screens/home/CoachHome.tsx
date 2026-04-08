import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { AvailabilitySummaryCard } from '@/components/data-display/AvailabilitySummaryCard';
import { EventCard, eventStartDate } from '@/components/data-display/EventCard';
import { api } from '@/services/api';
import { useTeamEvents, type ApiEventListItem } from '@/hooks/useTeamEvents';
import { useOpenAvailabilityWindow } from '@/mutations/useOpenAvailabilityWindow';
import { useAvailability } from '@/queries/useAvailability';
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
  const openWindow = useOpenAvailabilityWindow();

  const now = Date.now();
  const nextUpcoming = useMemo(() => {
    const u = [...events]
      .filter((e) => eventStartDate(e).getTime() >= now)
      .sort((a, b) => eventStartDate(a).getTime() - eventStartDate(b).getTime());
    return u[0];
  }, [events, now]);

  const nextNonTrip = useMemo(() => {
    const u = [...events]
      .filter(
        (e) =>
          (e.type === 'match' || e.type === 'training') && eventStartDate(e).getTime() >= now,
      )
      .sort((a, b) => eventStartDate(a).getTime() - eventStartDate(b).getTime());
    return u[0];
  }, [events, now]);

  const availQ = useAvailability(nextNonTrip?.id ?? null);

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

  const openRoster = () => {
    if (!nextNonTrip) {
      return;
    }
    navigation.navigate('EventsTab', {
      screen: 'AvailabilityRoster',
      params: { eventId: nextNonTrip.id },
    });
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
      {nextUpcoming && nextUpcoming.type === 'trip' ? (
        <EventCard event={nextUpcoming} onPress={() => openEvent(nextUpcoming)} />
      ) : null}

      {nextNonTrip ? (
        <AvailabilitySummaryCard
          event={nextNonTrip}
          windowOpen={Boolean(availQ.data?.window)}
          submissions={availQ.data?.submissions ?? []}
          isOpening={openWindow.isPending}
          onOpenWindow={() => openWindow.mutate(nextNonTrip.id)}
          onPressRoster={openRoster}
          onPressEvent={() => openEvent(nextNonTrip)}
        />
      ) : (
        <View style={{ marginTop: spacing.space16 }}>
          <Text variant="body" colorToken={color.textSecondary}>
            No upcoming match or training to manage.
          </Text>
        </View>
      )}
    </View>
  );
}
