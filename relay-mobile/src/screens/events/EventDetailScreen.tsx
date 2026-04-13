import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { SkeletonLoader } from '@/components/feedback/SkeletonLoader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import type { ApiEventListItem } from '@/hooks/useTeamEvents';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useAvailability } from '@/queries/useAvailability';
import { useSubmitAvailability } from '@/mutations/useSubmitAvailability';
import { useSendSelectionNotifications } from '@/mutations/useSendSelectionNotifications';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { EventsStackParamList } from '@/types/navigation';
import type { AvailabilityStatus } from '@/types/models';

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
}

function statusPresentation(status: string): { label: string; bg: string; fg: string } {
  switch (status) {
    case 'cancelled':
      return { label: 'Cancelled', fg: color.stateError, bg: color.surfaceInput };
    case 'postponed':
      return { label: 'Postponed', fg: color.stateWarning, bg: color.surfaceInput };
    default:
      return { label: status, fg: color.textSecondary, bg: color.surfaceInput };
  }
}

function typeBadgeColors(type: string): { bg: string; fg: string } {
  if (type === 'match') {
    return { bg: color.surfaceInput, fg: color.stateWarning };
  }
  if (type === 'training') {
    return { bg: color.surfaceInput, fg: color.actionPrimary };
  }
  return { bg: color.surfaceInput, fg: color.textSecondary };
}

function availabilityLabel(s: AvailabilityStatus | null): string {
  if (s === null) {
    return 'Not submitted';
  }
  if (s === 'available') {
    return 'Available';
  }
  if (s === 'limited') {
    return 'Limited';
  }
  return 'Unavailable';
}

function availabilityBadge(s: AvailabilityStatus): { label: string; bg: string } {
  if (s === 'available') {
    return { label: '✓ Available', bg: color.stateSuccess };
  }
  if (s === 'limited') {
    return { label: '~ Limited', bg: color.stateWarning };
  }
  return { label: '✗ Unavailable', bg: color.stateError };
}

