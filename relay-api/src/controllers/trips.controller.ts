import type { Request, Response } from 'express';
import { z } from 'zod';
import { TravelingStatus } from '@prisma/client';
import { cancelTripEvent } from '../services/event.service';
import { postponeTripEvent } from '../services/event.service';
import { serializeTripWorkspace } from '../serializers/event.serializer';
import {
  acknowledgeTripItinerary,
  bulkPatchTripSquad,
  dispatchItineraryCriticalFieldNotifications,
  getTripWorkspaceByEventId,
  listTripSquadWithMembers,
  patchTripItineraryWithVersioning,
  publishTrip,
  type ItineraryPatchInput,
} from '../services/trip.service';

const itineraryPatchBody = z
  .object({
    departureTime: z.string().optional().nullable(),
    departureMeetingPoint: z.string().optional().nullable(),
    transportationNotes: z.string().optional().nullable(),
    accommodationName: z.string().optional().nullable(),
    accommodationAddress: z.string().optional().nullable(),
    accommodationCheckInTime: z.string().optional().nullable(),
    matchEventTime: z.string().optional().nullable(),
    matchEventLocation: z.string().optional().nullable(),
    returnDepartureTime: z.string().optional().nullable(),
    returnDeparturePoint: z.string().optional().nullable(),
    additionalNotes: z.string().optional().nullable(),
  })
  .strict();

const squadPatchBody = z.object({
  assignments: z.array(
    z.object({
      teamMemberId: z.string().trim().min(1),
      travelingStatus: z.enum(TravelingStatus),
    }),
  ),
});

const acknowledgeBody = z
  .object({
    expectedVersion: z.number().int(),
  })
  .strict();

const postponeBody = z
  .object({
    newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    newTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  })
  .strict();

