import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { TextInput } from '@/components/forms/TextInput';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api, saveAuthSession } from '@/services/api';
import { analytics, pseudonymizedUserId } from '@/services/analytics';
import { applyMembershipsToTeamStore, fetchMe } from '@/services/session';
import { useAuthStore } from '@/store/authStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { RootStackParamList } from '@/types/navigation';
import type { Role } from '@/types/models';

type InviteRoleChoice = 'player' | 'coach' | 'staff' | 'other';

interface RegisterResponse {
  user: { id: string; name: string; email: string | null; phone: string | null };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function AccountCreationScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'AccountCreation'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AccountCreation'>>();
  const invitationToken = route.params?.invitationToken;
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [inviteRole, setInviteRole] = useState<InviteRoleChoice>('player');
  const [otherLabel, setOtherLabel] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(async () => {
    setIdentifierError('');
    const trimmedName = name.trim();
    const trimmedId = identifier.trim();
    if (!trimmedName || !trimmedId || password.length < 8) {
      return;
    }
    setLoading(true);
    try {
      const registerBody: Record<string, string> = {
        name: trimmedName,
        password,
        ...(trimmedId.includes('@') ? { email: trimmedId.toLowerCase() } : { phone: trimmedId }),
      };
      if (invitationToken) {
        registerBody.invitationToken = invitationToken;
      }
      const { data } = await api.post<RegisterResponse>('/auth/register', registerBody);
      await saveAuthSession(data.refreshToken, data.user.id);
      setAuth(data.user.id, data.accessToken);
      analytics.track('account_created', { source: invitationToken ? 'invitation' : 'direct' });
      const pseudo = pseudonymizedUserId(data.user.id);
      if (pseudo) {
        analytics.identify(pseudo, {});
      }

      if (invitationToken) {
        const roleForAccept: Role =
          inviteRole === 'coach' ? 'coach' : inviteRole === 'player' ? 'player' : 'staff';
        const { data: acceptData } = await api.post<{
          teamId: string;
          teamMemberId: string;
          teamName: string;
        }>(`/invitations/${invitationToken}/accept`, { role: roleForAccept });
        await api.patch('/users/me', {
          name: trimmedName,
          teamId: acceptData.teamId,
        });
        if (inviteRole === 'other' && otherLabel.trim()) {
          await api.patch('/users/me', {
            customRoleLabel: otherLabel.trim(),
            teamId: acceptData.teamId,
          });
        }
        const me = await fetchMe();
        applyMembershipsToTeamStore(me.memberships);
        analytics.track('invitation_accepted');
      } else {
        const me = await fetchMe();
        applyMembershipsToTeamStore(me.memberships);
      }

      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        const msg =
          typeof e.response.data === 'object' &&
          e.response.data !== null &&
          'error' in e.response.data &&
          typeof (e.response.data as { error?: string }).error === 'string'
            ? (e.response.data as { error: string }).error
            : 'This email or phone is already registered.';
        setIdentifierError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [identifier, invitationToken, inviteRole, name, navigation, otherLabel, password, setAuth]);

  return (
    <ScreenContainer scrollable>
      <Text variant="title" style={{ marginBottom: spacing.space8 }}>
        Create your account
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
        {invitationToken
          ? 'Choose how you appear on the team, then set a password.'
          : 'You will create your first team next.'}
      </Text>
      {invitationToken ? (
        <>
          <Text variant="label" colorToken={color.textLabel} style={{ marginBottom: spacing.space8 }}>
            Role on the team
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space8, marginBottom: spacing.space16 }}>
            {(
              [
                ['player', 'Player'],
                ['coach', 'Coach'],
                ['staff', 'Staff'],
                ['other', 'Other'],
              ] as const
            ).map(([key, label]) => {
              const selected = inviteRole === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setInviteRole(key)}
                  style={{
                    paddingVertical: spacing.space8,
                    paddingHorizontal: spacing.space12,
                    borderRadius: 8,
                    backgroundColor: selected ? color.actionPrimary : color.surfaceInput,
                  }}
                >
                  <Text variant="label" colorToken={selected ? color.actionOnPrimary : color.textPrimary}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {inviteRole === 'other' ? (
            <TextInput
              label="Describe your role"
              value={otherLabel}
              onChangeText={setOtherLabel}
              placeholder="e.g. Physio, Manager"
            />
          ) : null}
        </>
      ) : null}
      <TextInput label="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
      <TextInput
        label="Email or phone"
        value={identifier}
        onChangeText={(t) => {
          setIdentifier(t);
          setIdentifierError('');
        }}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        errorMessage={identifierError}
      />
      <TextInput
        label="Password (8+ characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <LoadingButton label="Create account" isLoading={loading} onPress={() => void onSubmit()} />
      <View style={{ marginTop: spacing.space24, alignItems: 'center' }}>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text variant="label" colorToken={color.actionPrimary}>
            Already have an account? Sign in
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
