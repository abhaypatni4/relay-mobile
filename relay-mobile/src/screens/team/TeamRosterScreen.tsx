import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { SkeletonLoader } from '@/components/feedback/SkeletonLoader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import {
  type BasicRosterMember,
  type CoordinatorRosterMember,
  type RosterMemberRow,
  useMembers,
} from '@/hooks/useMembers';
import { useTeamStore } from '@/store/teamStore';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { AppStackParamList } from '@/types/navigation';
import type { OnboardingState } from '@/types/models';

function isCoordinatorDetailRow(m: RosterMemberRow): m is CoordinatorRosterMember {
  return 'onboardingState' in m;
}

function formatRoleLabel(m: BasicRosterMember | CoordinatorRosterMember): string {
  if (m.customRoleLabel) {
    return m.customRoleLabel;
  }
  const r = m.role;
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function isPending(state: OnboardingState): boolean {
  return state === 'invited' || state === 'profileIncomplete';
}

export function TeamRosterScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const viewerRole = useTeamStore((s) => s.role);
  const { data: members, isPending: loading } = useMembers(teamId);

  const isCoordinator = viewerRole === 'coordinator';

  const listData = useMemo(() => members ?? [], [members]);

  const renderItem = useCallback(
    ({ item }: { item: RosterMemberRow }) => {
      if (isCoordinator && isCoordinatorDetailRow(item)) {
        const pending = isPending(item.onboardingState);
        const stale = item.emergencyInfo?.isStale === true;
        return (
          <View
            style={{
              paddingVertical: spacing.space12,
              borderBottomWidth: 1,
              borderBottomColor: color.borderSubtle,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              <Text variant="label">{item.name}</Text>
              {pending ? (
                <View
                  style={{
                    marginLeft: spacing.space8,
                    backgroundColor: color.stateWarning,
                    paddingHorizontal: spacing.space8,
                    paddingVertical: spacing.space4,
                    borderRadius: radius.sm,
                  }}
                >
                  <Text variant="caption" colorToken={color.surfaceElevated}>
                    Pending
                  </Text>
                </View>
              ) : null}
              {stale ? (
                <View
                  style={{
                    marginLeft: spacing.space8,
                    borderWidth: 1,
                    borderColor: color.stateStaleBorder,
                    paddingHorizontal: spacing.space8,
                    paddingVertical: spacing.space4,
                    borderRadius: radius.sm,
                  }}
                >
                  <Text variant="caption" colorToken={color.stateWarning}>
                    Emergency info stale
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="caption" colorToken={color.textSecondary} style={{ marginTop: spacing.space4 }}>
              {formatRoleLabel(item)} · {item.onboardingState}
            </Text>
          </View>
        );
      }
      const simple = item as BasicRosterMember;
      return (
        <View
          style={{
            paddingVertical: spacing.space12,
            borderBottomWidth: 1,
            borderBottomColor: color.borderSubtle,
          }}
        >
          <Text variant="label">{simple.name}</Text>
          <Text variant="caption" colorToken={color.textSecondary} style={{ marginTop: spacing.space4 }}>
            {formatRoleLabel(simple)}
          </Text>
        </View>
      );
    },
    [isCoordinator],
  );

  const keyExtractor = useCallback((item: RosterMemberRow) => item.id, []);

  const header = useMemo(() => {
    if (!isCoordinator) {
      return null;
    }
    return (
      <View>
        <Pressable
          onPress={() => navigation.navigate('InviteMembers')}
          style={{
            marginBottom: spacing.space12,
            padding: spacing.space12,
            backgroundColor: color.actionPrimary,
            borderRadius: radius.sm,
            alignItems: 'center',
          }}
        >
          <Text variant="label" colorToken={color.actionOnPrimary}>
            Invite members
          </Text>
        </Pressable>
        <Pressable
          onPress={() => (navigation as unknown as { navigate: (name: string) => void }).navigate('TeamSettings')}
          style={{
            marginBottom: spacing.space16,
            padding: spacing.space12,
            backgroundColor: color.surfaceInput,
            borderRadius: radius.sm,
            alignItems: 'center',
          }}
        >
          <Text variant="label" colorToken={color.actionPrimary}>
            Team settings
          </Text>
        </Pressable>
      </View>
    );
  }, [isCoordinator, navigation]);

  if (!teamId) {
    return (
      <ScreenContainer>
        <Text variant="body" colorToken={color.textSecondary}>
          Join or create a team to see the roster.
        </Text>
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer>
        <Text variant="title" style={{ marginBottom: spacing.space16 }}>
          Team roster
        </Text>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonLoader key={i} variant="listRow" style={{ marginBottom: spacing.space8 }} />
        ))}
      </ScreenContainer>
    );
  }

  if (listData.length === 0) {
    return (
      <ScreenContainer>
        <Text variant="title" style={{ marginBottom: spacing.space8 }}>
          Team roster
        </Text>
        <Text variant="body" colorToken={color.textSecondary}>
          No one is on this team yet. Invite members to get started.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text variant="title" style={{ marginBottom: spacing.space12 }}>
        Team roster
      </Text>
      <FlatList
        style={{ flex: 1 }}
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListHeaderComponentStyle={isCoordinator ? { marginBottom: spacing.space8 } : undefined}
        contentContainerStyle={{ paddingBottom: spacing.space32 }}
      />
    </ScreenContainer>
  );
}
