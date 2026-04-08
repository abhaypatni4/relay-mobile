import { Router } from 'express';
import type { Env } from '../config/env';
import { tripsController } from '../controllers/trips.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireEventTeamMember } from '../middleware/requireEventTeamMember';
import { requireRole } from '../middleware/requireRole';

export function createEventTripsRouter(env: Env): Router {
  const r = Router();
  const auth = authenticateMiddleware(env);
  const member = [auth, requireEventTeamMember];

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
