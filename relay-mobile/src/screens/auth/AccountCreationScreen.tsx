import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { TextInput } from '@/components/forms/TextInput';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { resetToMainApp } from '@/navigation/navigationRef';
import { api, saveAuthSession } from '@/services/api';
import { analytics, pseudonymizedUserId } from '@/services/analytics';
import { applyMembershipsToTeamStore, fetchMe } from '@/services/session';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { AuthNavigatorParamList } from '@/types/navigation';
import type { Role } from '@/types/models';

type SignupRoleChoice = 'coordinator' | 'player' | 'coach' | 'staff';

interface RegisterResponse {
  user: { id: string; name: string; email: string | null; phone: string | null };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function AccountCreationScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('AccountCreationScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<AuthNavigatorParamList, 'AccountCreation'>>();
  const route = useRoute<RouteProp<AuthNavigatorParamList, 'AccountCreation'>>();
  const invitationToken = route.params?.invitationToken;
  const setAuth = useAuthStore((s) => s.setAuth);
  const addToast = useUiStore((s) => s.addToast);

  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SignupRoleChoice>('coordinator');
  const [invitationCode, setInvitationCode] = useState(invitationToken ?? '');
  const [validatedToken, setValidatedToken] = useState('');
  const [validatedTeamName, setValidatedTeamName] = useState('');
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const [invitationError, setInvitationError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (invitationToken?.trim()) {
      setInvitationCode(invitationToken.trim());
      setRole('player');
    }
  }, [invitationToken]);

  const requiresInvitation = role !== 'coordinator';
  const inviteCodeTrimmed = invitationCode.trim();
  const inviteValidated = requiresInvitation && validatedToken === inviteCodeTrimmed && Boolean(validatedTeamName);
  const canSubmit = useMemo(() => {
    const trimmedName = name.trim();
    const trimmedId = identifier.trim();
    const baseOk = Boolean(trimmedName && trimmedId && password.length >= 8);
    if (!baseOk) {
      return false;
    }
    if (!requiresInvitation) {
      return true;
    }
    return inviteValidated && !validatingInvite;
  }, [identifier, inviteValidated, name, password.length, requiresInvitation, validatingInvite]);

  const validateInvitation = useCallback(async (): Promise<boolean> => {
    if (!requiresInvitation) {
      return true;
    }
    if (!inviteCodeTrimmed) {
      setInvitationError('Invitation code is required for this role.');
      setValidatedToken('');
      setValidatedTeamName('');
      return false;
    }
    setValidatingInvite(true);
    setInvitationError('');
    try {
      const { data } = await api.get<{ teamName: string; sport: string | null }>(`/invitations/${inviteCodeTrimmed}`);
      setValidatedToken(inviteCodeTrimmed);
      setValidatedTeamName(data.teamName);
      return true;
    } catch (e: unknown) {
      setValidatedToken('');
      setValidatedTeamName('');
      if (axios.isAxiosError(e)) {
        const st = e.response?.status;
        if (st === 410) {
          setInvitationError('This invitation code has expired. Ask your coordinator to send a new one.');
          return false;
        }
        if (st === 404) {
          setInvitationError('This invitation code is invalid');
          return false;
        }
      }
      setInvitationError('Could not verify code. Check your connection.');
      return false;
    } finally {
      setValidatingInvite(false);
    }
  }, [inviteCodeTrimmed, requiresInvitation]);

