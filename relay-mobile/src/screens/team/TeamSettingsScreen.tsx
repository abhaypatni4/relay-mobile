import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { TextInput } from '@/components/input/TextInput';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api, performLogout } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { spacing } from '@/tokens/spacing';
import { color } from '@/tokens/colors';
import type { TeamStackParamList } from '@/types/navigation';

const MIN_TOUCH_TARGET = 48; // WCAG minimum touch target

function SignOutSection(): React.ReactElement {
  return (
    <View style={{ marginTop: spacing.space32, paddingBottom: spacing.space24 }}>
      <Pressable
        onPress={() => {
          Alert.alert('Sign out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign out',
              style: 'destructive',
              onPress: () => {
                void performLogout();
              },
            },
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
    </View>
  );
}

export function TeamSettingsScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('TeamSettingsScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<TeamStackParamList, 'TeamSettings'>>();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const role = useTeamStore((s) => s.role);
  const addToast = useUiStore((s) => s.addToast);

  const teamQuery = useQuery({
    queryKey: ['teamSettings', teamId],
    queryFn: async () => {
      const { data } = await api.get<{ id: string; name: string; sport: string | null; homeLocation: string | null }>(
        `/teams/${teamId}`,
      );
      return data;
    },
    enabled: Boolean(teamId),
  });

  const pendingTransferQuery = useQuery({
    queryKey: ['pendingTransfer', teamId],
    queryFn: async () => {
      const { data } = await api.get<{ transfer: { toMemberName: string } | null }>(`/teams/${teamId}/transfers`);
      return data.transfer;
    },
    enabled: Boolean(teamId),
  });

  const [name, setName] = useState('');
  const [sport, setSport] = useState('');
  const [homeLocation, setHomeLocation] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  React.useEffect(() => {
    if (!teamQuery.data) return;
    setName(teamQuery.data.name);
    setSport(teamQuery.data.sport ?? '');
    setHomeLocation(teamQuery.data.homeLocation ?? '');
  }, [teamQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/teams/${teamId}`, { name, sport: sport || null, homeLocation: homeLocation || null });
    },
    onSuccess: () => addToast('success', 'Saved'),
    onError: () => addToast('error', "Couldn't save — check your connection and try again."),
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ deepLink: string }>(`/teams/${teamId}/invitations`);
      return data.deepLink;
    },
    onSuccess: (deepLink) => {
      setInviteLink(deepLink);
      addToast('success', 'New invite link generated');
    },
    onError: () => addToast('error', "Couldn't save — check your connection and try again."),
  });

  if (role !== 'coordinator') {
    return (
      <ScreenContainer scrollable>
        <Text variant="body">This screen is available to coordinators only.</Text>
        <SignOutSection />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <Text variant="title" style={{ marginBottom: spacing.space12 }}>
        Team settings
      </Text>

      <Text variant="label" style={{ marginBottom: spacing.space8 }}>
        Team Details
      </Text>
      <TextInput label="Team name" value={name} onChangeText={setName} />
      <TextInput label="Sport" value={sport} onChangeText={setSport} optional />
      <TextInput label="Home location" value={homeLocation} onChangeText={setHomeLocation} optional />
      <LoadingButton
        label="Save"
        isLoading={saveMutation.status === 'pending'}
        disabled={!name.trim()}
        onPress={() => void saveMutation.mutateAsync()}
      />

      <View style={{ height: spacing.space24 }} />
      <Text variant="label" style={{ marginBottom: spacing.space8 }}>
        Invitation Link
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
        {inviteLink || 'Generate or regenerate an invite link'}
      </Text>
      <LoadingButton
        label="Regenerate link"
        isLoading={regenerateMutation.status === 'pending'}
        onPress={() => void regenerateMutation.mutateAsync()}
      />
      <Pressable
        onPress={() => {
          if (!inviteLink) return;
          void Clipboard.setStringAsync(inviteLink);
          addToast('success', 'Link copied');
        }}
        style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text variant="label" colorToken={color.actionPrimary}>
          Copy link
        </Text>
      </Pressable>

      <View style={{ height: spacing.space24 }} />
      <Text variant="label" style={{ marginBottom: spacing.space8 }}>
        Transfer Coordinator Role
      </Text>
      {pendingTransferQuery.data ? (
        <Text variant="body" colorToken={color.textSecondary}>
          Awaiting {pendingTransferQuery.data.toMemberName}&apos;s acceptance
        </Text>
      ) : (
        <LoadingButton
          label="Transfer coordinator role"
          isLoading={false}
          onPress={() => navigation.navigate('CoordinatorHandoff')}
        />
      )}

      <View style={{ height: spacing.space24 }} />
      <Text variant="label" style={{ marginBottom: spacing.space8 }}>
        Notification Preferences
      </Text>
      <LoadingButton
        label="Notification preferences"
        isLoading={false}
        onPress={() => navigation.navigate('NotificationPreferences')}
      />

      <SignOutSection />
    </ScreenContainer>
  );
}

