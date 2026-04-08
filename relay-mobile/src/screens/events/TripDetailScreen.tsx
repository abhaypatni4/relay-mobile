import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { Alert, FlatList, Pressable, View, type LayoutChangeEvent } from 'react-native';
import { AcknowledgmentButton } from '@/components/role-specific/AcknowledgmentButton';
import { Text } from '@/components/foundation/Text';
import { SkeletonLoader } from '@/components/feedback/SkeletonLoader';
import { SquadMemberRow } from '@/components/data-display/SquadMemberRow';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api } from '@/services/api';
import { useTripEventId } from '@/hooks/useTripEventId';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { EventsStackParamList } from '@/types/navigation';
import type { ApiEventListItem } from '@/hooks/useTeamEvents';
import type { OnboardingState, Role, TravelingStatus } from '@/types/models';

interface TripWorkspaceApi {
  id: string;
  eventId: string;
  departureTime: string | null;
  departureMeetingPoint: string | null;
  transportationNotes: string | null;
  accommodationName: string | null;
  accommodationAddress: string | null;
  accommodationCheckInTime: string | null;
  matchEventTime: string | null;
  matchEventLocation: string | null;
  returnDepartureTime: string | null;
  returnDeparturePoint: string | null;
  additionalNotes: string | null;
  itineraryVersion: number;
  isPublished: boolean;
  publishedAt: string | null;
}

interface SquadAssignmentApi {
  id: string;
  teamMemberId: string;
  travelingStatus: TravelingStatus;
  acknowledgedItineraryVersion: number | null;
  memberName: string;
  memberRole: Role;
  onboardingState: OnboardingState;
}

function formatDateTime(iso: string | null): string {
  if (!iso) {
    return '';
  }
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
}

function statusBadge(status: string): { label: string; fg: string; bg: string } {
  switch (status) {
    case 'cancelled':
      return { label: 'Cancelled', fg: color.stateError, bg: 'hsl(4, 40%, 94%)' };
    case 'postponed':
      return { label: 'Postponed', fg: color.stateWarning, bg: 'hsl(38, 85%, 92%)' };
    case 'draft':
      return { label: 'Draft', fg: color.textSecondary, bg: color.surfaceInput };
    default:
      return { label: 'Active', fg: color.stateSuccess, bg: 'hsl(145, 40%, 92%)' };
  }
}

