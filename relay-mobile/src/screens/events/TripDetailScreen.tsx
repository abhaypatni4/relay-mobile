import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, View, type LayoutChangeEvent } from 'react-native';
import { AcknowledgmentButton } from '@/components/role-specific/AcknowledgmentButton';
import { Text } from '@/components/foundation/Text';
import { SkeletonLoader } from '@/components/feedback/SkeletonLoader';
import { SquadMemberRow } from '@/components/data-display/SquadMemberRow';
import { CoordinatorChecklistItem, PlayerChecklistItem } from '@/components/data-display/ChecklistItem';
import { EmergencyInfoCard } from '@/components/data-display/EmergencyInfoCard';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ConfirmationSheet } from '@/components/overlay/ConfirmationSheet';
import { BottomSheet } from '@/components/overlay/BottomSheet';
import { TextInput } from '@/components/input/TextInput';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { DateTimePickerField } from '@/components/input/DateTimePicker';
import { PreDepartureChecklistItem } from '@/components/role-specific/PreDepartureChecklistItem';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useTripEventId } from '@/hooks/useTripEventId';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import {
  isAggregateDocumentsResponse,
  type CoordinatorTripDocumentItem,
  type PlayerTripDocumentItem,
  useTripDocuments,
} from '@/queries/useTripDocuments';
import { useConfirmDocument } from '@/mutations/useConfirmDocument';
import { useEmergencyInfo } from '@/queries/useEmergencyInfo';
import { usePredeparture } from '@/queries/usePredeparture';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
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
const MIN_TOUCH_TARGET = 48; // WCAG minimum touch target

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
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('TripDetailScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<EventsStackParamList, 'TripDetail'>>();
  const route = useRoute<RouteProp<EventsStackParamList, 'TripDetail'>>();
  const { tripId, eventId: paramEventId } = route.params;
  const teamId = useTeamStore((s) => s.activeTeamId);
  const role = useTeamStore((s) => s.role);
  const isOffline = useUiStore((s) => s.isOffline);
  const addToast = useUiStore((s) => s.addToast);
  const { teamMemberId } = useCurrentMember();
  const queryClient = useQueryClient();

  const listRef = useRef<FlatList>(null);
  const squadSectionY = useRef(0);
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
  const [postponeSheetOpen, setPostponeSheetOpen] = useState(false);
  const [postponeDepartureIso, setPostponeDepartureIso] = useState('');
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [breakdownItem, setBreakdownItem] = useState<CoordinatorTripDocumentItem | null>(null);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addItemName, setAddItemName] = useState('');
  const [addItemApplicability, setAddItemApplicability] = useState<'allPlayers' | 'travelingSquad' | 'specific'>(
    'allPlayers',
  );
  const [specificSelected, setSpecificSelected] = useState<Record<string, boolean>>({});
  const [confirmingItemId, setConfirmingItemId] = useState<string | null>(null);
  const [customItemSheetOpen, setCustomItemSheetOpen] = useState(false);
  const [customItemLabel, setCustomItemLabel] = useState('');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const handledUnavailable = useRef(false);
  const isFocused = useIsFocused();

  const { eventId, isResolving, resolveError } = useTripEventId(teamId, tripId, paramEventId);

  const eventQuery = useQuery({
    queryKey: ['eventDetail', teamId, eventId],
    queryFn: async () => {
      const { data } = await api.get<ApiEventListItem>(`/teams/${teamId}/events/${eventId}`);
      return data;
    },
    enabled: Boolean(teamId && eventId),
  });

  const tripQuery = useQuery({
    queryKey: ['tripWorkspace', eventId],
    queryFn: async () => {
      const { data } = await api.get<TripWorkspaceApi>(`/events/${eventId}/trip`);
      return data;
    },
    enabled: Boolean(eventId),
  });

  const squadQuery = useQuery({
    queryKey: ['tripSquad', eventId],
    queryFn: async () => {
      const { data } = await api.get<{ assignments: SquadAssignmentApi[] }>(`/events/${eventId}/trip/squad`);
      return data.assignments;
    },
    enabled: Boolean(eventId),
  });

  const eventRow = eventQuery.data;
  const trip = tripQuery.data;
  const squad = squadQuery.data ?? [];

  const isCoordinator = role === 'coordinator';
  const isPlayer = role === 'player';
  const staffVariant = role === 'coordinator' || role === 'coach' || role === 'staff';

  const isCancelled = eventRow?.status === 'cancelled';

  const documentsQuery = useTripDocuments(eventId ?? null);
  const predepartureQuery = usePredeparture(eventId ?? null, isCoordinator && isFocused);
  const confirmDocument = useConfirmDocument(eventId ?? null);

  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) {
        throw new Error('eventId required');
      }
      const specificMemberIds =
        addItemApplicability === 'specific'
          ? Object.entries(specificSelected)
              .filter(([, v]) => v)
              .map(([id]) => id)
          : [];
      await api.post(`/events/${eventId}/trip/documents`, {
        name: addItemName.trim(),
        applicability: addItemApplicability,
        specificMemberIds,
      });
    },
    onSuccess: async () => {
      setAddItemOpen(false);
      setAddItemName('');
      setAddItemApplicability('allPlayers');
      setSpecificSelected({});
      await queryClient.invalidateQueries({ queryKey: ['tripDocuments', eventId] });
    },
    onError: () => {
      addToast('error', "Couldn't save — check your connection and try again.");
    },
  });

  const remindMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) {
        throw new Error('eventId required');
      }
      const { data } = await api.post<{ remindedCount: number }>(`/events/${eventId}/trip/documents/remind`);
      return data.remindedCount;
    },
    onSuccess: (n: number) => {
      addToast('success', `Reminder sent to ${n} members`);
    },
    onError: () => addToast('error', "Couldn't save — check your connection and try again."),
  });

  const documentsOutstanding = useMemo(() => {
    const r = documentsQuery.data;
    if (!r || r.items.length === 0) {
      return 0;
    }
    if (isAggregateDocumentsResponse(r)) {
      return r.items.reduce((acc, it) => acc + Math.max(0, it.totalApplicable - it.confirmedCount), 0);
    }
    return r.items.reduce((acc, it) => acc + (it.isConfirmedByCurrentUser ? 0 : 1), 0);
  }, [documentsQuery.data]);

  const hasOutstandingMembers = useMemo(() => {
    const r = documentsQuery.data;
    if (!r || r.items.length === 0) {
      return false;
    }
    if (!isAggregateDocumentsResponse(r)) {
      return false;
    }
    return documentsOutstanding > 0;
  }, [documentsOutstanding, documentsQuery.data]);

  useEffect(() => {
    if (handledUnavailable.current) {
      return;
    }
    const err404 = (e: unknown) => axios.isAxiosError(e) && e.response?.status === 404;
    if (eventQuery.isError && err404(eventQuery.error)) {
      handledUnavailable.current = true;
      addToast('error', 'This trip is no longer available.');
      navigation.navigate('EventsList');
      return;
    }
    if (tripQuery.isError && err404(tripQuery.error)) {
      handledUnavailable.current = true;
      addToast('error', 'This trip is no longer available.');
      navigation.navigate('EventsList');
      return;
    }
    if (trip && trip.id !== tripId) {
      handledUnavailable.current = true;
      addToast('error', 'This trip is no longer available.');
      navigation.navigate('EventsList');
    }
  }, [
    addToast,
    eventQuery.error,
    eventQuery.isError,
    navigation,
    trip,
    tripId,
    tripQuery.error,
    tripQuery.isError,
  ]);

  const myAssignment = useMemo(
    () => squad.find((a) => a.teamMemberId === teamMemberId),
    [squad, teamMemberId],
  );

  const travelingSquad = useMemo(() => squad.filter((a) => a.travelingStatus === 'traveling'), [squad]);

  // Prefetch emergency info for offline access (staff variants only).
  useEffect(() => {
    if (!eventId || !trip?.id || !staffVariant || travelingSquad.length === 0) {
      return;
    }
    if (isOffline) {
      return;
    }
    for (const m of travelingSquad) {
      void queryClient.prefetchQuery({
        queryKey: ['emergencyInfo', trip.id, m.teamMemberId],
        queryFn: async () => {
          const { data } = await api.get(`/events/${eventId}/trip/squad/${m.teamMemberId}/emergency`);
          return data;
        },
      });
    }
  }, [eventId, isOffline, queryClient, staffVariant, travelingSquad, trip?.id]);

  const ackSummary = useMemo(() => {
    const pool = travelingSquad.filter((a) => a.onboardingState === 'active');
    const v = trip?.itineraryVersion ?? 0;
    const done = pool.filter((a) => a.acknowledgedItineraryVersion === v).length;
    return { done, total: pool.length };
  }, [travelingSquad, trip?.itineraryVersion]);

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/events/${eventId}/cancel`);
    },
    onSuccess: () => {
      const daysUntilTrip =
        eventRow?.date ? Math.max(0, Math.floor((new Date(`${eventRow.date}T00:00:00`).getTime() - Date.now()) / 86400000)) : 0;
      analytics.track('trip_cancelled', { daysUntilTrip });
      void queryClient.invalidateQueries({ queryKey: ['teamEvents'] });
      if (teamId && eventId) {
        void queryClient.invalidateQueries({ queryKey: ['eventDetail', teamId, eventId] });
      }
      void queryClient.invalidateQueries({ queryKey: ['tripWorkspace', eventId] });
      void queryClient.invalidateQueries({ queryKey: ['tripSquad', eventId] });
      setCancelSheetOpen(false);
      navigation.navigate('EventsList');
    },
    onError: (e: unknown) => {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        addToast('error', 'This trip is already cancelled.');
        void queryClient.invalidateQueries({ queryKey: ['teamEvents'] });
        setCancelSheetOpen(false);
        navigation.navigate('EventsList');
        return;
      }
      addToast('error', 'Could not cancel trip.');
    },
  });

  const postponeMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) {
        throw new Error('eventId required');
      }
      let newDate: string | undefined;
      let newTime: string | undefined;
      if (postponeDepartureIso.trim()) {
        const d = new Date(postponeDepartureIso);
        newDate = d.toISOString().slice(0, 10);
        newTime = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
      }
      await api.post(`/events/${eventId}/postpone`, { newDate, newTime });
    },
    onSuccess: async () => {
      analytics.track('trip_postponed', { hasNewDate: Boolean(postponeDepartureIso.trim()) });
      setPostponeSheetOpen(false);
      setPostponeDepartureIso('');
      addToast('success', 'Trip postponed. Members have been notified.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teamEvents'] }),
        queryClient.invalidateQueries({ queryKey: ['eventDetail', teamId, eventId] }),
        queryClient.invalidateQueries({ queryKey: ['tripWorkspace', eventId] }),
        queryClient.invalidateQueries({ queryKey: ['tripSquad', eventId] }),
      ]);
    },
    onError: (e: unknown) => {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        addToast('error', 'This trip is already postponed or cancelled.');
        return;
      }
      addToast('error', "Couldn't save — check your connection and try again.");
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) {
        throw new Error('eventId required');
      }
      await api.post(`/events/${eventId}/trip/publish`);
    },
    onSuccess: async () => {
      addToast('success', 'Trip published');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teamEvents'] }),
        queryClient.invalidateQueries({ queryKey: ['eventDetail', teamId, eventId] }),
        queryClient.invalidateQueries({ queryKey: ['tripWorkspace', eventId] }),
        queryClient.invalidateQueries({ queryKey: ['tripSquad', eventId] }),
      ]);
    },
    onError: () => {
      addToast('error', 'Could not publish trip.');
    },
  });

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

  const openCoordinatorMenu = useCallback(() => {
    if (isOffline) {
      Alert.alert('Offline', 'Available when connected');
      return;
    }
    if (isCancelled) {
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
        text: 'Postpone trip',
        onPress: () => {
          setTimeout(() => setPostponeSheetOpen(true), 300);
        },
      },
      {
        text: 'Cancel trip',
        style: 'destructive',
        onPress: () => {
          setTimeout(() => setCancelSheetOpen(true), 350);
        },
      },
      { text: 'Close', style: 'cancel' },
    ]);
  }, [eventId, isCancelled, isOffline, navigation, tripId]);

  useLayoutEffect(() => {
    if (!isCoordinator || isCancelled) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={openCoordinatorMenu}
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
  }, [isCoordinator, isCancelled, navigation, openCoordinatorMenu]);

  const eventLoading = eventQuery.isLoading;
  const tripLoading = tripQuery.isLoading;
  const squadLoading = squadQuery.isLoading;

  const loading =
    isResolving ||
    !eventId ||
    eventLoading ||
    tripLoading ||
    (staffVariant && squadLoading && !isOffline);

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
          {isCoordinator && eventRow.status === 'draft' ? (
            <View
              style={{
                backgroundColor: color.actionPrimary,
                borderRadius: radius.md,
                padding: spacing.space16,
                marginBottom: spacing.space16,
              }}
            >
              <Text variant="label" colorToken={color.actionOnPrimary} style={{ marginBottom: spacing.space8 }}>
                Ready to publish?
              </Text>
              <LoadingButton
                label="Publish now →"
                isLoading={publishMutation.status === 'pending'}
                onPress={() => {
                  if (isOffline) {
                    addToast('error', 'Available when connected');
                    return;
                  }
                  void publishMutation.mutateAsync();
                }}
              />
            </View>
          ) : null}
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
              borderRadius: radius.sm,
              backgroundColor: st.bg,
            }}
          >
            <Text variant="caption" style={{ color: st.fg }}>
              {st.label}
            </Text>
          </View>
        </View>

        {isCancelled ? (
          <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
            This trip has been cancelled
          </Text>
        ) : null}

        <Pressable onPress={scrollToItinerary} accessibilityRole="button" disabled={isCancelled}>
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

        {!isPlayer && !isCancelled && trip.isPublished ? (
          <Text variant="caption" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
            {ackSummary.total === 0
              ? 'No active traveling members to acknowledge yet'
              : `${ackSummary.done} of ${ackSummary.total} acknowledged`}
          </Text>
        ) : null}

        {isPlayer && !isCancelled ? (
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
    isCancelled,
    isPlayer,
    myAssignment,
    onSquadSectionLayout,
    renderOptional,
    scrollToItinerary,
    scrollToSquad,
    travelingSquad.length,
    trip,
  ]);

  if (resolveError && !eventId) {
    return (
      <ScreenContainer scrollable>
        <Text variant="body">Trip could not be loaded.</Text>
      </ScreenContainer>
    );
  }

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
            <View>
              <Pressable
                disabled={!staffVariant}
                onPress={() => {
                  if (!staffVariant) {
                    return;
                  }
                  setExpandedMemberId((cur) => (cur === item.teamMemberId ? null : item.teamMemberId));
                }}
                accessibilityRole={staffVariant ? 'button' : undefined}
              >
                <SquadMemberRow
                  variant={isPlayer ? 'player' : 'staff'}
                  name={item.memberName}
                  role={item.memberRole}
                  travelingStatus={item.travelingStatus}
                  itineraryVersion={trip.itineraryVersion}
                  acknowledgedItineraryVersion={item.acknowledgedItineraryVersion}
                  onboardingState={item.onboardingState}
                />
              </Pressable>

              {staffVariant && expandedMemberId === item.teamMemberId ? (
                <View style={{ paddingVertical: spacing.space12 }}>
                  <EmergencyInfoInline eventId={eventId} tripWorkspaceId={trip.id} memberId={item.teamMemberId} />
                </View>
              ) : null}
            </View>
          )}
          ListFooterComponent={
            <View style={{ paddingHorizontal: spacing.space16, paddingTop: spacing.space24 }}>
              <SectionHeader
                title="Documents"
                count={documentsOutstanding > 0 ? documentsOutstanding : undefined}
                statusDotColor={documentsOutstanding === 0 && (documentsQuery.data?.items?.length ?? 0) > 0 ? color.stateSuccess : undefined}
                statusDotA11yLabel={documentsOutstanding === 0 ? 'All confirmed' : undefined}
                actionLabel={isCoordinator ? 'Add item' : undefined}
                onActionPress={
                  isCoordinator
                    ? () => {
                        if (isOffline) {
                          addToast('error', 'Available when connected');
                          return;
                        }
                        setAddItemOpen(true);
                      }
                    : undefined
                }
              />

              {documentsQuery.isLoading ? (
                <SkeletonLoader variant="card" style={{ marginBottom: spacing.space12 }} />
              ) : isPlayer ? (
                <>
                  {!documentsQuery.data || documentsQuery.data.items.length === 0 ? (
                    <Text variant="body" colorToken={color.textSecondary} style={{ paddingVertical: spacing.space12 }}>
                      No documents required for you
                    </Text>
                  ) : (
                    (documentsQuery.data.items as PlayerTripDocumentItem[]).map((it) => (
                      <PlayerChecklistItem
                        key={it.id}
                        itemName={it.name}
                        isConfirmed={it.isConfirmedByCurrentUser}
                        isBlocked={Boolean(myAssignment && myAssignment.onboardingState !== 'active')}
                        isConfirming={confirmingItemId === it.id && confirmDocument.status === 'pending'}
                        onConfirm={() => {
                          if (isOffline) {
                            addToast('error', 'Available when connected');
                            return;
                          }
                          setConfirmingItemId(it.id);
                          void confirmDocument.mutateAsync(it.id).finally(() => setConfirmingItemId(null));
                        }}
                      />
                    ))
                  )}
                </>
              ) : staffVariant ? (
                <>
                  {!documentsQuery.data || documentsQuery.data.items.length === 0 ? (
                    <Text variant="body" colorToken={color.textSecondary} style={{ paddingVertical: spacing.space12 }}>
                      No documents required for this trip yet.
                    </Text>
                  ) : (
                    (documentsQuery.data.items as CoordinatorTripDocumentItem[]).map((it) => (
                      <CoordinatorChecklistItem
                        key={it.id}
                        itemName={it.name}
                        confirmedCount={it.confirmedCount}
                        totalApplicable={it.totalApplicable}
                        onViewBreakdown={() => {
                          setBreakdownItem(it);
                          setBreakdownOpen(true);
                        }}
                      />
                    ))
                  )}
                  {isCoordinator && hasOutstandingMembers ? (
                    <View style={{ marginTop: spacing.space16 }}>
                      <LoadingButton
                        label="Remind members with outstanding items"
                        isLoading={remindMutation.status === 'pending'}
                        disabled={isOffline}
                        onPress={() => {
                          if (isOffline) {
                            addToast('error', 'Available when connected');
                            return;
                          }
                          void remindMutation.mutateAsync();
                        }}
                      />
                    </View>
                  ) : null}
                </>
              ) : null}

              <View style={{ height: spacing.space32 }} />

              {isCoordinator ? (
                <View>
                  <SectionHeader title="Pre-Departure Checklist" />
                  {(predepartureQuery.data?.fixedItems ?? []).map((item) => (
                    <PreDepartureChecklistItem
                      key={item.key}
                      label={item.label}
                      isComplete={item.isComplete}
                      isAutoPopulated
                      currentCount={item.currentCount}
                      totalCount={item.totalCount}
                      onViewDetail={() => {
                        if (item.key === 'itineraryAcknowledged') {
                          scrollToItinerary();
                          return;
                        }
                        scrollToSquad();
                      }}
                    />
                  ))}
                  {(predepartureQuery.data?.customItems ?? []).map((item) => (
                    <PreDepartureChecklistItem
                      key={item.id}
                      label={item.label}
                      isComplete={item.isComplete}
                      isAutoPopulated={false}
                      onToggle={() => {
                        if (isOffline) {
                          addToast('error', 'Available when connected');
                          return;
                        }
                        const current = predepartureQuery.data?.customItems ?? [];
                        const next = current.map((c) =>
                          c.id === item.id ? { ...c, isComplete: !c.isComplete } : c,
                        );
                        void api
                          .patch(`/events/${eventId}/trip/predeparture`, { items: next })
                          .then(() => queryClient.invalidateQueries({ queryKey: ['predeparture', eventId] }))
                          .catch(() =>
                            addToast('error', "Couldn't save — check your connection and try again."),
                          );
                      }}
                    />
                  ))}
                  <View style={{ marginTop: spacing.space12 }}>
                    <LoadingButton
                      label="Add custom item"
                      isLoading={false}
                      disabled={isOffline || (predepartureQuery.data?.customItems.length ?? 0) >= 5}
                      onPress={() => {
                        if (isOffline) {
                          addToast('error', 'Available when connected');
                          return;
                        }
                        setCustomItemSheetOpen(true);
                      }}
                    />
                  </View>
                  <Text
                    variant="caption"
                    colorToken={
                      (predepartureQuery.data?.fixedItems ?? []).every((i) => i.isComplete)
                        ? color.stateSuccess
                        : color.textSecondary
                    }
                    style={{ marginTop: spacing.space8 }}
                  >
                    {(predepartureQuery.data?.fixedItems ?? []).every((i) => i.isComplete)
                      ? 'Ready to depart'
                      : `${(predepartureQuery.data?.fixedItems ?? []).filter((i) => !i.isComplete).length} outstanding items`}
                  </Text>
                </View>
              ) : null}
            </View>
          }
          contentContainerStyle={{ paddingBottom: spacing.space32 }}
        />
      </View>

      <ConfirmationSheet
        visible={cancelSheetOpen}
        title="Cancel this trip"
        body="All assigned members will be notified. This cannot be undone."
        confirmLabel="Yes, cancel trip"
        cancelLabel="Go back"
        isDestructive
        onCancel={() => setCancelSheetOpen(false)}
        onConfirm={() => {
          if (!eventId || isOffline) {
            addToast('error', 'Available when connected');
            return Promise.resolve();
          }
          return cancelMutation.mutateAsync();
        }}
      />

      <BottomSheet visible={postponeSheetOpen} onClose={() => setPostponeSheetOpen(false)}>
        <Text variant="title" style={{ marginBottom: spacing.space8 }}>
          Postpone this trip?
        </Text>
        <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space12 }}>
          All assigned members will be notified.
        </Text>
        <DateTimePickerField
          label="New departure date/time (optional)"
          valueIso={postponeDepartureIso}
          onChange={setPostponeDepartureIso}
          optional
        />
        <LoadingButton
          label="Yes, postpone trip"
          isLoading={postponeMutation.status === 'pending'}
          disabled={isOffline}
          onPress={() => {
            if (isOffline) {
              addToast('error', 'Available when connected');
              return;
            }
            void postponeMutation.mutateAsync();
          }}
        />
        <Pressable
          onPress={() => setPostponeSheetOpen(false)}
          style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text variant="label" colorToken={color.actionPrimary}>
            Go back
          </Text>
        </Pressable>
      </BottomSheet>

      <BottomSheet visible={customItemSheetOpen} onClose={() => setCustomItemSheetOpen(false)}>
        <Text variant="title" style={{ marginBottom: spacing.space8 }}>
          Add custom item
        </Text>
        <TextInput label="Item label" value={customItemLabel} onChangeText={setCustomItemLabel} />
        <LoadingButton
          label="Add"
          isLoading={false}
          disabled={!customItemLabel.trim()}
          onPress={() => {
            const label = customItemLabel.trim();
            if (!label) {
              return;
            }
            const current = predepartureQuery.data?.customItems ?? [];
            const next = [...current, { label, isComplete: false }];
            void api
              .patch(`/events/${eventId}/trip/predeparture`, { items: next })
              .then(() => {
                setCustomItemLabel('');
                setCustomItemSheetOpen(false);
                return queryClient.invalidateQueries({ queryKey: ['predeparture', eventId] });
              })
              .catch(() => addToast('error', "Couldn't save — check your connection and try again."));
          }}
        />
      </BottomSheet>

      <BottomSheet
        visible={breakdownOpen}
        onClose={() => {
          setBreakdownOpen(false);
          setBreakdownItem(null);
        }}
      >
        <Text variant="title" style={{ marginBottom: spacing.space12 }}>
          {breakdownItem?.name ?? 'Document'}
        </Text>
        {(breakdownItem?.confirmations ?? []).map((c) => {
          const pending = c.onboardingState !== 'active';
          const confirmed = c.confirmedAt !== null;
          const status = pending ? 'Awaiting app setup' : confirmed ? 'Confirmed' : 'Not confirmed';
          const fg = pending ? color.textSecondary : confirmed ? color.stateSuccess : color.stateWarning;
          return (
            <View
              key={c.teamMemberId}
              style={{
                paddingVertical: spacing.space12,
                borderBottomWidth: 1,
                borderBottomColor: color.borderSubtle,
              }}
            >
              <Text variant="body">{c.memberName}</Text>
              <Text variant="caption" colorToken={fg}>
                {status}
              </Text>
            </View>
          );
        })}
      </BottomSheet>

      <BottomSheet visible={addItemOpen} onClose={() => setAddItemOpen(false)}>
        <Text variant="title" style={{ marginBottom: spacing.space12 }}>
          Add document item
        </Text>
        <TextInput label="Item name" value={addItemName} onChangeText={setAddItemName} />

        <Text variant="label" colorToken={color.textLabel} style={{ marginBottom: spacing.space8 }}>
          Applies to
        </Text>
        {(['allPlayers', 'travelingSquad', 'specific'] as const).map((opt) => {
          const selected = addItemApplicability === opt;
          const label = opt === 'allPlayers' ? 'All players' : opt === 'travelingSquad' ? 'Traveling squad' : 'Specific members';
          return (
            <Pressable
              key={opt}
              onPress={() => setAddItemApplicability(opt)}
              accessibilityRole="button"
              style={{
                paddingVertical: spacing.space12,
                borderBottomWidth: 1,
                borderBottomColor: color.borderSubtle,
              }}
            >
              <Text variant="body" style={{ color: selected ? color.actionPrimary : color.textPrimary }}>
                {label}
              </Text>
            </Pressable>
          );
        })}

        {addItemApplicability === 'specific' ? (
          <View style={{ marginTop: spacing.space12 }}>
            <Text variant="label" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
              Select members
            </Text>
            {travelingSquad.map((m) => {
              const checked = Boolean(specificSelected[m.teamMemberId]);
              return (
                <Pressable
                  key={m.teamMemberId}
                  onPress={() =>
                    setSpecificSelected((cur) => ({ ...cur, [m.teamMemberId]: !cur[m.teamMemberId] }))
                  }
                  accessibilityRole="button"
                  style={{
                    paddingVertical: spacing.space12,
                    borderBottomWidth: 1,
                    borderBottomColor: color.borderSubtle,
                  }}
                >
                  <Text variant="body">
                    {checked ? '✓ ' : ''}{m.memberName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={{ marginTop: spacing.space16 }}>
          <LoadingButton
            label="Add item"
            isLoading={addItemMutation.status === 'pending'}
            disabled={
              isOffline ||
              !addItemName.trim() ||
              (addItemApplicability === 'specific' &&
                Object.values(specificSelected).filter(Boolean).length === 0)
            }
            onPress={() => {
              if (isOffline) {
                addToast('error', 'Available when connected');
                return;
              }
              void addItemMutation.mutateAsync();
            }}
          />
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
}

function EmergencyInfoInline(props: {
  eventId: string | null;
  tripWorkspaceId: string | null;
  memberId: string | null;
}): React.ReactElement | null {
  const { eventId, tripWorkspaceId, memberId } = props;
  const isOffline = useUiStore((s) => s.isOffline);
  const q = useEmergencyInfo({ eventId, tripWorkspaceId, memberId });

  if (q.isLoading) {
    return <SkeletonLoader variant="card" style={{ marginBottom: spacing.space12 }} />;
  }

  if (q.isError) {
    const is404 = axios.isAxiosError(q.error) && q.error.response?.status === 404;
    return (
      <Text variant="body" colorToken={color.textSecondary}>
        {is404 ? 'Emergency info not on file for this member.' : "Couldn't load — check your connection and try again."}
      </Text>
    );
  }

  if (!q.data) {
    return null;
  }

  const lastSynced = q.dataUpdatedAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(q.dataUpdatedAt))
    : null;

  return (
    <View>
      <EmergencyInfoCard
        contactName={q.data.contactName}
        contactPhone={q.data.contactPhone}
        allergyAlert={q.data.allergyAlert}
        staffNote={q.data.staffNote}
        updatedAt={q.data.updatedAt}
        isStale={q.data.isStale}
      />
      {isOffline && lastSynced ? (
        <Text variant="caption" colorToken={color.textSecondary} style={{ marginTop: spacing.space8 }}>
          Last updated {lastSynced}
        </Text>
      ) : null}
    </View>
  );
}
