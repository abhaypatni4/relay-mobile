import * as Sentry from '@sentry/node';
import { createApp } from './app';
import { getEnv } from './config/env';
import { initFirebaseIfConfigured } from './services/notification.service';
import { enqueueTestJob, startJobInfrastructure, stopJobInfrastructure } from './jobs';

const env = getEnv();

initFirebaseIfConfigured(env);

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0,
    integrations: [Sentry.expressIntegration()],
  });
}

startJobInfrastructure(env);

const app = createApp(env);

const server = app.listen(env.PORT, () => {
  console.log(`relay-api listening on port ${String(env.PORT)}`);
  void enqueueTestJob().catch((err: unknown) => {
    console.error('Test job enqueue failed', err);
  });
});

const shutdown = (): void => {
  stopJobInfrastructure();
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
