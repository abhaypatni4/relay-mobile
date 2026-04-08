import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { ApiEventListItem } from '@/hooks/useTeamEvents';
import type { EventStatus, EventType } from '@/types/models';

export interface EventCardProps {
  event: ApiEventListItem;
  onPress: () => void;
}

function eventStartDate(e: ApiEventListItem): Date {
  const t = e.startTime.includes(':') ? e.startTime : `${e.startTime}:00`;
  const d = new Date(`${e.date}T${t}`);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

function typeBadgeColors(t: EventType): { bg: string; fg: string } {
  switch (t) {
    case 'trip':
      return { bg: 'hsl(190, 45%, 92%)', fg: color.actionPrimary };
    case 'match':
      return { bg: 'hsl(38, 80%, 92%)', fg: color.stateWarning };
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
      return { label: 'Cancelled', bg: 'hsl(4, 40%, 94%)', fg: color.stateError };
    case 'postponed':
      return { label: 'Postponed', bg: 'hsl(38, 85%, 92%)', fg: color.stateWarning };
    case 'draft':
      return { label: 'Draft', bg: color.surfaceInput, fg: color.textSecondary };
    case 'complete':
      return { label: 'Complete', bg: color.surfaceInput, fg: color.textSecondary };
    case 'active':
    default:
      return { label: 'Active', bg: 'hsl(145, 40%, 92%)', fg: color.stateSuccess };
  }
}

export function EventCard({ event, onPress }: EventCardProps): React.ReactElement {
  const typeColors = useMemo(() => typeBadgeColors(event.type), [event.type]);
  const status = useMemo(() => statusPresentation(event.status), [event.status]);
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
