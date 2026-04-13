import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { TextInput } from '@/components/forms/TextInput';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { resetToMainApp } from '@/navigation/navigationRef';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { applyMembershipsToTeamStore, fetchMe } from '@/services/session';
import { useAuthStore } from '@/store/authStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { AuthNavigatorParamList } from '@/types/navigation';

export function AcceptInviteScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('AcceptInviteScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<AuthNavigatorParamList, 'AcceptInvite'>>();
  const route = useRoute<RouteProp<AuthNavigatorParamList, 'AcceptInvite'>>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [manualToken, setManualToken] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  const routeToken = route.params?.token?.trim() ?? '';
  const effectiveToken = routeToken || manualToken.trim();

  const inviteQuery = useQuery({
    queryKey: ['invitation', effectiveToken],
    queryFn: async () => {
      const { data } = await api.get<{ teamName: string; sport: string | null }>(
        `/invitations/${effectiveToken}`,
      );
      return data;
    },
    enabled: effectiveToken.length > 0,
    retry: false,
  });

  const status = useMemo(() => {
    if (!effectiveToken) {
      return 'needs_token' as const;
    }
    if (inviteQuery.isPending) {
      return 'loading' as const;
    }
    if (inviteQuery.isError && axios.isAxiosError(inviteQuery.error)) {
      const st = inviteQuery.error.response?.status;
      if (st === 410) {
        return 'expired' as const;
      }
      if (st === 404) {
        return 'invalid' as const;
      }
    }
    if (inviteQuery.data) {
      return 'ok' as const;
    }
    return 'invalid' as const;
  }, [effectiveToken, inviteQuery.data, inviteQuery.error, inviteQuery.isError, inviteQuery.isPending]);

  const onJoin = useCallback(async () => {
    setJoinError('');
    if (!effectiveToken) {
      return;
    }
    setJoining(true);
    try {
      if (isAuthenticated) {
        await api.post(`/invitations/${effectiveToken}/accept`, { role: 'player' });
        const me = await fetchMe();
        applyMembershipsToTeamStore(me.memberships);
        analytics.track('invitation_accepted', {});
        resetToMainApp();
        return;
      }
      navigation.navigate('AccountCreation', { invitationToken: effectiveToken });
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 409) {
          setJoinError('You are already on this team. Open the app from your home screen.');
        } else if (e.response?.status === 410) {
          setJoinError('This invite has expired.');
        } else if (e.response?.status === 404) {
          setJoinError('This invite link is not valid.');
        }
      }
    } finally {
      setJoining(false);
    }
  }, [effectiveToken, isAuthenticated, navigation]);

  return (
    <ScreenContainer scrollable>
      <Text variant="title" style={{ marginBottom: spacing.space8 }}>
        Join a team
      </Text>
      {!routeToken ? (
        <TextInput
          label="Invite link code"
          value={manualToken}
          onChangeText={setManualToken}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Paste the code from your coordinator"
        />
      ) : null}

      {status === 'needs_token' ? (
        <Text variant="body" colorToken={color.textSecondary} style={{ marginTop: spacing.space16 }}>
          Enter the invite code from your coordinator to see team details.
        </Text>
      ) : null}

      {status === 'loading' ? (
        <Text variant="body" colorToken={color.textSecondary} style={{ marginTop: spacing.space16 }}>
          Checking invite…
        </Text>
      ) : null}

      {status === 'expired' ? (
        <View style={{ marginTop: spacing.space16 }}>
          <Text variant="body" colorToken={color.textSecondary}>
            This invite has expired. Contact your coordinator for a new link.
          </Text>
        </View>
      ) : null}

      {status === 'invalid' && effectiveToken ? (
        <View style={{ marginTop: spacing.space16 }}>
          <Text variant="body" colorToken={color.textSecondary}>
            This invite link is not valid. Double-check the code or ask your coordinator to send a new invite.
          </Text>
        </View>
      ) : null}

      {status === 'ok' && inviteQuery.data ? (
        <View style={{ marginTop: spacing.space16 }}>
          <Text variant="body" style={{ marginBottom: spacing.space8 }}>
            You are joining{' '}
            <Text variant="label" colorToken={color.textPrimary}>
              {inviteQuery.data.teamName}
            </Text>
            {inviteQuery.data.sport ? (
              <Text variant="body" colorToken={color.textSecondary}>
                {' '}
                ({inviteQuery.data.sport})
              </Text>
            ) : null}
            .
          </Text>
          {joinError ? (
            <Text variant="label" colorToken={color.stateError} style={{ marginBottom: spacing.space12 }}>
              {joinError}
            </Text>
          ) : null}
          <LoadingButton
            label={isAuthenticated ? 'Join team' : 'Continue'}
            isLoading={joining}
            onPress={() => void onJoin()}
          />
        </View>
      ) : null}
    </ScreenContainer>
  );
}
