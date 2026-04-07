import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import type { Env } from '../config/env';

let parentRedis: IORedis | undefined;

function getParentRedis(env: Env): IORedis {
  parentRedis ??= new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  return parentRedis;
}

/** BullMQ requires a dedicated connection per queue/worker; duplicate from a shared parent. */
export function createRedisConnection(env: Env): IORedis {
  return getParentRedis(env).duplicate();
}

export const QUEUE_NAMES = {
  overdueDetection: 'overdueDetection',
  transferExpiry: 'transferExpiry',
  emergencyInfoReminder: 'emergencyInfoReminder',
} as const;

export function createQueues(env: Env): {
  overdueDetection: Queue;
  transferExpiry: Queue;
  emergencyInfoReminder: Queue;
} {
  return {
    overdueDetection: new Queue(QUEUE_NAMES.overdueDetection, {
      connection: createRedisConnection(env),
    }),
    transferExpiry: new Queue(QUEUE_NAMES.transferExpiry, {
      connection: createRedisConnection(env),
    }),
    emergencyInfoReminder: new Queue(QUEUE_NAMES.emergencyInfoReminder, {
      connection: createRedisConnection(env),
    }),
  };
}
