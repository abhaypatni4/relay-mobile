import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().trim().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().trim().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  REDIS_URL: z.string().trim().min(1, 'REDIS_URL is required'),
  SENTRY_DSN: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v))
    .pipe(z.url().optional()),
  /** Firebase Admin — optional; push sends are no-ops when unset. */
  FIREBASE_PROJECT_ID: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v)),
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v)),
  FIREBASE_PRIVATE_KEY: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v)),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (cached) {
    return cached;
  }
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${message}`);
  }
  cached = parsed.data;
  return cached;
}

export function isFirebaseConfigured(env: Env): boolean {
  return Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
}
