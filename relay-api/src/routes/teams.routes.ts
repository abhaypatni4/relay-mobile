import { Router } from 'express';
import type { Env } from '../config/env';
import { invitationsController } from '../controllers/invitations.controller';
import { teamsController } from '../controllers/teams.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { requireTeamMember } from '../middleware/requireTeamMember';

export function createTeamsRouter(env: Env): Router {
  const r = Router();
  const auth = authenticateMiddleware(env);

  r.post('/', auth, teamsController.create);

  const byTeam = Router({ mergeParams: true });
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
