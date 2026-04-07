import { Worker, type Job } from 'bullmq';
import type IORedis from 'ioredis';
import { prisma } from '../db/prisma';
import { sendToDevice } from '../services/notification.service';
import { QUEUE_NAMES } from './queue';

export function startEmergencyInfoReminderWorker(connection: IORedis): Worker {
  return new Worker(
    QUEUE_NAMES.emergencyInfoReminder,
    async (job: Job) => {
      if (job.name !== 'deferredUserReminder') {
        await Promise.resolve();
        return;
      }
      const payload = job.data as { userId?: string };
      const userId = payload.userId;
      if (userId === undefined || userId === '') {
        return;
      }
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushToken: true, name: true },
      });
      const token = user?.pushToken;
      if (!token) {
        return;
      }
      const team = await prisma.teamMember.findFirst({
        where: { userId, removedAt: null },
        include: { team: { select: { name: true } } },
      });
      const teamName = team?.team.name ?? 'Your team';
      await sendToDevice(token, {
        title: teamName,
        body: 'Complete your emergency info before your next trip',
        data: {
          deepLink: 'relay://profile/emergency',
          type: 'emergencyInfoReminder',
        },
      });
    },
    { connection, concurrency: 1 },
  );
}
