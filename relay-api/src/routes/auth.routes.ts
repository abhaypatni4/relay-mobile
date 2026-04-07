import { Router } from 'express';
import type { Env } from '../config/env';
import { createAuthController } from '../controllers/auth.controller';

export function createAuthRouter(env: Env): Router {
  const r = Router();
  const c = createAuthController(env);
  r.post('/register', c.register);
  r.post('/login', c.login);
  r.post('/refresh', c.refresh);
  r.post('/logout', c.logout);
  return r;
}
