import { Worker, type Job } from 'bullmq';
import type IORedis from 'ioredis';
import { QUEUE_NAMES } from './queue';

export function startEmergencyInfoReminderWorker(connection: IORedis): Worker {
  return new Worker(
    QUEUE_NAMES.emergencyInfoReminder,
    async (_job: Job) => {
      void _job;
      // M1+ — emergency info reminder
      await Promise.resolve();
    },
    { connection, concurrency: 1 },
  );
}
