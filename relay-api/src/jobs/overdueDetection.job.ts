import { Worker, type Job } from 'bullmq';
import type IORedis from 'ioredis';
import { prisma } from '../db/prisma';
import { QUEUE_NAMES } from './queue';

export function startOverdueDetectionWorker(connection: IORedis): Worker {
  return new Worker(
    QUEUE_NAMES.overdueDetection,
    async (job: Job) => {
      if (job.name === 'relay.test') {
        console.log('overdueDetection test job completed');
      }
      if (job.name !== 'overdueDetection.scan') {
        return;
      }

      const now = new Date();
      const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const posts = await prisma.post.findMany({
        where: {
          requiresAcknowledgment: true,
          deletedAt: null,
          isDraft: false,
          createdAt: { gte: since },
        },
        select: {
          id: true,
          createdAt: true,
          overdueThresholdHours: true,
        },
      });

      // Store computed overdue members in Redis for fast read in API layer.
      // Key format is intentionally opaque to clients; API remains source of truth.
      for (const p of posts) {
        const overdueAt = new Date(p.createdAt.getTime() + p.overdueThresholdHours * 60 * 60 * 1000);
        const key = `relay:overdue:${p.id}`;
        if (overdueAt > now) {
          await connection.del(key);
          continue;
        }
        const overdueStates = await prisma.postDeliveryState.findMany({
          where: {
            postId: p.id,
            deliveryState: { not: 'acknowledged' },
            teamMember: { removedAt: null, onboardingState: 'active' },
          },
          select: { teamMemberId: true },
        });
        const payload = JSON.stringify({
          computedAt: now.toISOString(),
          overdueMemberIds: overdueStates.map((r) => r.teamMemberId),
        });
        await connection.set(key, payload, 'EX', 2 * 60 * 60); // TTL 2hrs; refreshed every 30m
      }
    },
    { connection, concurrency: 1 },
  );
}
