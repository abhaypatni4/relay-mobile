import { Router } from 'express';
import type { Env } from '../config/env';
import { invitationsController } from '../controllers/invitations.controller';
import { postsController } from '../controllers/posts.controller';
import { teamEventsController } from '../controllers/team-events.controller';
import { teamsController } from '../controllers/teams.controller';
import { transfersController } from '../controllers/transfers.controller';
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

  const posts = Router({ mergeParams: true });
  posts.post('/', auth, requireTeamMember, requireRole(['coordinator', 'coach']), postsController.create);
  posts.get('/', auth, requireTeamMember, postsController.list);
  posts.get('/:postId', auth, requireTeamMember, postsController.getById);
  posts.post('/:postId/acknowledge', auth, requireTeamMember, postsController.acknowledge);
  posts.post('/:postId/nudge', auth, requireTeamMember, requireRole(['coordinator', 'coach']), postsController.nudge);
  posts.delete('/:postId', auth, requireTeamMember, postsController.delete);
  byTeam.use('/posts', posts);

  const transfers = Router({ mergeParams: true });
  transfers.get('/', auth, requireTeamMember, transfersController.listPending);
  transfers.post('/', auth, requireTeamMember, requireRole(['coordinator']), transfersController.create);
  transfers.get('/:transferId', auth, requireTeamMember, transfersController.getById);
  transfers.patch('/:transferId', auth, requireTeamMember, transfersController.respond);
  byTeam.use('/transfers', transfers);

  r.use('/:teamId', byTeam);
  return r;
}
