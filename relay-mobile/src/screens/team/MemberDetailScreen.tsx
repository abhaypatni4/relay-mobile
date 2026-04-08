import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useMembers, type CoordinatorRosterMember } from '@/hooks/useMembers';
import { useTeamStore } from '@/store/teamStore';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { TeamStackParamList } from '@/types/navigation';

function formatRole(role: string, customRoleLabel?: string): string {
  if (customRoleLabel) {
    return customRoleLabel;
  }
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function MemberDetailScreen(): React.ReactElement {
  const route = useRoute<RouteProp<TeamStackParamList, 'MemberDetail'>>();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const role = useTeamStore((s) => s.role);
  const { data: members, isPending } = useMembers(teamId);

  const member = useMemo(
    () => members?.find((item) => item.id === route.params.memberId),
    [members, route.params.memberId],
  );

  if (isPending) {
    return (
      <ScreenContainer>
        <Text variant="title">Member detail</Text>
        <Text variant="body" colorToken={color.textSecondary} style={{ marginTop: spacing.space8 }}>
          Loading member details...
        </Text>
      </ScreenContainer>
    );
  }

  if (!member) {
    return (
      <ScreenContainer>
        <Text variant="title">Member detail</Text>
        <Text variant="body" colorToken={color.textSecondary} style={{ marginTop: spacing.space8 }}>
          This member is no longer available.
        </Text>
      </ScreenContainer>
    );
  }

  const canSeeEmergency = role === 'coordinator' || role === 'coach' || role === 'staff';
  const coordinatorMember = member as CoordinatorRosterMember;

  return (
    <ScreenContainer>
      <Text variant="title">Member detail</Text>
      <Text variant="body" style={{ marginTop: spacing.space12 }}>
        {member.name}
      </Text>
      <Text variant="caption" colorToken={color.textSecondary} style={{ marginTop: spacing.space4 }}>
        {formatRole(member.role, member.customRoleLabel ?? undefined)}
      </Text>

      {canSeeEmergency ? (
        <View
          style={{
            marginTop: spacing.space16,
            backgroundColor: color.surfaceElevated,
            padding: spacing.space16,
            borderRadius: radius.md,
          }}
        >
          <Text variant="label">Emergency info</Text>
          <Text variant="body" style={{ marginTop: spacing.space8 }}>
            Contact: {coordinatorMember.emergencyInfo?.contactName ?? 'Not provided'}
          </Text>
          <Text variant="body" style={{ marginTop: spacing.space4 }}>
            Phone: {coordinatorMember.emergencyInfo?.contactPhone ?? 'Not provided'}
          </Text>
          <Text variant="body" style={{ marginTop: spacing.space4 }}>
            Allergy/Alert: {coordinatorMember.emergencyInfo?.allergyAlert ?? 'Not provided'}
          </Text>
          <Text variant="caption" colorToken={color.textSecondary} style={{ marginTop: spacing.space8 }}>
            Staff note: {coordinatorMember.emergencyInfo?.staffNote ?? 'Not provided'}
          </Text>
        </View>
      ) : null}

      {role === 'coordinator' ? (
        <Pressable
          style={{
            marginTop: spacing.space16,
            backgroundColor: color.stateDestructive,
            borderRadius: radius.md,
            minHeight: spacing.space48,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.space16,
          }}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${member.name} from team`}
        >
          <Text variant="label" colorToken={color.actionOnPrimary}>
            Remove from team
          </Text>
        </Pressable>
      ) : null}
    </ScreenContainer>
  );
}
