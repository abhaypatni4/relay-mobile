import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as Sentry from '@sentry/react-native';
import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
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
import { testConnection } from '@/services/api';
import { queryPersister } from '@/services/offlineCache';
import { analytics, pseudonymizedUserId } from '@/services/analytics';
import { createAppQueryClient } from '@/services/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
});

export default function App(): React.ReactElement {
  const [queryClient] = useState(() => createAppQueryClient());
  const wasOffline = useRef(false);
  const offlineStartedAt = useRef<number | null>(null);

  useEffect(() => {
    void testConnection();
  }, []);

  useEffect(() => {
    analytics.configure({
      getTeamSize: () => {
        const activeTeamId = useTeamStore.getState().activeTeamId;
        if (!activeTeamId) {
          return null;
        }
        const members = queryClient.getQueryData<Array<{ onboardingState?: string }>>(['members', activeTeamId]);
        if (!members) {
          return null;
        }
        return members.filter((m) => m.onboardingState !== 'pending').length;
      },
    });
    analytics.track('app_opened', { isFromNotification: false, notificationType: null });
    const rawUserId = useAuthStore.getState().userId;
    const pseudo = pseudonymizedUserId(rawUserId);
    if (pseudo) {
      analytics.identify(pseudo, {});
    }
  }, [queryClient]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        analytics.track('app_opened', { isFromNotification: false });
      }
    });
    return () => sub.remove();
  }, []);

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
        const durationSeconds = offlineStartedAt.current
          ? Math.max(0, Math.floor((Date.now() - offlineStartedAt.current) / 1000))
          : 0;
        analytics.track('offline_mode_exited', { offlineDurationSeconds: durationSeconds });
        analytics.flushQueueOnReconnect();
        offlineStartedAt.current = null;
      }
      if (!wasOffline.current && offline) {
        analytics.track('offline_mode_entered');
        offlineStartedAt.current = Date.now();
      }
      wasOffline.current = offline;
      store.setOffline(offline);
    });
  }, []);

  const persistOptions = useMemo(
    () => ({
      persister: queryPersister,
      dehydrateOptions: {
        /** First-slice trip/event/squad data for offline read (MMKV). */
        shouldDehydrateQuery: (q: { queryKey: readonly unknown[] }) => {
          const root = q.queryKey[0];
          if (root === 'auth') {
            return false;
          }
          return (
            root === 'teamEvents' ||
            root === 'eventDetail' ||
            root === 'eventAvailability' ||
            root === 'teamPosts' ||
            root === 'tripDocuments' ||
            root === 'emergencyInfo' ||
            root === 'tripWorkspace' ||
            root === 'tripSquad' ||
            root === 'tripEventId' ||
            root === 'playerHomeTravelingTrip'
          );
        },
      },
    }),
    [],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
          <NavigationContainer
            ref={navigationRef}
            linking={linking}
          >
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