export function TripDetailScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<EventsStackParamList, 'TripDetail'>>();
  const route = useRoute<RouteProp<EventsStackParamList, 'TripDetail'>>();
  const { tripId, eventId: paramEventId } = route.params;
  const teamId = useTeamStore((s) => s.activeTeamId);
  const role = useTeamStore((s) => s.role);
  const isOffline = useUiStore((s) => s.isOffline);
  const { teamMemberId } = useCurrentMember();

  const listRef = useRef<FlatList>(null);
  const squadSectionY = useRef(0);

  const { eventId, isResolving } = useTripEventId(teamId, tripId, paramEventId);

  const { data: eventRow, isLoading: eventLoading } = useQuery({
    queryKey: ['eventDetail', teamId, eventId],
    queryFn: async () => {
      const { data } = await api.get<ApiEventListItem>(`/teams/${teamId}/events/${eventId}`);
      return data;
    },
    enabled: Boolean(teamId && eventId),
  });

  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ['tripWorkspace', eventId],
    queryFn: async () => {
      const { data } = await api.get<TripWorkspaceApi>(`/events/${eventId}/trip`);
      return data;
    },
    enabled: Boolean(eventId),
  });

  const { data: squad = [], isLoading: squadLoading } = useQuery({
    queryKey: ['tripSquad', eventId],
    queryFn: async () => {
      const { data } = await api.get<{ assignments: SquadAssignmentApi[] }>(`/events/${eventId}/trip/squad`);
      return data.assignments;
    },
    enabled: Boolean(eventId),
  });

  const isCoordinator = role === 'coordinator';
  const isPlayer = role === 'player';
  const staffVariant = role === 'coordinator' || role === 'coach' || role === 'staff';

  const myAssignment = useMemo(
    () => squad.find((a) => a.teamMemberId === teamMemberId),
    [squad, teamMemberId],
  );

  const travelingSquad = useMemo(() => squad.filter((a) => a.travelingStatus === 'traveling'), [squad]);

  const ackSummary = useMemo(() => {
    const pool = travelingSquad.filter((a) => a.onboardingState === 'active');
    const v = trip?.itineraryVersion ?? 0;
    const done = pool.filter((a) => a.acknowledgedItineraryVersion === v).length;
    return { done, total: pool.length };
  }, [travelingSquad, trip?.itineraryVersion]);

  const scrollToItinerary = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const scrollToSquad = useCallback(() => {
    const target = Math.max(0, squadSectionY.current - 8);
    listRef.current?.scrollToOffset({ offset: target, animated: true });
  }, []);

  const onSquadSectionLayout = useCallback((e: LayoutChangeEvent) => {
    squadSectionY.current = e.nativeEvent.layout.y;
  }, []);

  useLayoutEffect(() => {
    if (!isCoordinator) {
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => {
            if (isOffline) {
              Alert.alert('Offline', 'Connect to edit or cancel trips.');
              return;
            }
            Alert.alert('Trip', undefined, [
              {
                text: 'Edit itinerary',
                onPress: () => {
                  if (eventId) {
                    navigation.navigate('EditItinerary', { tripId, eventId });
                  }
                },
              },
              {
                text: 'Cancel trip',
                style: 'destructive',
                onPress: () => {
                  Alert.alert('Cancel trip', 'Trip cancellation will be available in a later update.');
                },
              },
              { text: 'Close', style: 'cancel' },
            ]);
          }}
          style={{ marginRight: spacing.space16, padding: spacing.space8 }}
          accessibilityRole="button"
          accessibilityLabel="Trip actions"
        >
          <Text variant="label" colorToken={color.actionPrimary}>
            ⋯
          </Text>
        </Pressable>
      ),
    });
  }, [eventId, isCoordinator, navigation, tripId, isOffline]);

  const loading =
    isResolving || !eventId || eventLoading || tripLoading || (staffVariant && squadLoading && !isOffline);

  const renderOptional = useCallback(
    (label: string, value: string | null) => {
      const filled = Boolean(value?.trim());
      if (filled) {
        return (
          <View style={{ marginBottom: spacing.space12 }}>
            <Text variant="caption" colorToken={color.textSecondary}>
              {label}
            </Text>
            <Text variant="body">{value}</Text>
          </View>
        );
      }
      return (
        <View style={{ marginBottom: spacing.space12 }}>
          <Text variant="caption" colorToken={color.textSecondary}>
            {label}
          </Text>
          <Text variant="body" colorToken={color.textSecondary}>
            {isPlayer ? 'Details coming soon' : '—'}
          </Text>
        </View>
      );
    },
    [isPlayer],
  );

  const listHeader = useMemo(() => {
    if (!trip || !eventRow) {
      return <View />;
    }
    const st = statusBadge(eventRow.status);
    return (
      <View>
        <View style={{ marginBottom: spacing.space24 }}>
          <Text variant="display" style={{ marginBottom: spacing.space8 }}>
            {eventRow.name}
          </Text>
          <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
            {formatDate(eventRow.date)} · {eventRow.startTime}
          </Text>
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: spacing.space8,
              paddingVertical: spacing.space4,
              borderRadius: 6,
              backgroundColor: st.bg,
            }}
          >
            <Text variant="caption" style={{ color: st.fg }}>
              {st.label}
            </Text>
          </View>
        </View>

        <Pressable onPress={scrollToItinerary} accessibilityRole="button">
          <SectionHeader title="Itinerary" />
        </Pressable>

        <Text variant="title" style={{ marginBottom: spacing.space8 }}>
          {trip.departureTime ? formatDateTime(trip.departureTime) : '—'}
        </Text>
        <Text variant="body" style={{ marginBottom: spacing.space16 }}>
          {trip.departureMeetingPoint?.trim() ? trip.departureMeetingPoint : '—'}
        </Text>

        {renderOptional('Transportation notes', trip.transportationNotes)}
        {renderOptional('Accommodation', trip.accommodationName)}
        {renderOptional('Accommodation address', trip.accommodationAddress)}
        {renderOptional(
          'Accommodation check-in',
          trip.accommodationCheckInTime ? formatDateTime(trip.accommodationCheckInTime) : null,
        )}
        {renderOptional(
          'Match or event time',
          trip.matchEventTime ? formatDateTime(trip.matchEventTime) : null,
        )}
        {renderOptional('Match or event location', trip.matchEventLocation)}
        {renderOptional(
          'Return departure',
          trip.returnDepartureTime ? formatDateTime(trip.returnDepartureTime) : null,
        )}
        {renderOptional('Return departure point', trip.returnDeparturePoint)}
        {renderOptional('Additional notes', trip.additionalNotes)}

        {!isPlayer && trip.isPublished ? (
          <Text variant="caption" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
            {ackSummary.total === 0
              ? 'No active traveling members to acknowledge yet'
              : `${ackSummary.done} of ${ackSummary.total} acknowledged`}
          </Text>
        ) : null}

        {isPlayer ? (
          <AcknowledgmentButton
            eventId={eventId}
            tripWorkspace={trip}
            currentMemberAssignment={myAssignment ?? undefined}
          />
        ) : null}

        <View style={{ marginTop: spacing.space24 }} onLayout={onSquadSectionLayout}>
          <Pressable onPress={scrollToSquad} accessibilityRole="button">
            <SectionHeader title="Traveling squad" count={travelingSquad.length} />
          </Pressable>
        </View>
      </View>
    );
  }, [
    ackSummary.done,
    ackSummary.total,
    eventId,
    eventRow,
    isPlayer,
    myAssignment,
    onSquadSectionLayout,
    renderOptional,
    scrollToItinerary,
    scrollToSquad,
    travelingSquad.length,
    trip,
  ]);

  if (loading) {
    return (
      <ScreenContainer scrollable>
        <SkeletonLoader variant="card" style={{ marginBottom: spacing.space12 }} />
        <SkeletonLoader variant="card" style={{ marginBottom: spacing.space12 }} />
        <SkeletonLoader variant="listRow" />
      </ScreenContainer>
    );
  }

  if (!trip || !eventRow) {
    return (
      <ScreenContainer scrollable>
        <Text variant="body">Trip could not be loaded.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          style={{ flex: 1 }}
          data={travelingSquad}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<View style={{ paddingBottom: spacing.space8 }}>{listHeader}</View>}
          renderItem={({ item }) => (
            <SquadMemberRow
              variant={isPlayer ? 'player' : 'staff'}
              name={item.memberName}
              role={item.memberRole}
              travelingStatus={item.travelingStatus}
              itineraryVersion={trip.itineraryVersion}
              acknowledgedItineraryVersion={item.acknowledgedItineraryVersion}
              onboardingState={item.onboardingState}
            />
          )}
          contentContainerStyle={{ paddingBottom: spacing.space32 }}
        />
      </View>
    </ScreenContainer>
  );
}
