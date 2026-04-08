import type { Request, Response } from 'express';
import { z } from 'zod';
import { getPreDeparture, patchPreDepartureCustomItems } from '../services/predeparture.service';

const patchBody = z.object({
  items: z.array(
    z.object({
      id: z.string().trim().min(1).optional(),
      label: z.string().trim().min(1),
      isComplete: z.boolean(),
    }),
  ),
});

export const preDepartureController = {
  get: async (req: Request, res: Response): Promise<void> => {
    const raw = req.params.eventId;
    const eventId = Array.isArray(raw) ? raw[0] : raw;
    if (!eventId || !req.member) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
    if (req.member.role !== 'coordinator') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const out = await getPreDeparture(eventId);
    if (!out) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json(out);
  },

  patch: async (req: Request, res: Response): Promise<void> => {
    const raw = req.params.eventId;
    const eventId = Array.isArray(raw) ? raw[0] : raw;
    if (!eventId || !req.member) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
    if (req.member.role !== 'coordinator') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const parsed = patchBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    const out = await patchPreDepartureCustomItems(eventId, parsed.data.items);
    if (!out.ok) {
      if (out.code === 'TOO_MANY') {
        res.status(400).json({ error: 'Maximum 5 custom items allowed' });
        return;
      }
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json({ ok: true });
  },
};

