import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { Icon } from '@/components/foundation/Icon';
import { CardContainer } from '@/components/layout/CardContainer';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { EventStatus } from '@/types/models';

export interface TripCardData {
  eventId: string;
  tripWorkspaceId: string;
  eventName: string;
  eventDate: string;
  eventStartTime: string;
  eventStatus: EventStatus;
  departureTime: string | null;
  departureMeetingPoint: string | null;
  itineraryVersion: number;
  isPublished: boolean;
  /** Player: current member's acknowledgment version, if applicable */
  acknowledgedItineraryVersion: number | null;
  /** Player: must be traveling to show acknowledgment CTA */
  travelingStatus: 'traveling' | 'notTraveling' | 'unassigned' | null;
  /** Coordinator: counts among active traveling members */
  acknowledgmentDone?: number;
  acknowledgmentTotal?: number;
}

function formatWhen(date: string, time: string): string {
  try {
    const t = time.includes(':') ? time : `${time}:00`;
    const d = new Date(`${date}T${t}`);
    if (Number.isNaN(d.getTime())) {
      return `${date} · ${time}`;
    }
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return `${date} · ${time}`;
  }
}

function formatDeparture(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusPill(status: EventStatus): { label: string; fg: string; bg: string } {
  switch (status) {
    case 'cancelled':
      return { label: 'Cancelled', fg: color.stateError, bg: color.surfaceInput };
    case 'postponed':
      return { label: 'Postponed', fg: color.stateWarning, bg: color.surfaceInput };
    default:
      return { label: '', fg: color.textSecondary, bg: color.surfaceInput };
  }
}

export interface PlayerTripCardProps {
  trip: TripCardData;
  onPress: () => void;
}

export function PlayerTripCard({ trip, onPress }: PlayerTripCardProps): React.ReactElement {
  const pill = useMemo(() => statusPill(trip.eventStatus), [trip.eventStatus]);
  const showPill = trip.eventStatus === 'cancelled' || trip.eventStatus === 'postponed';
  const traveling = trip.travelingStatus === 'traveling';
  const acked =
    traveling &&
    trip.isPublished &&
    trip.acknowledgedItineraryVersion !== null &&
    trip.acknowledgedItineraryVersion === trip.itineraryVersion;

  const showAckCta =
    traveling &&
    trip.isPublished &&
    trip.eventStatus !== 'cancelled' &&
    !acked &&
    (trip.acknowledgedItineraryVersion === null || trip.acknowledgedItineraryVersion < trip.itineraryVersion);

  return (
    <CardContainer pressable onPress={onPress}>
      <Text variant="title" style={{ marginBottom: spacing.space8 }}>
        {formatDeparture(trip.departureTime)}
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space12 }}>
        {trip.departureMeetingPoint?.trim() ? trip.departureMeetingPoint : '—'}
      </Text>
      {showPill && pill.label ? (
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: spacing.space8,
            paddingVertical: spacing.space4,
            borderRadius: radius.sm,
            backgroundColor: pill.bg,
            marginBottom: spacing.space12,
          }}
        >
          <Text variant="caption" style={{ color: pill.fg }}>
            {pill.label}
          </Text>
        </View>
      ) : null}
      {!showPill && trip.isPublished && traveling ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.space12 }}>
          {acked ? (
            <>
              <Icon name="check" size={18} color={color.stateSuccess} />
              <Text variant="label" colorToken={color.stateSuccess} style={{ marginLeft: spacing.space8 }}>
                Confirmed
              </Text>
            </>
          ) : showAckCta ? (
            <Text variant="label" colorToken={color.actionPrimary}>
              Tap to confirm
            </Text>
          ) : null}
        </View>
      ) : null}
      <Text variant="label" colorToken={color.textSecondary}>
        {trip.eventName}
      </Text>
      <Text variant="caption" colorToken={color.textDisabled}>
        {formatWhen(trip.eventDate, trip.eventStartTime)}
      </Text>
    </CardContainer>
  );
}

export interface CoordinatorTripCardProps {
  trip: TripCardData;
  onPress: () => void;
  outstandingDocumentsCount?: number;
}

export function CoordinatorTripCard({
  trip,
  onPress,
  outstandingDocumentsCount = 0,
}: CoordinatorTripCardProps): React.ReactElement {
  const pill = useMemo(() => statusPill(trip.eventStatus), [trip.eventStatus]);
  const showPill = trip.eventStatus === 'cancelled' || trip.eventStatus === 'postponed';
  const done = trip.acknowledgmentDone ?? 0;
  const total = trip.acknowledgmentTotal ?? 0;

  return (
    <CardContainer pressable onPress={onPress}>
      <Text variant="title" style={{ marginBottom: spacing.space8 }}>
        {trip.eventName}
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
        {formatWhen(trip.eventDate, trip.eventStartTime)}
      </Text>
      <Text variant="body" style={{ marginBottom: spacing.space12 }}>
        Departs {formatDeparture(trip.departureTime)}
      </Text>
      {showPill && pill.label ? (
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: spacing.space8,
            paddingVertical: spacing.space4,
            borderRadius: radius.sm,
            backgroundColor: pill.bg,
            marginBottom: spacing.space12,
          }}
        >
          <Text variant="caption" style={{ color: pill.fg }}>
            {pill.label}
          </Text>
        </View>
      ) : null}
      {trip.isPublished && total > 0 ? (
        <Text variant="caption" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
          {done} of {total} acknowledged
        </Text>
      ) : null}
      <Text variant="caption" colorToken={color.textSecondary}>
        Outstanding documents: {outstandingDocumentsCount}
      </Text>
    </CardContainer>
  );
}
