import * as Sentry from '@sentry/node';
import express from 'express';
import type { Env } from './config/env';
import { registerRoutes } from './routes';

export function createApp(env: Env): express.Application {
  const app = express();

  app.use(express.json());

  registerRoutes(app);

  if (env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  return app;
}
