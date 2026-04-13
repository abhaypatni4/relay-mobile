import type { Request, Response } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { acceptInvitation, createInvitationForTeam, validateInvitationToken } from '../services/invitation.service';

const acceptBody = z.object({
  role: z.enum(Role).optional(),
});

export const invitationsController = {
  validatePublic: async (req: Request, res: Response): Promise<void> => {
    const raw = req.params.token;
    const token = Array.isArray(raw) ? raw[0] : raw;
    if (!token) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const result = await validateInvitationToken(token);
    if (!result.ok) {
      if (result.reason === 'expired') {
        res.status(410).json({ error: 'expired', valid: false });
        return;
      }
      res.status(404).json({ error: 'Not found', valid: false });
      return;
    }
    res.json({ teamName: result.teamName, sport: result.sport, valid: true });
  },

  accept: async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const raw = req.params.token;
    const token = Array.isArray(raw) ? raw[0] : raw;
    if (!token) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const parsed = acceptBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    try {
      const role = parsed.data.role ?? 'player';
      const out = await acceptInvitation(req.user.userId, token, role);
      res.status(201).json({
        teamId: out.teamId,
        teamMemberId: out.teamMemberId,
        teamName: out.teamName,
      });
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'ALREADY_MEMBER') {
        res.status(409).json({ error: 'Already a member of this team' });
        return;
      }
      if (code === 'INVITE_EXPIRED') {
        res.status(410).json({ error: 'expired' });
        return;
      }
      if (code === 'INVITE_NOT_FOUND') {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      throw e;
    }
  },

  createForTeam: async (req: Request, res: Response): Promise<void> => {
    const teamId = req.params.teamId;
    const id = Array.isArray(teamId) ? teamId[0] : teamId;
    if (!id) {
      res.status(400).json({ error: 'teamId required' });
      return;
    }
    const { token, expiresAt } = await createInvitationForTeam(id);
    res.status(201).json({
      token,
      expiresAt: expiresAt.toISOString(),
      deepLink: `relay://invite/${token}`,
    });
  },
};
