import type { OnboardingState, Role } from '@prisma/client';
import { prisma } from '../db/prisma';
import { enqueueEmergencyInfoReminder } from '../jobs';

export async function getCurrentUserProfile(userId: string): Promise<{
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyAllergyAlert: string | null;
    emergencyStaffNote: string | null;
    emergencyInfoUpdatedAt: Date | null;
  };
  memberships: {
    teamId: string;
    teamMemberId: string;
    role: Role;
    onboardingState: OnboardingState;
    teamName: string;
    sport: string | null;
  }[];
}> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      emergencyAllergyAlert: true,
      emergencyStaffNote: true,
      emergencyInfoUpdatedAt: true,
    },
  });

  const members = await prisma.teamMember.findMany({
    where: { userId, removedAt: null },
    include: { team: { select: { name: true, sport: true } } },
  });

  return {
    user,
    memberships: members.map((m) => ({
      teamId: m.teamId,
      teamMemberId: m.id,
      role: m.role,
      onboardingState: m.onboardingState,
      teamName: m.team.name,
      sport: m.team.sport,
    })),
  };
}

export async function patchCurrentUser(
  userId: string,
  input: {
    name?: string;
    role?: Role;
    customRoleLabel?: string | null;
    jerseyNumber?: string | null;
    teamId?: string;
  },
): Promise<void> {
  const memberships = await prisma.teamMember.findMany({
    where: { userId, removedAt: null },
  });

  const needsMemberUpdate =
    input.role !== undefined ||
    input.customRoleLabel !== undefined ||
    input.jerseyNumber !== undefined;

  let target = input.teamId ? memberships.find((m) => m.teamId === input.teamId) : undefined;
  if (input.teamId && !target) {
    throw new Error('TEAM_NOT_FOUND');
  }
  if (!input.teamId && memberships.length === 1) {
    target = memberships[0];
  }
  if (needsMemberUpdate && !target) {
    throw new Error('TEAM_ID_REQUIRED');
  }

  await prisma.$transaction(async (tx) => {
    if (input.name !== undefined) {
      await tx.user.update({
        where: { id: userId },
        data: { name: input.name.trim() },
      });
      await tx.teamMember.updateMany({
        where: { userId, onboardingState: 'invited' },
        data: { onboardingState: 'profileIncomplete' },
      });
    }

    if (target && needsMemberUpdate) {
      await tx.teamMember.update({
        where: { id: target.id },
        data: {
          ...(input.role !== undefined ? { role: input.role } : {}),
          ...(input.customRoleLabel !== undefined
            ? { customRoleLabel: input.customRoleLabel?.trim() ?? null }
            : {}),
          ...(input.jerseyNumber !== undefined
            ? { jerseyNumber: input.jerseyNumber?.trim() ?? null }
            : {}),
        },
      });
    }
  });
}

export type EmergencyFieldErrors = Partial<
  Record<'contactName' | 'contactPhone' | 'allergyAlert' | 'staffNote', string[]>
>;

export function validateEmergencyPayload(input: {
  contactName?: unknown;
  contactPhone?: unknown;
  allergyAlert?: unknown;
  staffNote?: unknown;
}): { ok: true; data: { contactName: string; contactPhone: string; allergyAlert: string; staffNote: string | null } } | { ok: false; fields: EmergencyFieldErrors } {
  const fields: EmergencyFieldErrors = {};
  if (typeof input.contactName !== 'string' || !input.contactName.trim()) {
    fields.contactName = ['Required'];
  }
  if (typeof input.contactPhone !== 'string' || !input.contactPhone.trim()) {
    fields.contactPhone = ['Required'];
  }
  if (typeof input.allergyAlert !== 'string' || !input.allergyAlert.trim()) {
    fields.allergyAlert = ['Required'];
  }
  const staffNote =
    typeof input.staffNote === 'string' && input.staffNote.trim() ? input.staffNote.trim() : null;
  if (Object.keys(fields).length > 0) {
    return { ok: false, fields };
  }
  return {
    ok: true,
    data: {
      contactName: (input.contactName as string).trim(),
      contactPhone: (input.contactPhone as string).trim(),
      allergyAlert: (input.allergyAlert as string).trim(),
      staffNote,
    },
  };
}

export async function patchEmergencyInfo(
  userId: string,
  data: { contactName: string; contactPhone: string; allergyAlert: string; staffNote: string | null },
): Promise<void> {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        emergencyContactName: data.contactName,
        emergencyContactPhone: data.contactPhone,
        emergencyAllergyAlert: data.allergyAlert,
        emergencyStaffNote: data.staffNote,
        emergencyInfoUpdatedAt: now,
      },
    });
    await tx.teamMember.updateMany({
      where: {
        userId,
        removedAt: null,
        onboardingState: { in: ['invited', 'profileIncomplete'] },
      },
      data: { onboardingState: 'active', joinedAt: now },
    });
  });
}

export async function deferEmergencyInfoReminder(userId: string): Promise<void> {
  await enqueueEmergencyInfoReminder(userId);
}
