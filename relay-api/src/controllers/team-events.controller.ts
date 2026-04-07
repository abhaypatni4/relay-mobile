import type { Request, Response } from 'express';
import { z } from 'zod';
import { EventType } from '@prisma/client';
import { serializeEventBase, serializeTripWorkspace } from '../serializers/event.serializer';
import {
  createTeamEvent,
  getEventByIdForTeam,
  listTeamEventsChronological,
  patchTeamEvent,
} from '../services/event.service';

const createBody = z.object({
  type: z.enum(EventType),
  name: z.string().trim().min(1),
  date: z.string().trim().min(1),
  startTime: z.string().trim().min(1),
  location: z.string().trim().optional().nullable(),
});

const patchBody = z.object({
  name: z.string().trim().min(1).optional(),
  date: z.string().trim().optional(),
  startTime: z.string().trim().optional(),
  location: z.string().trim().optional().nullable(),
});

function parseEventDate(s: string): Date {
  if (s.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T12:00:00.000Z`);
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    throw new Error('BAD_DATE');
  }
  return d;
}

export const teamEventsController = {
  create: async (req: Request, res: Response): Promise<void> => {
    if (!req.member) {
      res.status(500).json({ error: 'Missing member' });
      return;
    }
    const teamId = req.params.teamId;
    const id = Array.isArray(teamId) ? teamId[0] : teamId;
    if (!id) {
      res.status(400).json({ error: 'teamId required' });
      return;
    }
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    let dateVal: Date;
    try {
      dateVal = parseEventDate(parsed.data.date);
    } catch {
      res.status(400).json({ error: 'Invalid date' });
      return;
    }
    try {
      const out = await createTeamEvent(id, req.member.id, {
        type: parsed.data.type,
        name: parsed.data.name,
        date: dateVal,
        startTime: parsed.data.startTime,
        location: parsed.data.location,
      });
      const full = await getEventByIdForTeam(id, out.eventId);
      if (!full) {
        res.status(500).json({ error: 'Failed to load event' });
        return;
      }
      const base = serializeEventBase(full);
      const body: Record<string, unknown> = { event: base, tripWorkspaceId: out.tripWorkspaceId };
      if (full.tripWorkspace) {
        body.tripWorkspace = serializeTripWorkspace(full.tripWorkspace);
      }
      res.status(201).json(body);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      res.status(400).json({ error: msg || 'Error' });
    }
  },

  list: async (req: Request, res: Response): Promise<void> => {
    const teamId = req.params.teamId;
    const id = Array.isArray(teamId) ? teamId[0] : teamId;
    if (!id) {
      res.status(400).json({ error: 'teamId required' });
      return;
    }
    const rows = await listTeamEventsChronological(id);
    res.json({ events: rows.map((e) => serializeEventBase(e)) });
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const teamId = req.params.teamId;
    const tid = Array.isArray(teamId) ? teamId[0] : teamId;
    const eventId = req.params.eventId;
    const eid = Array.isArray(eventId) ? eventId[0] : eventId;
    if (!tid || !eid) {
      res.status(400).json({ error: 'teamId and eventId required' });
      return;
    }
    const full = await getEventByIdForTeam(tid, eid);
    if (!full) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const base = serializeEventBase(full);
    if (full.type === 'trip' && full.tripWorkspace) {
      res.json({
        ...base,
        tripWorkspace: serializeTripWorkspace(full.tripWorkspace),
      });
      return;
    }
    res.json(base);
  },

  patch: async (req: Request, res: Response): Promise<void> => {
    const teamId = req.params.teamId;
    const tid = Array.isArray(teamId) ? teamId[0] : teamId;
    const eventId = req.params.eventId;
    const eid = Array.isArray(eventId) ? eventId[0] : eventId;
    if (!tid || !eid) {
      res.status(400).json({ error: 'teamId and eventId required' });
      return;
    }
    const parsed = patchBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }
    try {
      let dateVal: Date | undefined;
      if (parsed.data.date !== undefined) {
        try {
          dateVal = parseEventDate(parsed.data.date);
        } catch {
          res.status(400).json({ error: 'Invalid date' });
          return;
        }
      }
      await patchTeamEvent(tid, eid, {
        name: parsed.data.name,
        date: dateVal,
        startTime: parsed.data.startTime,
        location: parsed.data.location,
      });
      const full = await getEventByIdForTeam(tid, eid);
      if (!full) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      const base = serializeEventBase(full);
      if (full.type === 'trip' && full.tripWorkspace) {
        res.json({
          ...base,
          tripWorkspace: serializeTripWorkspace(full.tripWorkspace),
        });
        return;
      }
      res.json(base);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'EVENT_NOT_FOUND') {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      throw e;
    }
  },
};
