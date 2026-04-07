import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma';

/**
 * Requires :teamId route param. Attaches active team membership only (pending → 403).
 */
export async function requireTeamMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const raw = req.params.teamId;
  const teamId = Array.isArray(raw) ? raw[0] : raw;
  if (!teamId) {
    res.status(400).json({ error: 'teamId required' });
    return;
  }
  const member = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: req.user.userId,
      removedAt: null,
      onboardingState: 'active',
    },
  });
  if (!member) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  req.member = {
    id: member.id,
    userId: member.userId,
    teamId: member.teamId,
    role: member.role,
    onboardingState: member.onboardingState,
  };
  next();
}
