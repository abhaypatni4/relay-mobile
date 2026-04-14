import { analytics } from '@/services/analytics';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { Icon } from '@/components/foundation/Icon';
import { Text } from '@/components/foundation/Text';
import { SkeletonLoader } from '@/components/feedback/SkeletonLoader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import {
  type BasicRosterMember,
  type CoordinatorRosterMember,
  type RosterMemberRow,
  useMembers,
} from '@/hooks/useMembers';
import { performLogout } from '@/services/api';
import { useTeamStore } from '@/store/teamStore';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { AppStackParamList } from '@/types/navigation';
import type { OnboardingState } from '@/types/models';

const MIN_TOUCH_TARGET = 48; // WCAG minimum touch target

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

function SignOutButton(): React.ReactElement {
  return (
    <Pressable
      onPress={() => {
        Alert.alert('Sign out', 'Are you sure you want to sign out?', [
          {
            text: 'Sign out',
            style: 'destructive',
            onPress: () => {
              void performLogout();
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }}
      style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', alignItems: 'center' }}
      accessibilityRole="button"
      accessibilityLabel="Sign out"
    >
      <Text variant="label" colorToken={color.stateError}>
        Sign out
      </Text>
    </Pressable>
  );
}

export function TeamRosterScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('TeamRosterScreen');
    }, []),
  );

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
        <View style={{ marginTop: spacing.space24 }}>
          <SignOutButton />
        </View>
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
        <View style={{ marginTop: spacing.space24 }}>
          <SignOutButton />
        </View>
      </ScreenContainer>
    );
  }

  if (listData.length === 0) {
    return (
      <ScreenContainer>
        <Text variant="title" style={{ marginBottom: spacing.space8 }}>
          Team roster
        </Text>
        <View
          style={{
            borderRadius: spacing.space12,
            borderWidth: 1,
            borderColor: color.borderSubtle,
            backgroundColor: color.surfaceElevated,
            padding: spacing.space24,
            alignItems: 'center',
          }}
        >
          <Icon name="team" size={40} color={color.actionPrimary} />
          <Text variant="body" style={{ marginTop: spacing.space12, textAlign: 'center' }}>
            No members yet
          </Text>
          <Text variant="label" colorToken={color.textSecondary} style={{ marginTop: spacing.space4, textAlign: 'center' }}>
            Invite members to get started.
          </Text>
        </View>
        <View style={{ marginTop: spacing.space24 }}>
          <SignOutButton />
        </View>
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
        ListFooterComponent={
          <View style={{ marginTop: spacing.space24 }}>
            <SignOutButton />
          </View>
        }
        ListHeaderComponentStyle={isCoordinator ? { marginBottom: spacing.space8 } : undefined}
        contentContainerStyle={{ paddingBottom: spacing.space32 }}
      />
    </ScreenContainer>
  );
}
