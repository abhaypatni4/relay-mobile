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

function formatDepartureParts(iso: string | null): { dateLabel: string; timeLabel: string } {
  if (!iso) {
    return { dateLabel: 'DATE TBD', timeLabel: '—' };
  }
  try {
    const d = new Date(iso);
    return {
      dateLabel: new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(d).toUpperCase(),
      timeLabel: new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(d),
    };
  } catch {
    return { dateLabel: 'DATE TBD', timeLabel: formatDeparture(iso) };
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
  const departureParts = formatDepartureParts(trip.departureTime);

  return (
    <CardContainer
      pressable
      onPress={onPress}
      style={{
        borderLeftWidth: spacing.space4,
        borderLeftColor: color.actionPrimary,
        padding: spacing.space20,
        shadowOpacity: 0.09,
        shadowRadius: spacing.space8,
      }}
    >
      <Text variant="caption" colorToken={color.textLabel} style={{ marginBottom: spacing.space4, letterSpacing: 0.8 }}>
        {departureParts.dateLabel}
      </Text>
      <Text
        variant="title"
        colorToken={color.actionPrimary}
        style={{ marginBottom: spacing.space12, fontWeight: '700', fontSize: 30, lineHeight: 36 }}
      >
        {departureParts.timeLabel}
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space12 }}>
        📍 {trip.departureMeetingPoint?.trim() ? trip.departureMeetingPoint : '—'}
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
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: spacing.space12,
                paddingVertical: spacing.space8,
                borderRadius: spacing.space16,
                backgroundColor: color.stateSuccess,
              }}
            >
              <Text variant="label" colorToken={color.actionOnPrimary}>
                ✓ Confirmed
              </Text>
            </View>
          ) : showAckCta ? (
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: spacing.space12,
                paddingVertical: spacing.space8,
                borderRadius: spacing.space16,
                backgroundColor: color.stateWarning,
              }}
            >
              <Text variant="label" colorToken={color.actionOnPrimary}>
                Tap to confirm
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: spacing.space8 }}>
          <Text variant="caption" colorToken={color.textSecondary}>
            {trip.eventName}
          </Text>
          <Text variant="caption" colorToken={color.textDisabled}>
            {formatWhen(trip.eventDate, trip.eventStartTime)}
          </Text>
        </View>
        <Text variant="label" colorToken={color.textDisabled}>
          ›
        </Text>
      </View>
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
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <CardContainer
      pressable
      onPress={onPress}
      style={{
        borderLeftWidth: spacing.space4,
        borderLeftColor: color.actionPrimary,
        padding: spacing.space20,
        shadowOpacity: 0.08,
        shadowRadius: spacing.space8,
      }}
    >
      <Text variant="title" style={{ marginBottom: spacing.space8, fontWeight: '700' }}>
        {trip.eventName}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.space12 }}>
        <Icon name="calendar" size={spacing.space16} color={color.textSecondary} />
        <Text variant="body" colorToken={color.textSecondary} style={{ marginLeft: spacing.space8 }}>
          {formatWhen(trip.eventDate, trip.eventStartTime)}
        </Text>
      </View>
      <Text variant="caption" colorToken={color.textLabel} style={{ marginBottom: spacing.space4, letterSpacing: 0.6 }}>
        DEPARTS
      </Text>
      <Text
        variant="title"
        colorToken={color.actionPrimary}
        style={{ marginBottom: spacing.space12, fontWeight: '700', fontSize: 30, lineHeight: 36 }}
      >
        {formatDeparture(trip.departureTime)}
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
        <View style={{ marginBottom: spacing.space12 }}>
          <Text variant="caption" colorToken={color.textLabel} style={{ marginBottom: spacing.space4, letterSpacing: 0.6 }}>
            SQUAD CONFIRMED
          </Text>
          <View
            style={{
              height: spacing.space8,
              borderRadius: radius.sm,
              backgroundColor: color.borderSubtle,
              overflow: 'hidden',
              marginBottom: spacing.space4,
            }}
          >
            <View
              style={{
                height: spacing.space8,
                width: `${progressPct}%`,
                backgroundColor: color.actionPrimary,
              }}
            />
          </View>
          <Text variant="caption" colorToken={color.textSecondary}>
            {progressPct}% ({done}/{total})
          </Text>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="caption" colorToken={color.textSecondary}>
          Outstanding documents: {outstandingDocumentsCount}
        </Text>
        <Text variant="label" colorToken={color.textDisabled}>
          ›
        </Text>
      </View>
    </CardContainer>
  );
}
