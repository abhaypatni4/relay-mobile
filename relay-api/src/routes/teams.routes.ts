import { Router } from 'express';
import type { Env } from '../config/env';
import { invitationsController } from '../controllers/invitations.controller';
import { teamEventsController } from '../controllers/team-events.controller';
import { teamsController } from '../controllers/teams.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { requireTeamMember } from '../middleware/requireTeamMember';

export function createTeamsRouter(env: Env): Router {
  const r = Router();
  const auth = authenticateMiddleware(env);

  r.post('/', auth, teamsController.create);

  const byTeam = Router({ mergeParams: true });
  const teamEvents = Router({ mergeParams: true });
  teamEvents.post('/', auth, requireTeamMember, requireRole(['coordinator']), teamEventsController.create);
  teamEvents.get('/', auth, requireTeamMember, teamEventsController.list);
  teamEvents.get('/:eventId', auth, requireTeamMember, teamEventsController.getById);
  teamEvents.patch('/:eventId', auth, requireTeamMember, requireRole(['coordinator']), teamEventsController.patch);
  byTeam.use('/events', teamEvents);

  byTeam.get('/', auth, requireTeamMember, teamsController.getById);
  byTeam.get('/members', auth, requireTeamMember, teamsController.listMembers);
  byTeam.patch('/', auth, requireTeamMember, requireRole(['coordinator']), teamsController.patch);
  byTeam.post(
    '/invitations',
    auth,
    requireTeamMember,
    requireRole(['coordinator']),
    invitationsController.createForTeam,
  );

  r.use('/:teamId', byTeam);
  return r;
}
