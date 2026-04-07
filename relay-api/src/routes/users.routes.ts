import { Router } from 'express';
import type { Env } from '../config/env';
import { usersController } from '../controllers/users.controller';
import { authenticateMiddleware } from '../middleware/authenticate';

export function createUsersRouter(env: Env): Router {
  const r = Router();
  const auth = authenticateMiddleware(env);
  r.patch('/me/push-token', auth, usersController.patchPushToken);
  return r;
}
