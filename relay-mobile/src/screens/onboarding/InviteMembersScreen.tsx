import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { AppStackParamList } from '@/types/navigation';

interface InvitationResponse {
  token: string;
  expiresAt: string;
  deepLink: string;
}

export function InviteMembersScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('InviteMembersScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList, 'InviteMembers'>>();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const teamName = useTeamStore((s) => s.teamName);
  const addToast = useUiStore((s) => s.addToast);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setError('No team selected.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await api.post<InvitationResponse>(`/teams/${teamId}/invitations`);
        if (!cancelled) {
          setDeepLink(data.deepLink);
          setInvitationCode(data.token);
        }
      } catch {
        if (!cancelled) {
          setError('Could not create an invite link. Try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  const onShare = useCallback(async () => {
    if (!deepLink) {
      return;
    }
    const msg = `Join ${teamName ?? 'our team'} on Relay: ${deepLink}`;
    analytics.track('invitation_sent', { method: 'link' });
    await Share.share({ message: msg, url: deepLink });
  }, [deepLink, teamName]);

  const onCopy = useCallback(async () => {
    if (!deepLink) {
      return;
    }
    await Clipboard.setStringAsync(deepLink);
    analytics.track('invitation_sent', { method: 'link' });
    addToast('success', 'Link copied');
  }, [addToast, deepLink]);

  const onSkip = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }, [navigation]);

  const onCopyCode = useCallback(async () => {
    if (!invitationCode) {
      return;
    }
    await Clipboard.setStringAsync(invitationCode);
    analytics.track('invitation_sent', { method: 'code' });
    addToast('success', 'Code copied');
  }, [addToast, invitationCode]);

  return (
    <ScreenContainer scrollable>
      <Text variant="title" style={{ marginBottom: spacing.space8 }}>
        Invite your team
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
        Share this link so players and staff can join. It expires in 7 days.
      </Text>
      {error ? (
        <Text variant="body" colorToken={color.stateError} style={{ marginBottom: spacing.space16 }}>
          {error}
        </Text>
      ) : null}
      {deepLink ? (
        <View
          style={{
            padding: spacing.space12,
            backgroundColor: color.surfaceInput,
            borderRadius: radius.sm,
            marginBottom: spacing.space16,
          }}
        >
          <Text variant="caption" colorToken={color.textSecondary} selectable>
            {deepLink}
          </Text>
        </View>
      ) : null}
      {invitationCode ? (
        <View
          style={{
            padding: spacing.space12,
            backgroundColor: color.surfaceInput,
            borderRadius: radius.sm,
            marginBottom: spacing.space16,
          }}
        >
          <Text variant="label" style={{ marginBottom: spacing.space8 }}>
            Invitation code
          </Text>
          <Text variant="caption" colorToken={color.textSecondary} selectable style={{ marginBottom: spacing.space8 }}>
            {invitationCode}
          </Text>
          <Text variant="caption" colorToken={color.textSecondary}>
            Members can enter this code when creating their account.
          </Text>
        </View>
      ) : null}
      <LoadingButton
        label="Share link"
        isLoading={false}
        disabled={loading || !deepLink}
        onPress={() => void onShare()}
      />
      <View style={{ height: spacing.space12 }} />
      <Pressable
        onPress={() => void onCopy()}
        disabled={!deepLink || loading}
        style={{ paddingVertical: spacing.space12, alignItems: 'center' }}
      >
        <Text variant="label" colorToken={deepLink && !loading ? color.actionPrimary : color.textDisabled}>
          Copy link
        </Text>
      </Pressable>
      <Pressable
        onPress={() => void onCopyCode()}
        disabled={!invitationCode || loading}
        style={{ paddingVertical: spacing.space12, alignItems: 'center' }}
      >
        <Text variant="label" colorToken={invitationCode && !loading ? color.actionPrimary : color.textDisabled}>
          Copy code
        </Text>
      </Pressable>
      <Pressable onPress={onSkip} style={{ paddingVertical: spacing.space16, alignItems: 'center' }}>
        <Text variant="label" colorToken={color.textSecondary}>
          Skip for now
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
