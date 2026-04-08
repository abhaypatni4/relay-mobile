import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
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
  const handled404 = useRef(false);
  const { teamMemberId } = useCurrentMember();

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
      <Text variant="title" style={{ marginBottom: spacing.space8 }}>
        {d.name}
      </Text>
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
              {window && !window.isLocked && !mySubmission?.availabilityStatus ? (
                <Pressable onPress={openSubmission} accessibilityRole="button">
                  <Text variant="label" colorToken={color.actionPrimary}>
                    Confirm your availability
                  </Text>
                </Pressable>
              ) : null}
              {window && !window.isLocked && mySubmission?.availabilityStatus ? (
                <View>
                  <Text variant="body" style={{ marginBottom: spacing.space8 }}>
                    Your status: {availabilityLabel(mySubmission.availabilityStatus)}
                  </Text>
                  <Pressable onPress={openSubmission} accessibilityRole="button">
                    <Text variant="label" colorToken={color.actionPrimary}>
                      Change response
                    </Text>
                  </Pressable>
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
            </>
          ) : null}
          {role === 'coach' || role === 'coordinator' ? (
            <View>
              {window ? (
                <>
                  <Text variant="body" style={{ marginBottom: spacing.space8 }}>
                    {`${String(submittedCount)} of ${String(totalPlayers)} submitted`}
                  </Text>
                  <Pressable onPress={openRoster} accessibilityRole="button">
                    <Text variant="label" colorToken={color.actionPrimary}>
                      Open availability roster
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Text variant="body" colorToken={color.textSecondary}>
                  Availability window is not open yet.
                </Text>
              )}
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
