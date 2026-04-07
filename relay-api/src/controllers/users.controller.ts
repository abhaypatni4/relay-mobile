import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';

const pushTokenBody = z.object({
  pushToken: z.string().trim().min(1),
});

export const usersController = {
  patchPushToken: async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const parsed = pushTokenBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { pushToken: parsed.data.pushToken },
    });
    res.status(204).send();
  },
};
