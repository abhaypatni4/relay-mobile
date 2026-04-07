import jwt from 'jsonwebtoken';
import type { Env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
  email: string | null;
  typ: 'access';
}

export function signAccessToken(
  env: Env,
  payload: { userId: string; email: string | null },
): string {
  const body: AccessTokenPayload = {
    sub: payload.userId,
    email: payload.email,
    typ: 'access',
  };
  return jwt.sign(body, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

export function verifyAccessToken(env: Env, token: string): AccessTokenPayload {
  const decoded: unknown = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    !('typ' in decoded) ||
    decoded.typ !== 'access' ||
    !('sub' in decoded) ||
    typeof decoded.sub !== 'string'
  ) {
    throw new Error('Invalid access token');
  }
  const email = 'email' in decoded && (decoded.email === null || typeof decoded.email === 'string')
    ? decoded.email
    : null;
  return { sub: decoded.sub, email, typ: 'access' };
}
