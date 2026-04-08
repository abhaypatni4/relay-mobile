import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { StatusDot } from '@/components/data-display/StatusDot';
import { Text } from '@/components/foundation/Text';
import { Icon } from '@/components/foundation/Icon';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { AvailabilityStatus, OperationalStatus } from '@/types/models';

export interface SquadRosterRowProps {
  memberName: string;
  availabilityStatus: AvailabilityStatus | null;
  note: string | null;
  operationalStatus: OperationalStatus;
  onPress: () => void;
}

function availabilityLabel(status: AvailabilityStatus | null): string {
  if (status === null) {
    return 'Not Submitted';
  }
  if (status === 'available') {
    return 'Available';
  }
  if (status === 'limited') {
    return 'Limited';
  }
  return 'Unavailable';
}

function operationalLabel(op: OperationalStatus): string {
  switch (op) {
    case 'selected':
      return 'Selected';
    case 'notSelected':
      return 'Not Selected';
    case 'traveling':
      return 'Traveling';
    case 'medicallyRestricted':
      return 'Medically Restricted';
    default:
      return 'Unassigned';
  }
}

export function SquadRosterRow({
  memberName,
  availabilityStatus,
  note,
  operationalStatus,
  onPress,
}: SquadRosterRowProps): React.ReactElement {
  const a11y = useMemo(() => {
    const avail = availabilityLabel(availabilityStatus);
    const op = operationalLabel(operationalStatus);
    return `${memberName}: ${avail}, ${op}`;
  }, [availabilityStatus, memberName, operationalStatus]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={{
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.space12,
        paddingHorizontal: spacing.space12,
        marginBottom: spacing.space8,
        borderRadius: radius.md,
        backgroundColor: color.surfaceElevated,
        borderWidth: 1,
        borderColor: color.borderSubtle,
      }}
    >
      <StatusDot
        status={availabilityStatus ?? 'notSubmitted'}
        size="md"
        accessibilityLabel={`${memberName}: ${availabilityLabel(availabilityStatus)}`}
      />
      <View style={{ flex: 1, marginLeft: spacing.space12 }}>
        <Text variant="body" style={{ fontWeight: '600' }}>
          {memberName}
        </Text>
        <Text variant="caption" colorToken={color.textSecondary} style={{ marginTop: spacing.space4 }}>
          {availabilityLabel(availabilityStatus)}
        </Text>
      </View>
      {note ? (
        <View style={{ marginRight: spacing.space8 }}>
          <Icon name="note" size={18} color={color.textSecondary} />
        </View>
      ) : null}
      <View
        style={{
          paddingHorizontal: spacing.space8,
          paddingVertical: spacing.space4,
          borderRadius: radius.sm,
          backgroundColor: color.surfaceInput,
          maxWidth: '36%',
        }}
      >
        <Text variant="caption" colorToken={color.textSecondary} numberOfLines={1}>
          {operationalLabel(operationalStatus)}
        </Text>
      </View>
    </Pressable>
  );
}
