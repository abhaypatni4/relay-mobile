import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { TextInput } from '@/components/forms/TextInput';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { resetToMainApp } from '@/navigation/navigationRef';
import { api, saveAuthSession } from '@/services/api';
import { bootstrapSessionAfterAuth } from '@/services/session';
import { analytics } from '@/services/analytics';
import { apiBaseUrl } from '@/services/env';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { AuthNavigatorParamList } from '@/types/navigation';

interface LoginResponse {
  user: { id: string; name: string; email: string | null; phone: string | null };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function LoginScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('LoginScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<AuthNavigatorParamList, 'Login'>>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const addToast = useUiStore((s) => s.addToast);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(async () => {
    setIdentifierError('');
    const trimmed = identifier.trim();
    if (!trimmed || !password) {
      return;
    }
    setLoading(true);
    try {
      const body = trimmed.includes('@')
        ? { email: trimmed.toLowerCase(), password }
        : { phone: trimmed, password };
      const { data } = await api.post<LoginResponse>('/auth/login', body);
      await saveAuthSession(data.refreshToken, data.user.id);
      setAuth(data.user.id, data.accessToken);
      await bootstrapSessionAfterAuth();
      resetToMainApp();
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        setIdentifierError('That email or phone and password do not match. Try again.');
      } else {
        addToast('error', 'Login failed. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [addToast, identifier, password, setAuth]);

  return (
    <ScreenContainer scrollable>
      <Text variant="title" style={{ marginBottom: spacing.space8 }}>
        Welcome back
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
        Sign in with the email or phone you used to register.
      </Text>
      <Text variant="label" style={{ fontSize: 10, color: 'red', textAlign: 'center', marginBottom: spacing.space12 }}>
        API: {apiBaseUrl}
      </Text>
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
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <LoadingButton label="Sign in" isLoading={loading} onPress={() => void onSubmit()} />
      <View style={{ marginTop: spacing.space24, alignItems: 'center' }}>
        <Pressable onPress={() => navigation.navigate('AccountCreation')}>
          <Text variant="label" colorToken={color.actionPrimary}>
            Create an account
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
