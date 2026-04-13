import type { CompositeNavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/foundation/Icon';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { EventCard, eventStartDate } from '@/components/data-display/EventCard';
import { CoordinatorTripCard, type TripCardData } from '@/components/data-display/TripCard';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useTeamEvents, type ApiEventListItem } from '@/hooks/useTeamEvents';
import { isAggregateDocumentsResponse, useTripDocuments } from '@/queries/useTripDocuments';
import { fetchMe } from '@/services/session';
import { useAuthStore } from '@/store/authStore';
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
  const userId = useAuthStore((s) => s.userId);
  const { data: events = [], isLoading } = useTeamEvents(teamId);
  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: fetchMe,
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  const now = Date.now();
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) {
      return 'Good morning';
    }
    if (h < 18) {
      return 'Good afternoon';
    }
    return 'Good evening';
  }, []);
  const displayName = useMemo(() => {
    const n = me?.user.name?.trim();
    return n && n.length > 0 ? n : 'Coach';
  }, [me?.user.name]);

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
  const pendingCount = tw?.isPublished && ackCounts.total > 0 ? Math.max(0, ackCounts.total - ackCounts.done) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: color.surfaceBase, padding: spacing.space16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text variant="title" style={{ marginBottom: spacing.space4 }}>
            {greeting}, {displayName}
          </Text>
          <Text variant="caption" colorToken={color.textSecondary}>
            Team overview
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: spacing.space8,
            paddingVertical: spacing.space4,
            borderRadius: spacing.space12,
            backgroundColor: color.surfaceElevated,
            borderWidth: 1,
            borderColor: color.borderDefault,
          }}
        >
          <Text variant="caption" colorToken={color.textSecondary}>
            Unread feed: 0
          </Text>
        </View>
      </View>
      <View
        style={{
          height: spacing.space8,
          borderRadius: spacing.space8,
          backgroundColor: color.actionPrimary,
          marginTop: spacing.space12,
          marginBottom: spacing.space16,
          opacity: 0.18,
        }}
      />
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
        <Text
          variant="caption"
          colorToken={color.textLabel}
          style={{ marginBottom: spacing.space8, letterSpacing: 1.2, textTransform: 'uppercase' }}
        >
          Outstanding
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.space12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: color.surfaceElevated,
              borderRadius: spacing.space16,
              borderWidth: 1,
              borderColor: color.borderDefault,
              padding: spacing.space12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Icon name="note" size={spacing.space16} color={color.stateWarning} />
            <View style={{ marginLeft: spacing.space8 }}>
              <Text variant="label" colorToken={color.stateWarning}>
                {pendingCount} pending
              </Text>
              <Text variant="caption" colorToken={color.textSecondary}>
                Acknowledgments
              </Text>
            </View>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: color.surfaceElevated,
              borderRadius: spacing.space16,
              borderWidth: 1,
              borderColor: color.borderDefault,
              padding: spacing.space12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Icon name="check" size={spacing.space16} color={color.stateSuccess} />
            <View style={{ marginLeft: spacing.space8 }}>
              <Text variant="label" colorToken={color.stateSuccess}>
                {outstandingDocuments} documents
              </Text>
              <Text variant="caption" colorToken={color.textSecondary}>
                Checklist
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ marginTop: spacing.space24 }}>
        <Text
          variant="caption"
          colorToken={color.textLabel}
          style={{ marginBottom: spacing.space8, letterSpacing: 1.2, textTransform: 'uppercase' }}
        >
          Quick actions
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.space12 }}>
          <Pressable
            onPress={() => navigation.navigate('EventsTab', { screen: 'CreateEvent' })}
            style={{
              flex: 1,
              minHeight: spacing.space40,
              borderRadius: spacing.space8,
              borderWidth: 1,
              borderColor: color.actionPrimary,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: color.surfaceElevated,
            }}
          >
            <Text variant="label" colorToken={color.actionPrimary}>
              Create trip
            </Text>
          </Pressable>
          <Pressable
            onPress={() => (navigation as unknown as { navigate: (name: string) => void }).navigate('InviteMembers')}
            style={{
              flex: 1,
              minHeight: spacing.space40,
              borderRadius: spacing.space8,
              borderWidth: 1,
              borderColor: color.actionPrimary,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: color.surfaceElevated,
            }}
          >
            <Text variant="label" colorToken={color.actionPrimary}>
              Invite member
            </Text>
          </Pressable>
        </View>
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
