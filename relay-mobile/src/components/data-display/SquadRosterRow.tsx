import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
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
    return 'Pending';
  }
  if (status === 'available') {
    return 'Available';
  }
  if (status === 'limited') {
    return 'Limited';
  }
  return 'Unavailable';
}

function availabilityPillStyle(status: AvailabilityStatus | null): {
  bg: string;
  borderColor: string;
  textColor: string;
  borderWidth: number;
} {
  if (status === 'available') {
    return { bg: color.stateSuccess, borderColor: color.stateSuccess, textColor: color.actionOnPrimary, borderWidth: 0 };
  }
  if (status === 'limited') {
    return { bg: color.stateWarning, borderColor: color.stateWarning, textColor: color.actionOnPrimary, borderWidth: 0 };
  }
  if (status === 'unavailable') {
    return { bg: color.stateDestructive, borderColor: color.stateDestructive, textColor: color.actionOnPrimary, borderWidth: 0 };
  }
  return { bg: color.surfaceElevated, borderColor: color.borderDefault, textColor: color.textSecondary, borderWidth: 1 };
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
  const pill = availabilityPillStyle(availabilityStatus);

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
      <View style={{ flex: 1 }}>
        <Text variant="body" style={{ fontWeight: '600' }}>
          {memberName}
        </Text>
        {note ? <Text variant="caption" colorToken={color.textSecondary} style={{ marginTop: spacing.space4 }} numberOfLines={2}>{note}</Text> : null}
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
          backgroundColor: pill.bg,
          borderWidth: pill.borderWidth,
          borderColor: pill.borderColor,
          maxWidth: '36%',
        }}
      >
        <Text variant="caption" numberOfLines={1} style={{ color: pill.textColor }}>
          {availabilityLabel(availabilityStatus)}
        </Text>
      </View>
    </Pressable>
  );
}
