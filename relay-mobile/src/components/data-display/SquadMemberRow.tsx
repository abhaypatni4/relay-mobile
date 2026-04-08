import React from 'react';
import { View } from 'react-native';
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

function StatusDot({ colorToken }: { colorToken: string }): React.ReactElement {
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colorToken,
        marginRight: spacing.space8,
      }}
    />
  );
}

function travelingDotColor(s: TravelingStatus): string {
  switch (s) {
    case 'traveling':
      return color.stateSuccess;
    case 'notTraveling':
      return color.textDisabled;
    default:
      return color.stateWarning;
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
        <StatusDot colorToken={travelingDotColor(travelingStatus)} />
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
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: acked ? color.stateSuccess : color.stateWarning,
              marginLeft: spacing.space8,
            }}
            accessibilityLabel={acked ? 'Itinerary acknowledged' : 'Acknowledgment needed'}
          />
        </View>
      ) : null}
    </View>
  );
}
