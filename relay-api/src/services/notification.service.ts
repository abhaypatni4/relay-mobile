import admin from 'firebase-admin';
import type { Env } from '../config/env';
import { isFirebaseConfigured } from '../config/env';

/**
 * Every push must include deepLink in `data` for mobile deep routing (docs).
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  data: {
    deepLink: string;
    [key: string]: string;
  };
}

export function initFirebaseIfConfigured(env: Env): void {
  if (!isFirebaseConfigured(env)) {
    return;
  }
  if (admin.apps.length > 0) {
    return;
  }
  const projectId = env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) {
    return;
  }
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export async function sendToDevice(
  pushToken: string,
  notification: PushNotificationPayload,
): Promise<void> {
  if (admin.apps.length === 0) {
    console.warn('Firebase Admin not configured; sendToDevice skipped');
    return;
  }
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(notification.data)) {
    data[k] = typeof v === 'string' ? v : String(v);
  }
  await admin.messaging().send({
    token: pushToken,
    notification: { title: notification.title, body: notification.body },
    data,
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default' } } },
  });
}

export async function sendToMultiple(
  pushTokens: string[],
  notification: PushNotificationPayload,
): Promise<void> {
  const tokens = pushTokens.filter((t) => t.length > 0);
  await Promise.all(
    tokens.map((t) =>
      sendToDevice(t, notification).catch((err: unknown) => {
        console.error('sendToDevice failed', err);
      }),
    ),
  );
}
