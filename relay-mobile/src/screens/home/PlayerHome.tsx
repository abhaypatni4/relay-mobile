import type { CompositeNavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { CardContainer } from '@/components/layout/CardContainer';
import { eventStartDate } from '@/components/data-display/EventCard';
import { PlayerTripCard, type TripCardData } from '@/components/data-display/TripCard';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { fetchMe } from '@/services/session';
import { useAvailability } from '@/queries/useAvailability';
import { useTeamEvents, type ApiEventListItem } from '@/hooks/useTeamEvents';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useAuthStore } from '@/store/authStore';
import { useTeamStore } from '@/store/teamStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { HomeStackParamList, MainTabParamList } from '@/types/navigation';

type HomeNav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Home'>,
  BottomTabNavigationProp<MainTabParamList>
>;

interface TripWorkspaceBrief {
  id: string;
  departureTime: string | null;
  departureMeetingPoint: string | null;
  itineraryVersion: number;
  isPublished: boolean;
}

export function PlayerHome(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('PlayerHome');
    }, []),
  );

  const navigation = useNavigation<HomeNav>();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const userId = useAuthStore((s) => s.userId);
  const { teamMemberId } = useCurrentMember();
  const { data: events = [], isLoading, isError, refetch } = useTeamEvents(teamId);
  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: fetchMe,
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  const now = Date.now();
  const firstName = useMemo(() => {
    const n = me?.user.name?.trim();
    if (!n) {
      return 'there';
    }
    const [first] = n.split(/\s+/);
    return first || 'there';
  }, [me?.user.name]);

  const upcomingTrips = useMemo(() => {
    return [...events]
      .filter((e) => e.type === 'trip' && eventStartDate(e).getTime() >= now)
      .sort((a, b) => eventStartDate(a).getTime() - eventStartDate(b).getTime());
  }, [events, now]);

  const upcomingTripIds = useMemo(() => upcomingTrips.map((e) => e.id), [upcomingTrips]);

  const nextMatchTraining = useMemo(() => {
    return [...events]
      .filter(
        (e) =>
          (e.type === 'match' || e.type === 'training') &&
          e.status === 'active' &&
          eventStartDate(e).getTime() >= now,
      )
      .sort((a, b) => eventStartDate(a).getTime() - eventStartDate(b).getTime())[0];
  }, [events, now]);

  const selectionAvail = useAvailability(nextMatchTraining?.id ?? null);
  const selectionRow = useMemo(
    () => selectionAvail.data?.submissions.find((s) => s.teamMemberId === teamMemberId),
    [selectionAvail.data?.submissions, teamMemberId],
  );

  const { data: travelingContext } = useQuery({
    queryKey: ['playerHomeTravelingTrip', teamId, teamMemberId, upcomingTripIds],
    queryFn: async (): Promise<{
      event: ApiEventListItem;
      tw: TripWorkspaceBrief;
      assignment: { acknowledgedItineraryVersion: number | null; travelingStatus: string };
    } | null> => {
      if (!teamId || !teamMemberId) {
        return null;
      }
      for (const e of upcomingTrips) {
        const { data: detail } = await api.get<ApiEventListItem & { tripWorkspace?: TripWorkspaceBrief }>(
          `/teams/${teamId}/events/${e.id}`,
        );
        if (!detail.tripWorkspace) {
          continue;
        }
        const { data: squad } = await api.get<{
          assignments: {
            teamMemberId: string;
            travelingStatus: string;
            acknowledgedItineraryVersion: number | null;
          }[];
        }>(`/events/${e.id}/trip/squad`);
        const me = squad.assignments.find((a) => a.teamMemberId === teamMemberId);
        if (me?.travelingStatus === 'traveling') {
          return { event: detail, tw: detail.tripWorkspace, assignment: me };
        }
      }
      return null;
    },
    enabled: Boolean(teamId && teamMemberId && upcomingTrips.length > 0),
  });

  const tripCardData: TripCardData | null = useMemo(() => {
    if (!travelingContext) {
      return null;
    }
    const { event: e, tw, assignment } = travelingContext;
    return {
      eventId: e.id,
      tripWorkspaceId: tw.id,
      eventName: e.name,
      eventDate: e.date,
      eventStartTime: e.startTime,
      eventStatus: e.status,
      departureTime: tw.departureTime,
      departureMeetingPoint: tw.departureMeetingPoint,
      itineraryVersion: tw.itineraryVersion,
      isPublished: tw.isPublished,
      acknowledgedItineraryVersion: assignment.acknowledgedItineraryVersion,
      travelingStatus: assignment.travelingStatus as TripCardData['travelingStatus'],
    };
  }, [travelingContext]);

  const openTrip = () => {
    if (!tripCardData) {
      return;
    }
    navigation.navigate('EventsTab', {
      screen: 'TripDetail',
      params: { tripId: tripCardData.tripWorkspaceId, eventId: tripCardData.eventId },
    });
  };

  const openSelectionEvent = () => {
    if (!nextMatchTraining) {
      return;
    }
    navigation.navigate('EventsTab', {
      screen: 'EventDetail',
      params: { eventId: nextMatchTraining.id },
    });
  };

  const availabilityStatusLine = useMemo(() => {
    const st = selectionRow?.availabilityStatus;
    if (st === 'available') {
      return 'Available';
    }
    if (st === 'limited') {
      return 'Limited';
    }
    if (st === 'unavailable') {
      return 'Unavailable';
    }
    if (selectionAvail.data?.window) {
      return 'Not submitted yet';
    }
    return null;
  }, [selectionAvail.data?.window, selectionRow?.availabilityStatus]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={color.actionPrimary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.space16 }}>
        <Text variant="body" style={{ marginBottom: spacing.space12 }}>
          Something went wrong
        </Text>
        <Pressable onPress={() => void refetch()} style={{ padding: spacing.space8 }}>
          <Text variant="label" colorToken={color.actionPrimary}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.surfaceBase, padding: spacing.space16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.space16 }}>
        <Text variant="title">Hey, {firstName}</Text>
        <View
          style={{
            width: spacing.space32,
            height: spacing.space32,
            borderRadius: spacing.space16,
            borderWidth: 1,
            borderColor: color.borderDefault,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: color.surfaceElevated,
          }}
        >
          <Text variant="label" style={{ fontSize: spacing.space16 }}>
            🔔
          </Text>
          <View
            style={{
              position: 'absolute',
              top: -spacing.space4,
              right: -spacing.space4,
              minWidth: spacing.space16,
              height: spacing.space16,
              borderRadius: spacing.space8,
              backgroundColor: color.stateWarning,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: spacing.space4,
            }}
          >
            <Text variant="caption" colorToken={color.actionOnPrimary}>
              0
            </Text>
          </View>
        </View>
      </View>

      {tripCardData ? (
        <View style={{ marginBottom: spacing.space16 }}>
          <Text
            variant="caption"
            colorToken={color.textLabel}
            style={{ marginBottom: spacing.space8, letterSpacing: 1.2, textTransform: 'uppercase' }}
          >
            Your next trip
          </Text>
          <PlayerTripCard trip={tripCardData} onPress={openTrip} />
        </View>
      ) : null}

      {nextMatchTraining ? (
        <View>
          <Text
            variant="caption"
            colorToken={color.textLabel}
            style={{ marginBottom: spacing.space8, letterSpacing: 1.2, textTransform: 'uppercase' }}
          >
            Upcoming match / training
          </Text>
          <CardContainer
            pressable
            onPress={openSelectionEvent}
            style={{
              borderWidth: 1,
              borderColor: color.borderSubtle,
              borderLeftWidth: spacing.space4,
              borderLeftColor: color.actionPrimary,
            }}
          >
            <Text variant="title" numberOfLines={2} style={{ fontWeight: '700', marginBottom: spacing.space8 }}>
              {nextMatchTraining.name}
            </Text>
            <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
              {new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(
                eventStartDate(nextMatchTraining),
              )}
            </Text>
            {availabilityStatusLine ? (
              <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
                {availabilityStatusLine}
              </Text>
            ) : null}
            <Text variant="label" colorToken={color.actionPrimary}>
              View event →
            </Text>
          </CardContainer>
        </View>
      ) : null}
    </View>
  );
}
