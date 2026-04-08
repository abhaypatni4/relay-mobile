import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  serializeAvailabilitySubmission,
  serializeAvailabilityWindow,
} from '../serializers/availability.serializer';
import {
  lockAvailabilityWindow,
  loadSubmissionsForWindow,
  openAvailabilityWindow,
  patchOperationalStatus,
  sendSelectionNotifications,
  submitAvailability,
  toSubmissionRow,
} from '../services/availability.service';
import { prisma } from '../db/prisma';

const submitBody = z.object({
  availabilityStatus: z.enum(['available', 'limited', 'unavailable']),
  note: z.string().max(120).optional().nullable(),
});

const operationalBody = z.object({
  operationalStatus: z.enum([
    'selected',
    'notSelected',
    'traveling',
    'medicallyRestricted',
    'unassigned',
  ]),
});

export const availabilityController = {
  open: async (req: Request, res: Response): Promise<void> => {
    if (!req.member || !req.eventRow) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    const eventId = req.eventRow.id;
    const out = await openAvailabilityWindow(eventId, req.member.id, req.eventRow.name);
    if (!out.ok) {
      if (out.code === 'EVENT_NOT_FOUND') {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.status(409).json({ error: 'Availability window already open for this event' });
      return;
    }
    res.status(201).json({ windowId: out.windowId });
  },

  get: async (req: Request, res: Response): Promise<void> => {
    if (!req.member || !req.eventRow) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    const eventId = req.eventRow.id;
    const member = req.member;
    const role = member.role;

    const window = await prisma.availabilityWindow.findUnique({ where: { eventId } });
    if (!window) {
      res.json({ window: null, submissions: [] });
      return;
    }

    const rows = await loadSubmissionsForWindow(window.id);
    let filtered = rows;
    if (role === 'player' || role === 'staff') {
      filtered = rows.filter((r) => r.teamMemberId === member.id);
    }

    const selectionNotificationsSent = Boolean(window.selectionNotificationsSentAt);

    const submissions = filtered.map((r) => {
      const sr = toSubmissionRow(r);
      return serializeAvailabilitySubmission(
        role,
        {
          id: sr.id,
          teamMemberId: sr.teamMemberId,
          memberName: sr.memberName,
          memberRole: sr.memberRole,
          availabilityStatus: sr.availabilityStatus,
          note: sr.note,
          operationalStatus: sr.operationalStatus,
          operationalStatusSetBy: sr.operationalStatusSetBy,
          submittedAt: sr.submittedAt,
          updatedAt: sr.updatedAt,
          selectionNotificationSentAt: sr.selectionNotificationSentAt,
        },
        { selectionNotificationsSent },
      );
    });

    res.json({
      window: serializeAvailabilityWindow(window),
      submissions,
    });
  },

  submit: async (req: Request, res: Response): Promise<void> => {
    if (!req.member || !req.eventRow) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    const parsed = submitBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    const note = parsed.data.note?.trim() ? parsed.data.note.trim() : null;
    const out = await submitAvailability(req.eventRow.id, req.member.id, {
      availabilityStatus: parsed.data.availabilityStatus,
      note,
    });
    if (!out.ok) {
      if (out.code === 'NO_WINDOW') {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      if (out.code === 'LOCKED') {
        res.status(400).json({ error: 'Availability is now locked. Your response was not saved.' });
        return;
      }
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.status(200).json({ ok: true });
  },

  patchOperational: async (req: Request, res: Response): Promise<void> => {
    if (!req.member || !req.eventRow) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    const submissionIdRaw = req.params.submissionId;
    const submissionId = Array.isArray(submissionIdRaw) ? submissionIdRaw[0] : submissionIdRaw;
    if (!submissionId) {
      res.status(400).json({ error: 'submissionId required' });
      return;
    }
    const parsed = operationalBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    const out = await patchOperationalStatus(
      req.eventRow.id,
      submissionId,
      req.member.role,
      req.member.id,
      parsed.data.operationalStatus,
    );
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

  lock: async (req: Request, res: Response): Promise<void> => {
    if (!req.eventRow) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    const out = await lockAvailabilityWindow(req.eventRow.id, req.eventRow.name);
    if (!out.ok) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json({ ok: true });
  },

  notify: async (req: Request, res: Response): Promise<void> => {
    if (!req.eventRow) {
      res.status(500).json({ error: 'Missing context' });
      return;
    }
    const counts = await sendSelectionNotifications(req.eventRow.id, req.eventRow.name);
    res.status(200).json(counts);
  },
};
