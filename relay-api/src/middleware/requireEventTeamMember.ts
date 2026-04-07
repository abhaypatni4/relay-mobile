import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma';

/**
 * Requires :eventId. Loads event and verifies active team membership on event.teamId.
 */
export async function requireEventTeamMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const raw = req.params.eventId;
  const eventId = Array.isArray(raw) ? raw[0] : raw;
  if (!eventId) {
    res.status(400).json({ error: 'eventId required' });
    return;
  }
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, teamId: true, type: true, status: true, name: true },
  });
  if (!event) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const member = await prisma.teamMember.findFirst({
    where: {
      teamId: event.teamId,
      userId: req.user.userId,
      removedAt: null,
      onboardingState: 'active',
    },
  });
  if (!member) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  req.eventRow = event;
  req.member = {
    id: member.id,
    userId: member.userId,
    teamId: member.teamId,
    role: member.role,
    onboardingState: member.onboardingState,
  };
  next();
}
