import React from 'react';
import { View } from 'react-native';
import { StatusDot } from '@/components/data-display/StatusDot';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { OnboardingState, Role, TravelingStatus } from '@/types/models';

export interface SquadMemberRowProps {
  variant: 'player' | 'staff';
  name: string;
  role: Role;
  customRoleLabel?: string | null;
  travelingStatus?: TravelingStatus;
  itineraryVersion?: number;
  acknowledgedItineraryVersion?: number | null;
  onboardingState?: OnboardingState;
}

function travelingStatusDot(s: TravelingStatus): 'traveling' | 'notTraveling' | 'pending' {
  switch (s) {
    case 'traveling':
      return 'traveling';
    case 'notTraveling':
      return 'notTraveling';
    default:
      return 'pending';
  }
}

export function SquadMemberRow({
  variant,
  name,
  role,
  customRoleLabel,
  travelingStatus,
  itineraryVersion,
  acknowledgedItineraryVersion,
}: SquadMemberRowProps): React.ReactElement {
  const roleLine = customRoleLabel ?? role;
  const acked =
    itineraryVersion !== undefined &&
    acknowledgedItineraryVersion !== null &&
    acknowledgedItineraryVersion === itineraryVersion;

  return (
    <View
      style={{
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.space12,
        borderBottomWidth: 1,
        borderBottomColor: color.borderSubtle,
      }}
    >
      {variant === 'staff' && travelingStatus ? (
        <View style={{ marginRight: spacing.space8 }}>
          <StatusDot
            status={travelingStatusDot(travelingStatus)}
            size="sm"
            accessibilityLabel={
              travelingStatus === 'traveling'
                ? 'Traveling'
                : travelingStatus === 'notTraveling'
                  ? 'Not Traveling'
                  : 'Pending'
            }
          />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="body" style={{ fontWeight: '600' }}>
          {name}
        </Text>
        <Text variant="caption" colorToken={color.textSecondary}>
          {roleLine}
        </Text>
      </View>
      {variant === 'staff' && itineraryVersion !== undefined ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <StatusDot
            status={acked ? 'acknowledged' : 'pending'}
            size="sm"
            accessibilityLabel={acked ? 'Acknowledged' : 'Pending'}
          />
        </View>
      ) : null}
    </View>
  );
}
