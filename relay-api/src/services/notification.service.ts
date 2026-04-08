import admin from 'firebase-admin';
import type { Env } from '../config/env';
import { isFirebaseConfigured } from '../config/env';
import { prisma } from '../db/prisma';

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

const EXCLUDED_CAP_TYPES = new Set([
  'ACKNOWLEDGMENT_NUDGE',
  'urgentAlert',
  'TRIP_CANCELLED',
  'TRIP_POSTPONED',
  'COORDINATOR_TRANSFER_REQUEST',
]);

export async function canSendNotification(userId: string, notificationType: string): Promise<boolean> {
  if (EXCLUDED_CAP_TYPES.has(notificationType)) {
    return true;
  }
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await prisma.notificationLog.count({
    where: {
      userId,
      sentAt: { gte: since },
      type: { notIn: Array.from(EXCLUDED_CAP_TYPES) },
    },
  });
  return count < 3;
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
  const notificationType = notification.data.type ?? 'unknown';
  const tokens = pushTokens.filter((t) => t.length > 0);
  await Promise.all(tokens.map(async (t) => {
    const user = await prisma.user.findFirst({
      where: { pushToken: t },
      select: { id: true },
    });

    if (user) {
      const allowed = await canSendNotification(user.id, notificationType);
      if (!allowed) {
        console.info(
          `[notifications] skipped due to daily cap user=${user.id} type=${notificationType}`,
        );
        return;
      }
    }

    await sendToDevice(t, notification).catch((err: unknown) => {
        console.error('sendToDevice failed', err);
      });

    if (user) {
      await prisma.notificationLog.create({
        data: {
          userId: user.id,
          type: notificationType,
        },
      });
    }
  }));
}
