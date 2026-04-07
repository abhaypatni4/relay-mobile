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
