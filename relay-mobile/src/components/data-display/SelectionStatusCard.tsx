import React from 'react';
import { Pressable } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { CardContainer } from '@/components/layout/CardContainer';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { PlayerSelectionOutcome } from '@/types/models';

export interface SelectionStatusCardProps {
  eventName: string;
  /** When notifications not sent yet. */
  pending: boolean;
  outcome: PlayerSelectionOutcome | undefined;
  onPressToEvent?: () => void;
}

export function SelectionStatusCard({
  eventName,
  pending,
  outcome,
  onPressToEvent,
}: SelectionStatusCardProps): React.ReactElement {
  if (pending) {
    return (
      <CardContainer style={{ marginTop: spacing.space16 }}>
        <Text variant="label" colorToken={color.textSecondary}>
          Selection
        </Text>
        <Text variant="body" colorToken={color.textSecondary} style={{ marginTop: spacing.space8 }}>
          Decision coming soon
        </Text>
      </CardContainer>
    );
  }

  const body =
    outcome === 'selected'
      ? `${eventName}: You have been selected`
      : `${eventName}: You are not selected for this event`;

  const inner = (
    <>
      <Text variant="label" colorToken={color.textSecondary}>
        Selection
      </Text>
      <Text variant="body" style={{ marginTop: spacing.space8 }}>
        {body}
      </Text>
    </>
  );

  if (onPressToEvent) {
    return (
      <Pressable onPress={onPressToEvent} accessibilityRole="button">
        <CardContainer style={{ marginTop: spacing.space16 }}>{inner}</CardContainer>
      </Pressable>
    );
  }

  return <CardContainer style={{ marginTop: spacing.space16 }}>{inner}</CardContainer>;
}