export const tripsController = {
  cancelTrip: async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId;
    const eid = Array.isArray(eventId) ? eventId[0] : eventId;
    if (!eid || !req.eventRow) {
      res.status(400).json({ error: 'eventId required' });
      return;
    }
    const result = await cancelTripEvent(eid);
    if (result === 'ok') {
      res.status(200).json({ cancelled: true });
      return;
    }
    if (result === 'ALREADY_CANCELLED') {
      res.status(409).json({ error: 'Event is already cancelled' });
      return;
    }
    if (result === 'NOT_TRIP') {
      res.status(400).json({ error: 'Only trip events can be cancelled with this action' });
      return;
    }
    res.status(404).json({ error: 'Not found' });
  },

  getTrip: async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId;
    const eid = Array.isArray(eventId) ? eventId[0] : eventId;
    if (!eid || !req.eventRow) {
      res.status(400).json({ error: 'eventId required' });
      return;
    }
    if (req.eventRow.type !== 'trip') {
      res.status(400).json({ error: 'Not a trip event' });
      return;
    }
    const tw = await getTripWorkspaceByEventId(eid);
    if (!tw) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(serializeTripWorkspace(tw));
  },

  patchItinerary: async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId;
    const eid = Array.isArray(eventId) ? eventId[0] : eventId;
    if (!eid || !req.eventRow) {
      res.status(400).json({ error: 'eventId required' });
      return;
    }
    if (req.eventRow.type !== 'trip') {
      res.status(400).json({ error: 'Not a trip event' });
      return;
    }
    const parsed = itineraryPatchBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    const patch = parsed.data as ItineraryPatchInput;
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }
    try {
      const { previousVersion } = await patchTripItineraryWithVersioning(eid, patch);
      const tw = await getTripWorkspaceByEventId(eid);
      if (!tw) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      if (previousVersion !== null) {
        await dispatchItineraryCriticalFieldNotifications(tw.id, req.eventRow.name, previousVersion);
      }
      res.json(serializeTripWorkspace(tw));
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'TRIP_NOT_FOUND') {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      throw e;
    }
  },

  getSquad: async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId;
    const eid = Array.isArray(eventId) ? eventId[0] : eventId;
    if (!eid || !req.eventRow) {
      res.status(400).json({ error: 'eventId required' });
      return;
    }
    if (req.eventRow.type !== 'trip') {
      res.status(400).json({ error: 'Not a trip event' });
      return;
    }
    const tw = await getTripWorkspaceByEventId(eid);
    if (!tw) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const rows = await listTripSquadWithMembers(tw.id);
    res.json({
      assignments: rows.map((r) => ({
        id: r.id,
        tripWorkspaceId: r.tripWorkspaceId,
        teamMemberId: r.teamMemberId,
        travelingStatus: r.travelingStatus,
        acknowledgedItineraryVersion: r.acknowledgedItineraryVersion,
        memberName: r.teamMember.user.name,
        memberRole: r.teamMember.role,
        onboardingState: r.teamMember.onboardingState,
      })),
    });
  },

  patchSquad: async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId;
    const eid = Array.isArray(eventId) ? eventId[0] : eventId;
    if (!eid || !req.eventRow) {
      res.status(400).json({ error: 'eventId required' });
      return;
    }
    if (req.eventRow.type !== 'trip') {
      res.status(400).json({ error: 'Not a trip event' });
      return;
    }
    const parsed = squadPatchBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    const tw = await getTripWorkspaceByEventId(eid);
    if (!tw) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    try {
      await bulkPatchTripSquad(tw.id, req.eventRow.teamId, parsed.data.assignments);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'INVALID_MEMBER') {
        res.status(400).json({ error: 'Invalid team member in squad list' });
        return;
      }
      throw e;
    }
    const rows = await listTripSquadWithMembers(tw.id);
    res.json({
      assignments: rows.map((r) => ({
        id: r.id,
        tripWorkspaceId: r.tripWorkspaceId,
        teamMemberId: r.teamMemberId,
        travelingStatus: r.travelingStatus,
        acknowledgedItineraryVersion: r.acknowledgedItineraryVersion,
        memberName: r.teamMember.user.name,
        memberRole: r.teamMember.role,
        onboardingState: r.teamMember.onboardingState,
      })),
    });
  },

  acknowledgeItinerary: async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId;
    const eid = Array.isArray(eventId) ? eventId[0] : eventId;
    if (!eid || !req.member) {
      res.status(400).json({ error: 'eventId required' });
      return;
    }
    if (req.eventRow?.type !== 'trip') {
      res.status(400).json({ error: 'Not a trip event' });
      return;
    }
    const parsed = acknowledgeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    const result = await acknowledgeTripItinerary(eid, req.member.id, parsed.data.expectedVersion);
    if (result.kind === 'ok') {
      res.status(200).end();
      return;
    }
    if (result.kind === 'conflict') {
      res.status(409).json({
        currentVersion: result.currentVersion,
        current: result.current,
      });
      return;
    }
    if (result.kind === 'not_traveling') {
      res.status(400).json({ error: 'Not a traveling squad member' });
      return;
    }
    res.status(404).json({ error: 'Not found' });
  },

  publish: async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId;
    const eid = Array.isArray(eventId) ? eventId[0] : eventId;
    if (!eid || !req.eventRow) {
      res.status(400).json({ error: 'eventId required' });
      return;
    }
    if (req.eventRow.type !== 'trip') {
      res.status(400).json({ error: 'Not a trip event' });
      return;
    }
    try {
      const out = await publishTrip(eid);
      res.status(200).json({
        tripWorkspaceId: out.tripWorkspaceId,
        published: true,
      });
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'TRIP_NOT_FOUND' || code === 'NOT_TRIP') {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      if (code === 'PUBLISH_VALIDATION') {
        res.status(400).json({
          error: 'Departure time and departure meeting point are required before publishing',
        });
        return;
      }
      throw e;
    }
  },

  postpone: async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId;
    const eid = Array.isArray(eventId) ? eventId[0] : eventId;
    if (!eid || !req.eventRow) {
      res.status(400).json({ error: 'eventId required' });
      return;
    }
    const parsed = postponeBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    const out = await postponeTripEvent(eid, parsed.data.newDate, parsed.data.newTime);
    if (out.kind === 'ok') {
      res.status(200).json({ postponed: true, tripWorkspaceId: out.tripWorkspaceId });
      return;
    }
    if (out.kind === 'ALREADY_TERMINAL') {
      res.status(409).json({ error: 'Event is already postponed or cancelled' });
      return;
    }
    if (out.kind === 'NOT_TRIP') {
      res.status(400).json({ error: 'Only trip events can be postponed with this action' });
      return;
    }
    res.status(404).json({ error: 'Not found' });
  },
};
