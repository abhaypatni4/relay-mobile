import bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import type { Env } from '../config/env';
import { prisma } from '../db/prisma';
import { signAccessToken } from '../utils/jwt';
import { generateRefreshTokenRaw, hashToken } from '../utils/token-hash';

const BCRYPT_ROUNDS = 12;
const REFRESH_MS = 30 * 24 * 60 * 60 * 1000;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

async function issueTokensForUser(env: Env, user: User): Promise<AuthTokens> {
  const rawRefresh = generateRefreshTokenRaw();
  const tokenHash = hashToken(rawRefresh);
  const expiresAt = new Date(Date.now() + REFRESH_MS);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return {
    accessToken: signAccessToken(env, { userId: user.id, email: user.email }),
    refreshToken: rawRefresh,
    expiresInSeconds: 15 * 60,
  };
}

export async function registerUser(
  env: Env,
  input: { name: string; email?: string; phone?: string; password: string },
): Promise<{ user: User; tokens: AuthTokens }> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const emailRaw = input.email?.toLowerCase().trim();
  const phoneRaw = input.phone?.trim();
  const email = emailRaw && emailRaw.length > 0 ? emailRaw : null;
  const phone = phoneRaw && phoneRaw.length > 0 ? phoneRaw : null;
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      phone,
      passwordHash,
    },
  });
  const tokens = await issueTokensForUser(env, user);
  return { user, tokens };
}

export async function loginUser(
  env: Env,
  input: { email?: string; phone?: string; password: string },
): Promise<{ user: User; tokens: AuthTokens }> {
  const email = input.email?.toLowerCase().trim();
  const phone = input.phone?.trim();
  const user = await prisma.user.findFirst({
    where: {
      OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
    },
  });
  if (!user?.passwordHash) {
    throw new Error('Invalid credentials');
  }
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new Error('Invalid credentials');
  }
  const tokens = await issueTokensForUser(env, user);
  return { user, tokens };
}

export async function refreshAccessToken(
  env: Env,
  rawRefreshToken: string,
): Promise<{ accessToken: string; expiresInSeconds: number }> {
  const tokenHash = hashToken(rawRefreshToken);
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new Error('Invalid refresh token');
  }
  return {
    accessToken: signAccessToken(env, {
      userId: record.user.id,
      email: record.user.email,
    }),
    expiresInSeconds: 15 * 60,
  };
}

export async function logoutWithRefreshToken(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
