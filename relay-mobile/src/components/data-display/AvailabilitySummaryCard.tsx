import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { EventCard } from '@/components/data-display/EventCard';
import { CardContainer } from '@/components/layout/CardContainer';
import type { ApiEventListItem } from '@/hooks/useTeamEvents';
import type { AvailabilitySubmissionDto } from '@/queries/useAvailability';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

export interface AvailabilitySummaryCardProps {
  event: ApiEventListItem;
  windowOpen: boolean;
  submissions: AvailabilitySubmissionDto[];
  isOpening: boolean;
  onOpenWindow: () => void;
  onPressRoster: () => void;
  onPressEvent: () => void;
}

function countSubmissions(submissions: AvailabilitySubmissionDto[]) {
  let a = 0;
  let l = 0;
  let u = 0;
  let n = 0;
  for (const s of submissions) {
    if (s.availabilityStatus === null) {
      n += 1;
    } else if (s.availabilityStatus === 'available') {
      a += 1;
    } else if (s.availabilityStatus === 'limited') {
      l += 1;
    } else {
      u += 1;
    }
  }
  return { a, l, u, n };
}

export function AvailabilitySummaryCard({
  event,
  windowOpen,
  submissions,
  isOpening,
  onOpenWindow,
  onPressRoster,
  onPressEvent,
}: AvailabilitySummaryCardProps): React.ReactElement {
  const c = useMemo(() => countSubmissions(submissions), [submissions]);
  const submitted = submissions.filter((s) => s.availabilityStatus !== null).length;
  const total = submissions.length;

  if (windowOpen) {
    return (
      <Pressable onPress={onPressRoster} accessibilityRole="button">
        <CardContainer style={{ marginTop: spacing.space16 }}>
          <Text variant="label" colorToken={color.textSecondary}>
            Availability — {event.name}
          </Text>
          <Text variant="title" style={{ marginTop: spacing.space8 }}>
            {`${String(c.a)} Available  ${String(c.l)} Limited  ${String(c.u)} Unavailable  ${String(c.n)} Not Submitted`}
          </Text>
          <Text variant="caption" colorToken={color.textSecondary} style={{ marginTop: spacing.space8 }}>
            {`${String(submitted)} of ${String(total)} submitted · Tap for roster`}
          </Text>
        </CardContainer>
      </Pressable>
    );
  }

  return (
    <View style={{ marginTop: spacing.space16 }}>
      <EventCard event={event} onPress={onPressEvent} />
      <View style={{ marginTop: spacing.space12 }}>
        <LoadingButton label="Open availability" isLoading={isOpening} onPress={onOpenWindow} />
      </View>
    </View>
  );
}
