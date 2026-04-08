import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  createTransfer,
  getPendingTransferForTeam,
  getTransferForTeam,
  respondToTransfer,
} from '../services/transfers.service';

const createBody = z.object({
  toMemberId: z.string().trim().min(1),
});

const respondBody = z.object({
  action: z.enum(['accept', 'decline']),
});

export const transfersController = {
  listPending: async (req: Request, res: Response): Promise<void> => {
    const teamRaw = req.params.teamId;
    const teamId = Array.isArray(teamRaw) ? teamRaw[0] : teamRaw;
    if (!teamId || !req.member) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
    const transfer = await getPendingTransferForTeam(teamId);
    res.status(200).json({ transfer });
  },

  create: async (req: Request, res: Response): Promise<void> => {
    const teamRaw = req.params.teamId;
    const teamId = Array.isArray(teamRaw) ? teamRaw[0] : teamRaw;
    const parsed = createBody.safeParse(req.body);
    if (!req.member || !teamId || !parsed.success) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
    if (req.member.role !== 'coordinator') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const out = await createTransfer(teamId, req.member.id, parsed.data.toMemberId);
    if (!out.ok) {
      if (out.code === 'TARGET_NOT_ACTIVE') {
        res.status(400).json({ error: 'Member must complete onboarding first' });
        return;
      }
      if (out.code === 'PENDING_EXISTS') {
        res.status(409).json({ error: 'A transfer is already pending. Cancel the current request first.' });
        return;
      }
      if (out.code === 'FORBIDDEN') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(201).json({ transfer: out.transfer });
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const teamRaw = req.params.teamId;
    const transferRaw = req.params.transferId;
    const teamId = Array.isArray(teamRaw) ? teamRaw[0] : teamRaw;
    const transferId = Array.isArray(transferRaw) ? transferRaw[0] : transferRaw;
    if (!teamId || !transferId || !req.member) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
    const row = await getTransferForTeam(teamId, transferId);
    if (!row) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json({ transfer: row });
  },

  respond: async (req: Request, res: Response): Promise<void> => {
    const teamRaw = req.params.teamId;
    const transferRaw = req.params.transferId;
    const teamId = Array.isArray(teamRaw) ? teamRaw[0] : teamRaw;
    const transferId = Array.isArray(transferRaw) ? transferRaw[0] : transferRaw;
    const parsed = respondBody.safeParse(req.body);
    if (!teamId || !transferId || !req.member || !parsed.success) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
    const out = await respondToTransfer({
      teamId,
      transferId,
      actingMemberId: req.member.id,
      action: parsed.data.action,
    });
    if (!out.ok) {
      if (out.code === 'NOT_VALID') {
        res.status(409).json({ error: 'Transfer is no longer valid' });
        return;
      }
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.status(200).json({ transfer: out.transfer });
  },
};

