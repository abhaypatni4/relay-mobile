import { Worker, type Job } from 'bullmq';
import type IORedis from 'ioredis';
import { expirePendingTransfers } from '../services/transfers.service';
import { QUEUE_NAMES } from './queue';

export function startTransferExpiryWorker(connection: IORedis): Worker {
  return new Worker(
    QUEUE_NAMES.transferExpiry,
    async (job: Job) => {
      if (job.name !== 'transferExpiry.scan') {
        return;
      }
      await expirePendingTransfers();
    },
    { connection, concurrency: 1 },
  );
}
