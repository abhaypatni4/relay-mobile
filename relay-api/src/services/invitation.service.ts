import { randomBytes } from 'node:crypto';
import type { Role } from '@prisma/client';
import { prisma } from '../db/prisma';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function createInvitationForTeam(teamId: string): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  const token = generateToken();

  await prisma.invitationLink.updateMany({
    where: { teamId, isRevoked: false },
    data: { isRevoked: true },
  });

  await prisma.invitationLink.create({
    data: {
      teamId,
      token,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export type ValidateInviteResult =
  | { ok: true; teamName: string; sport: string | null }
  | { ok: false; reason: 'not_found' | 'expired' };

export async function validateInvitationToken(rawToken: string): Promise<ValidateInviteResult> {
  const link = await prisma.invitationLink.findUnique({
    where: { token: rawToken },
    include: { team: true },
  });
  if (!link || link.isRevoked) {
    return { ok: false, reason: 'not_found' };
  }
  if (link.expiresAt < new Date()) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, teamName: link.team.name, sport: link.team.sport };
}

export async function acceptInvitation(
  userId: string,
  rawToken: string,
  role: Role = 'player',
): Promise<{ teamId: string; teamMemberId: string; teamName: string }> {
  const link = await prisma.invitationLink.findUnique({
    where: { token: rawToken },
    include: { team: true },
  });
  if (!link || link.isRevoked) {
    throw new Error('INVITE_NOT_FOUND');
  }
  if (link.expiresAt < new Date()) {
    throw new Error('INVITE_EXPIRED');
  }

  const existing = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: link.teamId } },
  });
  if (existing && !existing.removedAt) {
    throw new Error('ALREADY_MEMBER');
  }

  const member = await prisma.teamMember.create({
    data: {
      userId,
      teamId: link.teamId,
      role,
      onboardingState: 'invited',
    },
  });

  return {
    teamId: link.teamId,
    teamMemberId: member.id,
    teamName: link.team.name,
  };
}
