import type { Request, Response } from 'express';
import { z } from 'zod';
import type { DocumentApplicability } from '@prisma/client';
import {
  addChecklistItem,
  confirmChecklistItem,
  deleteChecklistItem,
  listChecklistItems,
  remindOutstandingMembers,
} from '../services/trip-documents.service';

const addBody = z
  .object({
    name: z.string().trim().min(1),
    applicability: z.enum(['allPlayers', 'travelingSquad', 'specific']),
    specificMemberIds: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

export const tripDocumentsController = {
  addItem: async (req: Request, res: Response): Promise<void> => {
    if (!req.member || !req.eventRow) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    if (req.eventRow.type !== 'trip') {
      res.status(400).json({ error: 'Not a trip event' });
      return;
    }
    const parsed = addBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }

    const applicability = parsed.data.applicability as DocumentApplicability;
    const specificMemberIds =
      applicability === 'specific' ? parsed.data.specificMemberIds ?? [] : [];
    if (applicability === 'specific' && specificMemberIds.length === 0) {
      res.status(400).json({ error: 'specificMemberIds required for applicability=specific' });
      return;
    }

    const out = await addChecklistItem(req.eventRow.id, req.member.id, {
      name: parsed.data.name,
      applicability,
      specificMemberIds,
    });

    if (!out.ok) {
      if (out.code === 'NOT_FOUND') {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.status(201).json({ itemId: out.itemId });
  },

  list: async (req: Request, res: Response): Promise<void> => {
    if (!req.member || !req.eventRow) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    if (req.eventRow.type !== 'trip') {
      res.status(400).json({ error: 'Not a trip event' });
      return;
    }
    const out = await listChecklistItems(req.eventRow.id, req.member);
    if (!out.ok) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json(out.body);
  },

  confirm: async (req: Request, res: Response): Promise<void> => {
    if (!req.member || !req.eventRow) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    const raw = req.params.itemId;
    const itemId = Array.isArray(raw) ? raw[0] : raw;
    if (!itemId) {
      res.status(400).json({ error: 'itemId required' });
      return;
    }
    const out = await confirmChecklistItem(req.eventRow.id, itemId, req.member.id);
    if (!out.ok) {
      if (out.code === 'NOT_FOUND') {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      if (out.code === 'NOT_APPLICABLE') {
        res.status(400).json({ error: 'You are not applicable for this item' });
        return;
      }
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.status(200).json({ ok: true });
  },

  deleteItem: async (req: Request, res: Response): Promise<void> => {
    if (!req.member || !req.eventRow) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    const raw = req.params.itemId;
    const itemId = Array.isArray(raw) ? raw[0] : raw;
    if (!itemId) {
      res.status(400).json({ error: 'itemId required' });
      return;
    }
    const out = await deleteChecklistItem(req.eventRow.id, req.member.role, itemId);
    if (!out.ok) {
      if (out.code === 'NOT_FOUND') {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.status(200).json({ ok: true });
  },

  remind: async (req: Request, res: Response): Promise<void> => {
    if (!req.member || !req.eventRow) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    if (req.member.role !== 'coordinator') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const out = await remindOutstandingMembers(req.eventRow.id, req.eventRow.name);
    if (!out.ok) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json({ remindedCount: out.remindedCount });
  },
};

