import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useTeamStore } from '@/store/teamStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

export function HomeScreen(): React.ReactElement {
  const teamName = useTeamStore((s) => s.teamName);
  const role = useTeamStore((s) => s.role);
  const onboardingState = useTeamStore((s) => s.onboardingState);

  return (
    <ScreenContainer scrollable>
      <Text variant="title" style={{ marginBottom: spacing.space8 }}>
        {teamName ? teamName : 'Relay'}
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space16 }}>
        {teamName
          ? `You are signed in as ${role ?? 'member'}${onboardingState && onboardingState !== 'active' ? ` · ${onboardingState}` : ''}.`
          : 'Create a team to get started, or open an invite link from your coordinator.'}
      </Text>
      {teamName ? (
        <View style={{ marginTop: spacing.space8 }}>
          <Text variant="body">Use the tabs below for events, feed, and team.</Text>
        </View>
      ) : null}
    </ScreenContainer>
  );
}
