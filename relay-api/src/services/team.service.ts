import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';

export async function createTeamForUser(
  userId: string,
  input: { name: string; sport?: string | null; homeLocation?: string | null },
): Promise<{ teamId: string; memberId: string }> {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        name: input.name.trim(),
        sport: input.sport?.trim() ?? null,
        homeLocation: input.homeLocation?.trim() ?? null,
      },
    });
    const member = await tx.teamMember.create({
      data: {
        userId,
        teamId: team.id,
        role: 'coordinator',
        onboardingState: 'active',
        joinedAt: new Date(),
      },
    });
    return { teamId: team.id, memberId: member.id };
  });
}

export async function getTeamById(teamId: string): Promise<Prisma.TeamGetPayload<object> | null> {
  return prisma.team.findUnique({ where: { id: teamId } });
}

export async function updateTeam(
  teamId: string,
  data: { name?: string; sport?: string | null; homeLocation?: string | null },
): Promise<void> {
  await prisma.team.update({
    where: { id: teamId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.sport !== undefined ? { sport: data.sport?.trim() ?? null } : {}),
      ...(data.homeLocation !== undefined
        ? { homeLocation: data.homeLocation?.trim() ?? null }
        : {}),
    },
  });
}

export interface MemberWithUserRow {
  id: string;
  userId: string;
  teamId: string;
  role: import('@prisma/client').Role;
  onboardingState: import('@prisma/client').OnboardingState;
  jerseyNumber: string | null;
  customRoleLabel: string | null;
  invitedAt: Date;
  joinedAt: Date | null;
  user: {
    name: string;
    email: string | null;
    phone: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyAllergyAlert: string | null;
    emergencyStaffNote: string | null;
    emergencyInfoUpdatedAt: Date | null;
  };
}

export async function listTeamMembersWithUsers(teamId: string): Promise<MemberWithUserRow[]> {
  const rows = await prisma.teamMember.findMany({
    where: { teamId, removedAt: null },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          emergencyAllergyAlert: true,
          emergencyStaffNote: true,
          emergencyInfoUpdatedAt: true,
        },
      },
    },
    orderBy: { invitedAt: 'asc' },
  });
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    teamId: r.teamId,
    role: r.role,
    onboardingState: r.onboardingState,
    jerseyNumber: r.jerseyNumber,
    customRoleLabel: r.customRoleLabel,
    invitedAt: r.invitedAt,
    joinedAt: r.joinedAt,
    user: r.user,
  }));
}

export function toTeamMemberWithUser(row: MemberWithUserRow): import('../serializers/member.serializer').TeamMemberWithUser {
  return {
    id: row.id,
    userId: row.userId,
    teamId: row.teamId,
    role: row.role,
    onboardingState: row.onboardingState,
    jerseyNumber: row.jerseyNumber,
    customRoleLabel: row.customRoleLabel,
    invitedAt: row.invitedAt,
    joinedAt: row.joinedAt,
    name: row.user.name,
    email: row.user.email,
    phone: row.user.phone,
    emergencyContactName: row.user.emergencyContactName,
    emergencyContactPhone: row.user.emergencyContactPhone,
    emergencyAllergyAlert: row.user.emergencyAllergyAlert,
    emergencyStaffNote: row.user.emergencyStaffNote,
    emergencyInfoUpdatedAt: row.user.emergencyInfoUpdatedAt,
  };
}

export function sortMembersForRoster<T extends { onboardingState: string; user: { name: string } }>(
  rows: T[],
): T[] {
  const pending = new Set(['invited', 'profileIncomplete']);
  return [...rows].sort((a, b) => {
    const ap = pending.has(a.onboardingState) ? 0 : 1;
    const bp = pending.has(b.onboardingState) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.user.name.localeCompare(b.user.name);
  });
}