  const onSubmit = useCallback(async () => {
    console.log('[AccountCreation] submit tapped', { name, identifier, passwordLen: password.length, role });
    setIdentifierError('');
    setInvitationError('');
    const trimmedName = name.trim();
    const trimmedId = identifier.trim();
    if (!trimmedName || !trimmedId || password.length < 8) {
      return;
    }
    if (requiresInvitation) {
      if (!(await validateInvitation())) {
        return;
      }
    }
    setLoading(true);
    try {
      const registerBody: Record<string, string> = {
        name: trimmedName,
        password,
        ...(trimmedId.includes('@') ? { email: trimmedId.toLowerCase() } : { phone: trimmedId }),
      };
      if (requiresInvitation) {
        registerBody.invitationToken = inviteCodeTrimmed;
        registerBody.role = role;
      }
      const { data } = await api.post<RegisterResponse>('/auth/register', registerBody);
      await saveAuthSession(data.refreshToken, data.user.id);
      setAuth(data.user.id, data.accessToken);
      analytics.track('account_created', { source: requiresInvitation ? 'invitation' : 'direct' });
      const pseudo = pseudonymizedUserId(data.user.id);
      if (pseudo) {
        analytics.identify(pseudo, {});
      }

      if (requiresInvitation) {
        const roleForAccept: Role = role;
        try {
          await api.post(`/invitations/${inviteCodeTrimmed}/accept`, { role: roleForAccept });
        } catch (acceptError: unknown) {
          if (axios.isAxiosError(acceptError) && acceptError.response?.status !== 409) {
            throw acceptError;
          }
        }
        const me = await fetchMe();
        applyMembershipsToTeamStore(me.memberships);
        analytics.track('invitation_accepted');
      }

      resetToMainApp();
    } catch (e: unknown) {
      console.log('[AccountCreation] register failed', e);
      if (axios.isAxiosError(e)) {
        const msg =
          typeof e.response?.data === 'object' &&
          e.response.data !== null &&
          'error' in e.response.data &&
          typeof (e.response.data as { error?: string }).error === 'string'
            ? (e.response.data as { error: string }).error
            : '';
        if (e.response?.status === 409 && msg.toLowerCase().includes('member')) {
          setInvitationError('You are already a member of this team');
          return;
        }
        if (e.response?.status === 409) {
          setIdentifierError(msg || 'This email or phone is already registered.');
          return;
        }
        if (e.response?.status === 404) {
          setInvitationError('This invitation code is invalid');
          return;
        }
        if (e.response?.status === 410) {
          setInvitationError('This invitation code has expired. Ask your coordinator to send a new one.');
          return;
        }
      }
      addToast('error', 'Could not create account. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [addToast, identifier, inviteCodeTrimmed, name, password, requiresInvitation, role, setAuth, validateInvitation]);

  return (
    <ScreenContainer scrollable>
      <Text variant="title" style={{ marginBottom: spacing.space8 }}>
        Create your account
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
        {requiresInvitation
          ? 'Choose your role, verify your invitation code, then set a password.'
          : 'You will create your first team next.'}
      </Text>
      <Text variant="label" colorToken={color.textLabel} style={{ marginBottom: spacing.space8 }}>
        Role
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space8, marginBottom: spacing.space16 }}>
        {(
          [
            ['coordinator', 'Coordinator'],
            ['player', 'Player'],
            ['coach', 'Coach'],
            ['staff', 'Staff'],
          ] as const
        ).map(([key, label]) => {
          const selected = role === key;
          return (
            <Pressable
              key={key}
              onPress={() => {
                setRole(key);
                setInvitationError('');
              }}
              style={{
                paddingVertical: spacing.space8,
                paddingHorizontal: spacing.space12,
                borderRadius: radius.sm,
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
      {requiresInvitation ? (
        <>
          <TextInput
            label="Invitation code"
            value={invitationCode}
            onChangeText={(t) => {
              setInvitationCode(t);
              setInvitationError('');
              setValidatedToken('');
              setValidatedTeamName('');
            }}
            placeholder="Paste your invitation code here"
            autoCapitalize="none"
            autoCorrect={false}
            errorMessage={invitationError}
          />
          {validatedTeamName && inviteValidated ? (
            <Text variant="caption" colorToken={color.textSecondary} style={{ marginBottom: spacing.space12 }}>
              Joining team: {validatedTeamName}
            </Text>
          ) : null}
          <LoadingButton
            label={validatingInvite ? 'Validating code...' : 'Validate code'}
            isLoading={validatingInvite}
            onPress={() => void validateInvitation()}
          />
          <View style={{ height: spacing.space12 }} />
        </>
      ) : null}
      <LoadingButton label="Create account" isLoading={loading} disabled={!canSubmit} onPress={() => void onSubmit()} />
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
