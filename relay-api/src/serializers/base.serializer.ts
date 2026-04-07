import type { Role } from '@prisma/client';

export type JsonObject = Record<string, unknown>;

export function isPlayerViewer(role: Role): boolean {
  return role === 'player';
}
