import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { api } from '@/services/api';
import { useTeamStore } from '@/store/teamStore';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { ApiEventListItem } from '@/hooks/useTeamEvents';
import type { EventStatus, EventType, OnboardingState, TravelingStatus } from '@/types/models';

export interface EventCardProps {
  event: ApiEventListItem;
  onPress: () => void;
  onPublishTrip?: (event: ApiEventListItem) => void;
  isPublishing?: boolean;
}

function eventStartDate(e: ApiEventListItem): Date {
  const t = e.startTime.includes(':') ? e.startTime : `${e.startTime}:00`;
  const d = new Date(`${e.date}T${t}`);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

function typeBadgeColors(t: EventType): { bg: string; fg: string } {
  switch (t) {
    case 'trip':
      return { bg: color.surfaceInput, fg: color.actionPrimary };
    case 'match':
      return { bg: color.surfaceInput, fg: color.stateWarning };
    case 'training':
    default:
      return { bg: color.surfaceInput, fg: color.textSecondary };
  }
}

function typeLabel(t: EventType): string {
  switch (t) {
    case 'trip':
      return 'Trip';
    case 'match':
      return 'Match';
    case 'training':
      return 'Training';
    default:
      return t;
  }
}

function statusPresentation(s: EventStatus): { label: string; bg: string; fg: string } {
  switch (s) {
    case 'cancelled':
      return { label: 'Cancelled', bg: color.surfaceInput, fg: color.stateError };
    case 'postponed':
      return { label: 'Postponed', bg: color.surfaceInput, fg: color.stateWarning };
    case 'draft':
      return { label: 'Draft', bg: color.surfaceInput, fg: color.textSecondary };
    case 'complete':
      return { label: 'Complete', bg: color.surfaceInput, fg: color.textSecondary };
    case 'active':
    default:
      return { label: 'Active', bg: color.surfaceInput, fg: color.stateSuccess };
  }
}

export function EventCard({ event, onPress, onPublishTrip, isPublishing = false }: EventCardProps): React.ReactElement {
  const teamId = useTeamStore((s) => s.activeTeamId);
  const { role, teamMemberId } = useCurrentMember();
  const typeColors = useMemo(() => typeBadgeColors(event.type), [event.type]);
  const status = useMemo(() => statusPresentation(event.status), [event.status]);
  const statusAccent = useMemo(() => {
    if (event.status === 'cancelled') {
      return color.stateError;
    }
    if (event.status === 'postponed') {
      return color.stateWarning;
    }
    if (event.status === 'draft') {
      return color.stateWarning;
    }
    return color.actionPrimary;
  }, [event.status]);
  const cardOpacity = event.status === 'cancelled' ? 0.72 : event.status === 'postponed' || event.status === 'draft' ? 0.9 : 1;

  const tripMetaQuery = useQuery({
    queryKey: ['eventCardTripMeta', event.id, teamId],
    queryFn: async () => {
      if (!teamId) {
        return null;
      }
      const [{ data: detail }, { data: squadData }, { data: tripData }] = await Promise.all([
        api.get<ApiEventListItem & { tripWorkspace?: { id: string } }>(`/teams/${teamId}/events/${event.id}`),
        api.get<{ assignments: { teamMemberId: string; travelingStatus: TravelingStatus; acknowledgedItineraryVersion: number | null; onboardingState: OnboardingState }[] }>(
          `/events/${event.id}/trip/squad`,
        ),
        api.get<{ itineraryVersion: number }>(`/events/${event.id}/trip`),
      ]);
      if (!detail.tripWorkspace?.id) {
        return null;
      }
      return {
        itineraryVersion: tripData.itineraryVersion,
        assignments: squadData.assignments,
      };
    },
    enabled: Boolean(teamId && event.type === 'trip' && (role === 'coordinator' || role === 'player') && event.status === 'active'),
  });

  const coachAvailQuery = useQuery({
    queryKey: ['eventCardAvailability', event.id],
    queryFn: async () => {
      const { data } = await api.get<{ window: { id: string } | null; submissions: { availabilityStatus: string | null }[] }>(
        `/events/${event.id}/availability`,
      );
      return data;
    },
    enabled: Boolean(role === 'coach' && event.status === 'active' && (event.type === 'match' || event.type === 'training')),
  });

  const coordinatorConfirmed = useMemo(() => {
    const m = tripMetaQuery.data;
    if (!m) {
      return null;
    }
    const pool = m.assignments.filter((a) => a.travelingStatus === 'traveling' && a.onboardingState === 'active');
    const done = pool.filter((a) => a.acknowledgedItineraryVersion === m.itineraryVersion).length;
    return { done, total: pool.length };
  }, [tripMetaQuery.data]);

  const playerTripState = useMemo(() => {
    const m = tripMetaQuery.data;
    if (!m || !teamMemberId) {
      return null;
    }
    const me = m.assignments.find((a) => a.teamMemberId === teamMemberId);
    if (!me || me.travelingStatus !== 'traveling') {
      return 'not_traveling' as const;
    }
    const confirmed = me.acknowledgedItineraryVersion === m.itineraryVersion;
    return confirmed ? ('confirmed' as const) : ('needs_confirmation' as const);
  }, [teamMemberId, tripMetaQuery.data]);

  const when = useMemo(() => {
    const d = eventStartDate(event);
    if (d.getTime() === 0) {
      return `${event.date} · ${event.startTime}`;
    }
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  }, [event.date, event.startTime]);

  return (
    <Pressable
      onPress={onPress}
      style={{
        marginBottom: spacing.space12,
        padding: spacing.space16,
        borderRadius: radius.md,
        backgroundColor: color.surfaceElevated,
        borderWidth: 1,
        borderColor: color.borderSubtle,
        borderLeftWidth: spacing.space4,
        borderLeftColor: statusAccent,
        opacity: cardOpacity,
      }}
      accessibilityRole="button"
    >
      <Text variant="body" style={{ marginBottom: spacing.space8 }}>
        {event.name}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.space8 }}>
        <View
          style={{
            paddingHorizontal: spacing.space8,
            paddingVertical: spacing.space4,
            borderRadius: radius.sm,
            backgroundColor: typeColors.bg,
            marginRight: spacing.space8,
            marginBottom: spacing.space4,
          }}
        >
          <Text variant="caption" style={{ color: typeColors.fg }}>
            {typeLabel(event.type)}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: spacing.space8,
            paddingVertical: spacing.space4,
            borderRadius: radius.sm,
            backgroundColor: status.bg,
            marginBottom: spacing.space4,
          }}
        >
          <Text variant="caption" style={{ color: status.fg }}>
            {status.label}
          </Text>
        </View>
      </View>
      {role === 'coordinator' && event.type === 'trip' && event.status === 'draft' && onPublishTrip ? (
        <Pressable
          onPress={() => onPublishTrip(event)}
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: spacing.space12,
            paddingVertical: spacing.space8,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: color.actionPrimary,
            marginBottom: spacing.space8,
          }}
        >
          <Text variant="label" colorToken={color.actionPrimary}>
            {isPublishing ? 'Publishing...' : 'Publish trip →'}
          </Text>
        </Pressable>
      ) : null}
      {role === 'coordinator' && event.type === 'trip' && event.status === 'active' && coordinatorConfirmed ? (
        <Text variant="caption" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
          {coordinatorConfirmed.done}/{coordinatorConfirmed.total} confirmed
        </Text>
      ) : null}
      {role === 'player' && event.type === 'trip' && event.status === 'active' && playerTripState === 'confirmed' ? (
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: spacing.space12,
            paddingVertical: spacing.space8,
            borderRadius: spacing.space16,
            backgroundColor: color.stateSuccess,
            marginBottom: spacing.space8,
          }}
        >
          <Text variant="label" colorToken={color.actionOnPrimary}>
            ✓ Confirmed
          </Text>
        </View>
      ) : null}
      {role === 'player' && event.type === 'trip' && event.status === 'active' && playerTripState === 'needs_confirmation' ? (
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: spacing.space12,
            paddingVertical: spacing.space8,
            borderRadius: spacing.space16,
            backgroundColor: color.stateWarning,
            marginBottom: spacing.space8,
          }}
        >
          <Text variant="label" colorToken={color.actionOnPrimary}>
            Needs confirmation
          </Text>
        </View>
      ) : null}
      {role === 'player' && event.type === 'trip' && event.status === 'active' && playerTripState === 'not_traveling' ? (
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: spacing.space12,
            paddingVertical: spacing.space8,
            borderRadius: spacing.space16,
            backgroundColor: color.surfaceInput,
            marginBottom: spacing.space8,
          }}
        >
          <Text variant="label" colorToken={color.textSecondary}>
            Not traveling
          </Text>
        </View>
      ) : null}
      {role === 'coach' && event.status === 'active' && (event.type === 'match' || event.type === 'training') ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.space8 }}>
          <Text variant="caption" colorToken={color.actionPrimary}>
            View availability
          </Text>
          {coachAvailQuery.data?.window ? (
            <>
              <Text variant="caption" colorToken={color.stateWarning} style={{ marginLeft: spacing.space8 }}>
                •
              </Text>
              <Text variant="caption" colorToken={color.textSecondary} style={{ marginLeft: spacing.space4 }}>
                {coachAvailQuery.data.submissions.filter((s) => s.availabilityStatus !== null).length}/{coachAvailQuery.data.submissions.length} submitted
              </Text>
            </>
          ) : null}
        </View>
      ) : null}
      <Text variant="caption" colorToken={color.textSecondary}>
        {when}
      </Text>
      {event.location ? (
        <Text variant="caption" colorToken={color.textSecondary} style={{ marginTop: spacing.space4 }}>
          {event.location}
        </Text>
      ) : null}
    </Pressable>
  );
}

export { eventStartDate };
