import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as Sentry from '@sentry/react-native';
import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { ToastHost } from '@/components/feedback/Toast';
import { linking } from '@/navigation/linking.config';
import { navigationRef } from '@/navigation/navigationRef';
import { RootNavigator } from '@/navigation/RootNavigator';
import {
  attachNotificationListeners,
  configureNotificationPresentation,
  ensureAndroidNotificationChannel,
  syncPushTokenIfPermissionGranted,
} from '@/services/notifications';
import { queryPersister } from '@/services/offlineCache';
import { createAppQueryClient } from '@/services/queryClient';
import { useUiStore } from '@/store/uiStore';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
});

export default function App(): React.ReactElement {
  const [queryClient] = useState(() => createAppQueryClient());
  const wasOffline = useRef(false);

  useEffect(() => {
    configureNotificationPresentation();
    void ensureAndroidNotificationChannel();
    const listeners = attachNotificationListeners();
    void syncPushTokenIfPermissionGranted();
    return () => listeners.remove();
  }, []);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      const offline = !state.isConnected;
      const store = useUiStore.getState();
      if (wasOffline.current && !offline) {
        store.addToast('success', 'Back online');
      }
      wasOffline.current = offline;
      store.setOffline(offline);
    });
  }, []);

  const persistOptions = useMemo(
    () => ({
      persister: queryPersister,
      dehydrateOptions: {
        shouldDehydrateQuery: (q: { queryKey: readonly unknown[] }) => q.queryKey[0] !== 'auth',
      },
    }),
    [],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
          <NavigationContainer ref={navigationRef} linking={linking}>
            <View style={{ flex: 1 }}>
              <OfflineBanner />
              <View style={{ flex: 1 }}>
                <RootNavigator />
              </View>
              <ToastHost />
            </View>
          </NavigationContainer>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
