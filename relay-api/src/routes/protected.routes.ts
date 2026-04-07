import { Router } from 'express';
import type { Env } from '../config/env';
import { authenticateMiddleware } from '../middleware/authenticate';
import { requireTeamMember } from '../middleware/requireTeamMember';
import { requireRole } from '../middleware/requireRole';

export function createProtectedDemoRouter(env: Env): Router {
  const r = Router();
  const auth = authenticateMiddleware(env);
  r.get(
    '/teams/:teamId/protected/ping',
    auth,
    requireTeamMember,
    requireRole(['coordinator']),
    (_req, res) => {
      res.json({ ok: true });
    },
  );
  return r;
}
