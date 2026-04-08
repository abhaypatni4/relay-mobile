import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { restoreSessionFromRefresh } from '@/services/api';
import { bootstrapSessionAfterAuth } from '@/services/session';
import { analytics } from '@/services/analytics';
import type { RootStackParamList } from '@/types/navigation';

export function SplashScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('SplashScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Splash'>>();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const restored = await restoreSessionFromRefresh();
      if (cancelled) {
        return;
      }
      if (restored) {
        await bootstrapSessionAfterAuth();
        if (!cancelled) {
          navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
        }
        return;
      }
      navigation.replace('Login');
    })();
    return () => {
      cancelled = true;
    };
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator accessibilityLabel="Loading" />
    </View>
  );
}
