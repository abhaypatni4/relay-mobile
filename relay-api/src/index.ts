import * as Sentry from '@sentry/node';
import { createApp } from './app';
import { getEnv } from './config/env';

const env = getEnv();

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0,
    integrations: [Sentry.expressIntegration()],
  });
}

const app = createApp(env);

const server = app.listen(env.PORT, () => {
  console.log(`relay-api listening on port ${String(env.PORT)}`);
});

const shutdown = (): void => {
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
