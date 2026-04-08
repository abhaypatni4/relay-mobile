import { Router } from 'express';
import type { Env } from '../config/env';
import { availabilityController } from '../controllers/availability.controller';
import { tripsController } from '../controllers/trips.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireEventTeamMember } from '../middleware/requireEventTeamMember';
import { requireRole } from '../middleware/requireRole';

export function createEventTripsRouter(env: Env): Router {
  const r = Router();
  const auth = authenticateMiddleware(env);
  const member = [auth, requireEventTeamMember];

  r.post(
    '/:eventId/availability/open',
    ...member,
    requireRole(['coordinator', 'coach']),
    availabilityController.open,
  );
  r.get('/:eventId/availability', ...member, availabilityController.get);
  r.post(
    '/:eventId/availability/submit',
    ...member,
    requireRole(['player']),
    availabilityController.submit,
  );
  r.patch(
    '/:eventId/availability/:submissionId/operational',
    ...member,
    requireRole(['coordinator', 'coach', 'staff']),
    availabilityController.patchOperational,
  );
  r.post(
    '/:eventId/availability/lock',
    ...member,
    requireRole(['coordinator', 'coach']),
    availabilityController.lock,
  );
  r.post(
    '/:eventId/availability/notify',
    ...member,
    requireRole(['coordinator', 'coach']),
    availabilityController.notify,
  );

  r.post('/:eventId/cancel', ...member, requireRole(['coordinator']), tripsController.cancelTrip);
  r.get('/:eventId/trip', ...member, tripsController.getTrip);
  r.patch('/:eventId/trip/itinerary', ...member, requireRole(['coordinator']), tripsController.patchItinerary);
  r.post(
    '/:eventId/trip/itinerary/acknowledge',
    ...member,
    requireRole(['player']),
    tripsController.acknowledgeItinerary,
  );
  r.get('/:eventId/trip/squad', ...member, tripsController.getSquad);
  r.patch('/:eventId/trip/squad', ...member, requireRole(['coordinator']), tripsController.patchSquad);
  r.post('/:eventId/trip/publish', ...member, requireRole(['coordinator']), tripsController.publish);

  return r;
}
