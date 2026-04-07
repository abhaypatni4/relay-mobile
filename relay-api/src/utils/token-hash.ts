import { createHash, randomBytes } from 'node:crypto';

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function generateRefreshTokenRaw(): string {
  return randomBytes(48).toString('base64url');
}
