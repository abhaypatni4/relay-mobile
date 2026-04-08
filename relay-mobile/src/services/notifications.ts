import { CommonActions, getStateFromPath } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { linking } from '@/navigation/linking.config';
import { navigationRef } from '@/navigation/navigationRef';
import { useUiStore } from '@/store/uiStore';
import { analytics } from '@/services/analytics';
import { api } from './api';

export type NotificationDataPayload = {
  deepLink: string;
  type?: string;
  [key: string]: string | undefined;
};

function getExpoProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
}

export function configureNotificationPresentation(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
  });
}

export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Relay',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

function navigateFromDeepLink(url: string): void {
  const trimmed = url.replace(/^relay:\/\//i, '').replace(/^relay:/i, '');
  const pathOnly = trimmed.split('?')[0] ?? trimmed;
  const state = getStateFromPath(pathOnly, linking.config);
  if (state && navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.reset(state as never));
    return;
  }
  useUiStore.getState().addToast('error', 'Could not open link.');
  const fallback = getStateFromPath('events', linking.config);
  if (fallback && navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.reset(fallback as never));
  }
}

export function attachNotificationListeners(): { remove: () => void } {
  const subReceive = Notifications.addNotificationReceivedListener((event) => {
    const { title, body } = event.request.content;
    const line = [title, body].filter(Boolean).join(' — ');
    useUiStore.getState().addToast('success', line || 'Notification');
  });

  const subResponse = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as NotificationDataPayload | undefined;
    const deepLink = data?.deepLink;
    const notificationType = data?.type;
    if (notificationType === 'SELECTION_SELECTED' || notificationType === 'SELECTION_NOT_SELECTED') {
      analytics.track('selection_notification_opened', {
        selectionResult: notificationType === 'SELECTION_SELECTED' ? 'selected' : 'notSelected',
      });
    }
    if (typeof deepLink === 'string') {
      navigateFromDeepLink(deepLink);
    }
  });

  return {
    remove: () => {
      subReceive.remove();
      subResponse.remove();
    },
  };
}

export async function syncPushTokenIfPermissionGranted(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    return;
  }
  const projectId = getExpoProjectId();
  try {
    const tokenRes = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    const token = tokenRes.data;
    await api.patch('/users/me/push-token', { pushToken: token });
  } catch (e) {
    console.warn('Push token sync skipped', e);
  }
}
