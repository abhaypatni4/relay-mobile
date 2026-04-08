import type { CompositeNavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { EventCard, eventStartDate } from '@/components/data-display/EventCard';
import { CoordinatorTripCard, type TripCardData } from '@/components/data-display/TripCard';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useTeamEvents, type ApiEventListItem } from '@/hooks/useTeamEvents';
import { isAggregateDocumentsResponse, useTripDocuments } from '@/queries/useTripDocuments';
import { useTeamStore } from '@/store/teamStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { HomeStackParamList, MainTabParamList } from '@/types/navigation';

type HomeNav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Home'>,
  BottomTabNavigationProp<MainTabParamList>
>;

const WINDOW_MS = 48 * 60 * 60 * 1000;
const FOURTEEN_D_MS = 14 * 24 * 60 * 60 * 1000;

function buildTripCardData(
  event: ApiEventListItem,
  tw: {
    id: string;
    departureTime: string | null;
    departureMeetingPoint: string | null;
    itineraryVersion: number;
    isPublished: boolean;
  },
  ack?: { done: number; total: number },
): TripCardData {
  return {
    eventId: event.id,
    tripWorkspaceId: tw.id,
    eventName: event.name,
    eventDate: event.date,
    eventStartTime: event.startTime,
    eventStatus: event.status,
    departureTime: tw.departureTime,
    departureMeetingPoint: tw.departureMeetingPoint,
    itineraryVersion: tw.itineraryVersion,
    isPublished: tw.isPublished,
    acknowledgedItineraryVersion: null,
    travelingStatus: null,
    acknowledgmentDone: ack?.done,
    acknowledgmentTotal: ack?.total,
  };
}

export function CoordinatorHome(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('CoordinatorHome');
    }, []),
  );

  const navigation = useNavigation<HomeNav>();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const { data: events = [], isLoading } = useTeamEvents(teamId);

  const now = Date.now();

  const { upcoming, nextAny } = useMemo(() => {
    const list = [...events].sort((a, b) => eventStartDate(a).getTime() - eventStartDate(b).getTime());
    const u = list.filter((e) => eventStartDate(e).getTime() >= now);
    return { upcoming: u, nextAny: u[0] };
  }, [events, now]);

  const activeTripEvent = useMemo(() => {
    return upcoming.find((e) => {
      if (e.type !== 'trip' || e.status === 'cancelled') {
        return false;
      }
      const t = eventStartDate(e).getTime();
      return t <= now + WINDOW_MS && t >= now - 24 * 60 * 60 * 1000;
    });
  }, [upcoming, now]);

  const { data: tripEventDetail } = useQuery({
    queryKey: ['eventDetail', teamId, activeTripEvent?.id],
    queryFn: async () => {
      const { data } = await api.get<
        ApiEventListItem & {
          tripWorkspace?: {
            id: string;
            departureTime: string | null;
            departureMeetingPoint: string | null;
            itineraryVersion: number;
            isPublished: boolean;
          };
        }
      >(`/teams/${teamId}/events/${activeTripEvent!.id}`);
      return data;
    },
    enabled: Boolean(teamId && activeTripEvent?.id),
  });

  const tw = tripEventDetail?.tripWorkspace;

  const { data: squad = [] } = useQuery({
    queryKey: ['tripSquad', activeTripEvent?.id],
    queryFn: async () => {
      const { data } = await api.get<{
        assignments: {
          travelingStatus: string;
          onboardingState: string;
          acknowledgedItineraryVersion: number | null;
        }[];
      }>(`/events/${activeTripEvent!.id}/trip/squad`);
      return data.assignments;
    },
    enabled: Boolean(activeTripEvent?.id && tw?.isPublished),
    refetchInterval: 30_000,
  });

  const ackCounts = useMemo(() => {
    const pool = squad.filter((a) => a.travelingStatus === 'traveling' && a.onboardingState === 'active');
    const v = tw?.itineraryVersion ?? 0;
    const done = pool.filter((a) => a.acknowledgedItineraryVersion === v).length;
    return { done, total: pool.length };
  }, [squad, tw?.itineraryVersion]);

  const documentsQuery = useTripDocuments(activeTripEvent?.id ?? null);
  const outstandingDocuments = useMemo(() => {
    if (!isAggregateDocumentsResponse(documentsQuery.data)) {
      return 0;
    }
    return documentsQuery.data.items.reduce(
      (acc, it) => acc + Math.max(0, it.totalApplicable - it.confirmedCount),
      0,
    );
  }, [documentsQuery.data]);

  const hasUpcomingIn14Days = useMemo(
    () =>
      upcoming.some((e) => {
        const t = eventStartDate(e).getTime();
        return t >= now && t <= now + FOURTEEN_D_MS;
      }),
    [upcoming, now],
  );

  const openTrip = (d: TripCardData) => {
    navigation.navigate('EventsTab', {
      screen: 'TripDetail',
      params: { tripId: d.tripWorkspaceId, eventId: d.eventId },
    });
  };

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

  const showTripCard = Boolean(activeTripEvent && tw);

  return (
    <View style={{ padding: spacing.space16 }}>
      {showTripCard && activeTripEvent && tw ? (
        <CoordinatorTripCard
          trip={buildTripCardData(activeTripEvent, tw, ackCounts)}
          outstandingDocumentsCount={outstandingDocuments}
          onPress={() => openTrip(buildTripCardData(activeTripEvent, tw, ackCounts))}
        />
      ) : nextAny ? (
        <EventCard event={nextAny} onPress={() => openEvent(nextAny)} />
      ) : null}

      <View style={{ marginTop: spacing.space24 }}>
        <Text variant="label" style={{ marginBottom: spacing.space8 }}>
          Outstanding
        </Text>
        <Text variant="body" colorToken={color.textSecondary}>
          Acknowledgments:{' '}
          {tw?.isPublished && ackCounts.total > 0 ? ackCounts.total - ackCounts.done : 0} pending
        </Text>
        <Text variant="body" colorToken={color.textSecondary}>
          Documents: {outstandingDocuments}
        </Text>
      </View>

      <View style={{ marginTop: spacing.space24 }}>
        <Text variant="caption" colorToken={color.textSecondary}>
          Unread feed: 0
        </Text>
      </View>

      {!hasUpcomingIn14Days ? (
        <View style={{ marginTop: spacing.space24 }}>
          <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space12 }}>
            No upcoming events. Set up your next trip or match.
          </Text>
          <LoadingButton
            label="Create event"
            isLoading={false}
            onPress={() => navigation.navigate('EventsTab', { screen: 'CreateEvent' })}
          />
        </View>
      ) : null}
    </View>
  );
}
