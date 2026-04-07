import { Worker, type Job } from 'bullmq';
import type IORedis from 'ioredis';
import { QUEUE_NAMES } from './queue';

export function startTransferExpiryWorker(connection: IORedis): Worker {
  return new Worker(
    QUEUE_NAMES.transferExpiry,
    async (_job: Job) => {
      void _job;
      // M1+ — coordinator transfer expiry
      await Promise.resolve();
    },
    { connection, concurrency: 1 },
  );
}
