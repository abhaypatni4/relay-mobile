import { Worker, type Job } from 'bullmq';
import type IORedis from 'ioredis';
import { QUEUE_NAMES } from './queue';

export function startOverdueDetectionWorker(connection: IORedis): Worker {
  return new Worker(
    QUEUE_NAMES.overdueDetection,
    async (job: Job) => {
      if (job.name === 'relay.test') {
        console.log('overdueDetection test job completed');
      }
      // M1+ — overdue post detection
      await Promise.resolve();
    },
    { connection, concurrency: 1 },
  );
}
