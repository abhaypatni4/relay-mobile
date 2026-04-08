import React from 'react';
import { View } from 'react-native';
import { Icon } from '@/components/foundation/Icon';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

type StatusDotStatus =
  | 'available'
  | 'limited'
  | 'unavailable'
  | 'notSubmitted'
  | 'traveling'
  | 'notTraveling'
  | 'acknowledged'
  | 'notSeen'
  | 'seen'
  | 'overdue'
  | 'pending'
  | 'selected'
  | 'notSelected'
  | 'medicallyRestricted'
  | 'unassigned'
  | 'invited'
  | 'profileIncomplete'
  | 'active';

export interface StatusDotProps {
  status: StatusDotStatus;
  size: 'sm' | 'md';
  accessibilityLabel: string;
}

function visualForStatus(status: StatusDotStatus): { fill: string; border: string; icon?: 'check' | 'clock' | 'eye' } {
  switch (status) {
    case 'available':
    case 'selected':
    case 'active':
      return { fill: color.stateSuccess, border: color.stateSuccess };
    case 'limited':
    case 'overdue':
      return { fill: color.stateWarning, border: color.stateWarning, icon: status === 'overdue' ? 'clock' : undefined };
    case 'unavailable':
      return { fill: color.stateDestructive, border: color.stateDestructive };
    case 'traveling':
      return { fill: color.actionPrimary, border: color.actionPrimary };
    case 'acknowledged':
      return { fill: color.stateSuccess, border: color.stateSuccess, icon: 'check' };
    case 'seen':
      return { fill: color.textSecondary, border: color.textSecondary, icon: 'eye' };
    case 'pending':
      return { fill: color.surfaceElevated, border: color.textSecondary, icon: 'clock' };
    case 'notSubmitted':
    case 'notTraveling':
    case 'notSeen':
    case 'notSelected':
    case 'medicallyRestricted':
    case 'unassigned':
    case 'invited':
    case 'profileIncomplete':
    default:
      return { fill: color.surfaceElevated, border: color.textSecondary };
  }
}

export function StatusDot({ status, size, accessibilityLabel }: StatusDotProps): React.ReactElement {
  const diameter = size === 'sm' ? spacing.space8 : spacing.space12;
  const iconSize = size === 'sm' ? spacing.space8 : spacing.space12;
  const visual = visualForStatus(status);

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        borderWidth: 1,
        borderColor: visual.border,
        backgroundColor: visual.fill,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {visual.icon ? <Icon name={visual.icon} size={iconSize} color={color.surfaceElevated} /> : null}
    </View>
  );
}
