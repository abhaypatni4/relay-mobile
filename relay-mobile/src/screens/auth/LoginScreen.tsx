import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { TextInput } from '@/components/forms/TextInput';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api, saveAuthSession } from '@/services/api';
import { bootstrapSessionAfterAuth } from '@/services/session';
import { analytics } from '@/services/analytics';
import { useAuthStore } from '@/store/authStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { RootStackParamList } from '@/types/navigation';

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

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Login'>>();
  const setAuth = useAuthStore((s) => s.setAuth);
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
      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        setIdentifierError('That email or phone and password do not match. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [identifier, password, navigation, setAuth]);

  return (
    <ScreenContainer scrollable>
      <Text variant="title" style={{ marginBottom: spacing.space8 }}>
        Welcome back
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
        Sign in with the email or phone you used to register.
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
