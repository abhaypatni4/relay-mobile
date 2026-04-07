import { Router } from 'express';
import type { Env } from '../config/env';
import { demoController } from '../controllers/demo.controller';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireTeamMember } from '../middleware/requireTeamMember';

export function createDemoRouter(env: Env): Router {
  const r = Router();
  const auth = authenticateMiddleware(env);
  r.get('/teams/:teamId/demo/member', auth, requireTeamMember, demoController.sampleMember);
  r.get(
    '/teams/:teamId/demo/availability',
    auth,
    requireTeamMember,
    demoController.sampleAvailability,
  );
  return r;
}
