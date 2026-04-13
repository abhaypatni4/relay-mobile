import type { CompositeNavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/foundation/Icon';
import { Text } from '@/components/foundation/Text';
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
  const { data: events = [], isLoading } = useTeamEvents(teamId);
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

  const nextMatchOrTraining = useMemo(() => {
    return [...events]
      .filter((e) => (e.type === 'match' || e.type === 'training') && eventStartDate(e).getTime() >= now)
      .sort((a, b) => eventStartDate(a).getTime() - eventStartDate(b).getTime())[0];
  }, [events, now]);

  const selectionAvail = useAvailability(nextMatchOrTraining?.id ?? null);
  const selectionRow = useMemo(
    () => selectionAvail.data?.submissions.find((s) => s.teamMemberId === teamMemberId),
    [selectionAvail.data?.submissions, teamMemberId],
  );
  const selectionNotified = Boolean(selectionAvail.data?.window?.selectionNotificationsSentAt);

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
    if (!nextMatchOrTraining) {
      return;
    }
    navigation.navigate('EventsTab', {
      screen: 'EventDetail',
      params: { eventId: nextMatchOrTraining.id },
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

      {nextMatchOrTraining ? (
        <View>
          <Text
            variant="caption"
            colorToken={color.textLabel}
            style={{ marginBottom: spacing.space8, letterSpacing: 1.2, textTransform: 'uppercase' }}
          >
            Selection status
          </Text>
          <Pressable
            onPress={selectionNotified ? openSelectionEvent : undefined}
            disabled={!selectionNotified}
            style={{
              borderRadius: spacing.space12,
              backgroundColor: color.surfaceElevated,
              borderWidth: 1,
              borderColor: color.borderSubtle,
              borderLeftWidth: spacing.space4,
              borderLeftColor: !selectionNotified
                ? color.actionPrimary
                : selectionRow?.selectionOutcome === 'selected'
                  ? color.stateSuccess
                  : color.textDisabled,
              paddingHorizontal: spacing.space20,
              paddingVertical: spacing.space16,
              shadowColor: color.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: spacing.space8,
              elevation: 2,
              opacity: selectionNotified ? 1 : 0.96,
            }}
          >
            {!selectionNotified ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.space8 }}>
                  <Icon name="calendar" size={spacing.space16} color={color.actionPrimary} />
                </View>
                <Text variant="body" style={{ fontWeight: '600', marginBottom: spacing.space4 }}>
                  Awaiting selection
                </Text>
                <Text variant="caption" colorToken={color.textSecondary}>
                  Your coach hasn&apos;t sent selection yet
                </Text>
              </>
            ) : selectionRow?.selectionOutcome === 'selected' ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.space8 }}>
                  <Icon name="check" size={spacing.space24} color={color.stateSuccess} />
                </View>
                <Text variant="body" style={{ fontWeight: '700', marginBottom: spacing.space4 }}>
                  You&apos;re in the squad
                </Text>
                <Text variant="caption" colorToken={color.textSecondary}>
                  {nextMatchOrTraining.name}
                </Text>
              </>
            ) : (
              <>
                <Text variant="body" style={{ fontWeight: '600', marginBottom: spacing.space4 }}>
                  Not selected for this one
                </Text>
                <Text variant="caption" colorToken={color.textSecondary}>
                  {nextMatchOrTraining.name}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