export function EventDetailScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('EventDetailScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<EventsStackParamList, 'EventDetail'>>();
  const route = useRoute<RouteProp<EventsStackParamList, 'EventDetail'>>();
  const { eventId } = route.params;
  const teamId = useTeamStore((s) => s.activeTeamId);
  const role = useTeamStore((s) => s.role);
  const addToast = useUiStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const handled404 = useRef(false);
  const { teamMemberId } = useCurrentMember();

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['availability', eventId] });
    }, [eventId, queryClient]),
  );

  const q = useQuery({
    queryKey: ['eventDetail', teamId, eventId],
    queryFn: async () => {
      const { data } = await api.get<ApiEventListItem & { tripWorkspace?: { id: string } }>(
        `/teams/${teamId}/events/${eventId}`,
      );
      return data;
    },
    enabled: Boolean(teamId && eventId),
  });

  const isMatchOrTraining = q.data?.type === 'match' || q.data?.type === 'training';
  const availQ = useAvailability(isMatchOrTraining ? eventId : null);
  console.log('[EventDetail] eventId:', eventId);
  console.log('[EventDetail] availability:', availQ.data);
  const submitMutation = useSubmitAvailability(eventId);
  const notifyMutation = useSendSelectionNotifications(eventId);
  const openWindowMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/events/${eventId}/availability/open`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['availability', eventId] });
      addToast('success', 'Availability window opened');
    },
    onError: () => addToast('error', "Couldn't open availability."),
  });
  const lockWindowMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/events/${eventId}/availability/lock`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['availability', eventId] });
      addToast('success', 'Availability locked');
    },
    onError: () => addToast('error', "Couldn't lock availability."),
  });

  const mySubmission = useMemo(
    () => availQ.data?.submissions.find((s) => s.teamMemberId === teamMemberId),
    [availQ.data?.submissions, teamMemberId],
  );

  useEffect(() => {
    const d = q.data;
    if (d?.type === 'trip' && d.tripWorkspace?.id) {
      navigation.replace('TripDetail', { tripId: d.tripWorkspace.id, eventId: d.id });
    }
  }, [navigation, q.data]);

  useEffect(() => {
    if (handled404.current) {
      return;
    }
    if (q.isError && axios.isAxiosError(q.error) && q.error.response?.status === 404) {
      handled404.current = true;
      addToast('error', 'This event is no longer available.');
      navigation.navigate('EventsList');
    }
  }, [addToast, navigation, q.error, q.isError]);

  const openSubmission = useCallback(() => {
    navigation.navigate('AvailabilitySubmission', { eventId });
  }, [eventId, navigation]);

  const openRoster = useCallback(() => {
    navigation.navigate('AvailabilityRoster', { eventId });
  }, [eventId, navigation]);

  if (q.isError) {
    const st = axios.isAxiosError(q.error) ? q.error.response?.status : undefined;
    if (st === 404) {
      return <View style={{ flex: 1 }} />;
    }
    return (
      <ScreenContainer scrollable>
        <Text variant="body">Could not load this event.</Text>
      </ScreenContainer>
    );
  }

  if (q.isPending || !q.data) {
    return (
      <ScreenContainer scrollable>
        <SkeletonLoader variant="card" style={{ marginBottom: spacing.space12 }} />
        <SkeletonLoader variant="card" />
      </ScreenContainer>
    );
  }

  const d = q.data;
  if (d.type === 'trip' && d.tripWorkspace?.id) {
    return (
      <ScreenContainer scrollable>
        <SkeletonLoader variant="card" />
      </ScreenContainer>
    );
  }

  const st = statusPresentation(d.status);
  const window = availQ.data?.window ?? null;
  const submissions = availQ.data?.submissions ?? [];
  const submittedCount = submissions.filter((s) => s.availabilityStatus !== null).length;
  const totalPlayers = submissions.length;
  const availabilityCounts = useMemo(() => {
    let available = 0;
    let limited = 0;
    let unavailable = 0;
    let notSubmitted = 0;
    for (const s of submissions) {
      if (s.availabilityStatus === 'available') {
        available += 1;
      } else if (s.availabilityStatus === 'limited') {
        limited += 1;
      } else if (s.availabilityStatus === 'unavailable') {
        unavailable += 1;
      } else {
        notSubmitted += 1;
      }
    }
    return { available, limited, unavailable, notSubmitted };
  }, [submissions]);

  const selectionLine = useMemo(() => {
    if (!window?.selectionNotificationsSentAt || !mySubmission) {
      return null;
    }
    const o = mySubmission.selectionOutcome;
    if (o === 'selected') {
      return 'You have been selected for this event.';
    }
    if (o === 'notSelected') {
      return 'You are not selected for this event.';
    }
    return null;
  }, [mySubmission, window?.selectionNotificationsSentAt]);

  return (
    <ScreenContainer scrollable>
      <Text variant="display" style={{ marginBottom: spacing.space8 }}>
        {d.name}
      </Text>
      <View
        style={{
          alignSelf: 'flex-start',
          paddingHorizontal: spacing.space8,
          paddingVertical: spacing.space4,
          borderRadius: radius.sm,
          backgroundColor: typeBadgeColors(d.type).bg,
          marginBottom: spacing.space8,
        }}
      >
        <Text variant="caption" style={{ color: typeBadgeColors(d.type).fg }}>
          {d.type === 'match' ? 'Match' : d.type === 'training' ? 'Training' : 'Trip'}
        </Text>
      </View>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
        {formatDate(d.date)} · {d.startTime}
        {d.location ? ` · ${d.location}` : ''}
      </Text>
      {d.status === 'cancelled' || d.status === 'postponed' ? (
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: spacing.space8,
            paddingVertical: spacing.space4,
            borderRadius: radius.sm,
            backgroundColor: st.bg,
            marginBottom: spacing.space24,
          }}
        >
          <Text variant="caption" style={{ color: st.fg }}>
            {st.label}
          </Text>
        </View>
      ) : (
        <View style={{ height: spacing.space8 }} />
      )}

      {isMatchOrTraining ? (
        <View style={{ marginBottom: spacing.space24 }}>
          <Text variant="title" style={{ marginBottom: spacing.space12 }}>
            Availability
          </Text>
          {role === 'player' ? (
            <>
              {!window ? (
                <Text variant="body" colorToken={color.textSecondary}>
                  Availability not yet open
                </Text>
              ) : null}
              {window && mySubmission?.availabilityStatus ? (
                <View
                  style={{
                    alignSelf: 'flex-start',
                    borderRadius: spacing.space16,
                    backgroundColor: availabilityBadge(mySubmission.availabilityStatus).bg,
                    paddingHorizontal: spacing.space12,
                    paddingVertical: spacing.space8,
                    marginBottom: spacing.space12,
                  }}
                >
                  <Text variant="label" colorToken={color.actionOnPrimary}>
                    {availabilityBadge(mySubmission.availabilityStatus).label}
                  </Text>
                </View>
              ) : null}
              {window && !window.isLocked ? (
                <View style={{ marginBottom: spacing.space12 }}>
                  {(['available', 'limited', 'unavailable'] as const).map((status) => (
                    <Pressable
                      key={status}
                      onPress={() => submitMutation.mutate({ availabilityStatus: status, note: mySubmission?.note ?? null })}
                      style={{
                        minHeight: 64,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: color.borderDefault,
                        justifyContent: 'center',
                        paddingHorizontal: spacing.space16,
                        marginBottom: spacing.space8,
                        backgroundColor:
                          mySubmission?.availabilityStatus === status ? color.surfaceInput : color.surfaceElevated,
                      }}
                    >
                      <Text variant="label">{availabilityLabel(status)}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {window?.isLocked ? (
                <View>
                  <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
                    Availability is locked
                  </Text>
                  {mySubmission?.availabilityStatus ? (
                    <Text variant="body">
                      Your status: {availabilityLabel(mySubmission.availabilityStatus)}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {selectionLine ? (
                <Text variant="body" style={{ marginTop: spacing.space12 }}>
                  {selectionLine}
                </Text>
              ) : null}
              {window && !window.isLocked ? (
                <Pressable onPress={openSubmission} accessibilityRole="button">
                  <Text variant="label" colorToken={color.actionPrimary}>
                    Open full submission screen
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
          {role === 'coach' ? (
            <View>
              {window ? (
                <>
                  <Text variant="body" style={{ marginBottom: spacing.space8 }}>
                    {`${availabilityCounts.available} Available | ${availabilityCounts.limited} Limited | ${availabilityCounts.unavailable} Unavailable | ${availabilityCounts.notSubmitted} Not submitted`}
                  </Text>
                  <Pressable onPress={openRoster} accessibilityRole="button">
                    <Text variant="label" colorToken={color.actionPrimary}>
                      View full roster →
                    </Text>
                  </Pressable>
                  {window.selectionNotificationsSentAt ? (
                    <Text variant="caption" colorToken={color.stateSuccess} style={{ marginTop: spacing.space8 }}>
                      Selection sent
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text variant="body" colorToken={color.textSecondary}>
                  Availability window is not open yet.
                </Text>
              )}
            </View>
          ) : null}
          {role === 'coordinator' ? (
            <View>
              <Text variant="body" style={{ marginBottom: spacing.space8 }}>
                {`${availabilityCounts.available} Available | ${availabilityCounts.limited} Limited | ${availabilityCounts.unavailable} Unavailable | ${availabilityCounts.notSubmitted} Not submitted`}
              </Text>
              {!window ? (
                <Pressable onPress={() => openWindowMutation.mutate()} accessibilityRole="button">
                  <Text variant="label" colorToken={color.actionPrimary}>
                    Open availability window
                  </Text>
                </Pressable>
              ) : null}
              {window && !window.isLocked ? (
                <Pressable onPress={() => lockWindowMutation.mutate()} accessibilityRole="button">
                  <Text variant="label" colorToken={color.actionPrimary}>
                    Lock availability
                  </Text>
                </Pressable>
              ) : null}
              {window?.isLocked ? (
                <Pressable onPress={() => notifyMutation.mutate()} accessibilityRole="button">
                  <Text variant="label" colorToken={color.actionPrimary}>
                    Send selection notifications
                  </Text>
                </Pressable>
              ) : null}
              <Pressable onPress={openRoster} accessibilityRole="button">
                <Text variant="label" colorToken={color.actionPrimary} style={{ marginTop: spacing.space8 }}>
                  View roster →
                </Text>
              </Pressable>
            </View>
          ) : null}
          {role === 'staff' ? (
            <Text variant="body" colorToken={color.textSecondary}>
              Availability is managed by coaches.
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={{ marginBottom: spacing.space24 }}>
        <Text variant="title" style={{ marginBottom: spacing.space8 }}>
          Linked posts
        </Text>
        <Text variant="body" colorToken={color.textSecondary}>
          No linked posts yet.
        </Text>
      </View>
    </ScreenContainer>
  );
}
