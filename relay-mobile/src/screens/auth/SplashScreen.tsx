import * as ExpoSplashScreen from 'expo-splash-screen';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { restoreSessionFromRefresh } from '@/services/api';
import { bootstrapSessionAfterAuth } from '@/services/session';
import { analytics } from '@/services/analytics';
import type { RootStackParamList } from '@/types/navigation';

const NAV_TIMEOUT_MS = 2000;

export function SplashScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('SplashScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Splash'>>();

  useEffect(() => {
    void ExpoSplashScreen.hideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let navigated = false;

    const go = (action: () => void): void => {
      if (cancelled || navigated) {
        return;
      }
      navigated = true;
      action();
    };

    const timer = setTimeout(() => {
      go(() => navigation.replace('Auth'));
    }, NAV_TIMEOUT_MS);

    void (async () => {
      try {
        const restoreResult = (async (): Promise<'main' | 'login' | 'aborted'> => {
          const restored = await restoreSessionFromRefresh();
          if (cancelled) {
            return 'aborted';
          }
          if (restored) {
            await bootstrapSessionAfterAuth();
            if (cancelled) {
              return 'aborted';
            }
            return 'main';
          }
          return 'login';
        })();

        const result = await Promise.race([
          restoreResult,
          new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), NAV_TIMEOUT_MS)),
        ]);

        clearTimeout(timer);

        if (cancelled || result === 'aborted') {
          return;
        }

        if (result === 'timeout') {
          go(() => navigation.replace('Auth'));
          return;
        }
        if (result === 'main') {
          go(() => navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] }));
        } else {
          go(() => navigation.replace('Auth'));
        }
      } catch {
        clearTimeout(timer);
        go(() => navigation.replace('Auth'));
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator accessibilityLabel="Loading" />
    </View>
  );
}
