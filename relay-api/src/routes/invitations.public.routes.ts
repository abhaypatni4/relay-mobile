import { Router } from 'express';
import type { Env } from '../config/env';
import { invitationsController } from '../controllers/invitations.controller';
import { authenticateMiddleware } from '../middleware/authenticate';

export function createInvitationsPublicRouter(env: Env): Router {
  const r = Router();
  const auth = authenticateMiddleware(env);
  r.post('/:token/accept', auth, invitationsController.accept);
  r.get('/:token', invitationsController.validatePublic);
  return r;
}
