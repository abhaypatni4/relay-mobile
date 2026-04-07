import type { Worker } from 'bullmq';
import type { Env } from '../config/env';
import { startEmergencyInfoReminderWorker } from './emergencyInfoReminder.job';
import { startOverdueDetectionWorker } from './overdueDetection.job';
import { createQueues, createRedisConnection } from './queue';
import { startTransferExpiryWorker } from './transferExpiry.job';

let workers: Worker[] = [];
let queues: ReturnType<typeof createQueues> | undefined;

export function startJobInfrastructure(env: Env): void {
  queues = createQueues(env);
  workers = [
    startOverdueDetectionWorker(createRedisConnection(env)),
    startTransferExpiryWorker(createRedisConnection(env)),
    startEmergencyInfoReminderWorker(createRedisConnection(env)),
  ];
}

export function stopJobInfrastructure(): void {
  void Promise.all(workers.map((w) => w.close()));
  workers = [];
  void queues?.overdueDetection.close();
  void queues?.transferExpiry.close();
  void queues?.emergencyInfoReminder.close();
  queues = undefined;
}

export async function enqueueTestJob(): Promise<void> {
  if (!queues) {
    throw new Error('Queues not initialized');
  }
  await queues.overdueDetection.add(
    'relay.test',
    { at: Date.now() },
    { removeOnComplete: true, attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
  );
}

const EMERGENCY_REMINDER_DELAY_MS = 24 * 60 * 60 * 1000;

export async function enqueueEmergencyInfoReminder(userId: string): Promise<void> {
  if (!queues) {
    console.warn('Queues not initialized; skip emergency reminder scheduling');
    return;
  }
  await queues.emergencyInfoReminder.add(
    'deferredUserReminder',
    { userId },
    {
      delay: EMERGENCY_REMINDER_DELAY_MS,
      removeOnComplete: true,
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
    },
  );
}
