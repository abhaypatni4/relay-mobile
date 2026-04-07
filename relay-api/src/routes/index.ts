import type { Express } from 'express';
import type { Env } from '../config/env';
import { createAuthRouter } from './auth.routes';
import { createDemoRouter } from './demo.routes';
import { createInvitationsPublicRouter } from './invitations.public.routes';
import { createProtectedDemoRouter } from './protected.routes';
import { createTeamsRouter } from './teams.routes';
import { createUsersRouter } from './users.routes';
import { healthRouter } from './health.routes';

export function registerRoutes(app: Express, env: Env): void {
  app.use('/health', healthRouter);
  app.use('/auth', createAuthRouter(env));
  app.use('/invitations', createInvitationsPublicRouter(env));
  app.use('/teams', createTeamsRouter(env));
  app.use('/users', createUsersRouter(env));
  app.use(createDemoRouter(env));
  app.use(createProtectedDemoRouter(env));
}
