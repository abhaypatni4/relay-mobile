import type { OnboardingState, Role } from '@prisma/client';
import type { JsonObject } from './base.serializer';
import { isPlayerViewer } from './base.serializer';

export interface TeamMemberWithUser {
  id: string;
  userId: string;
  teamId: string;
  role: Role;
  onboardingState: OnboardingState;
  jerseyNumber: string | null;
  customRoleLabel: string | null;
  invitedAt: Date;
  joinedAt: Date | null;
  name: string;
  email: string | null;
  phone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyAllergyAlert: string | null;
  emergencyStaffNote: string | null;
  emergencyInfoUpdatedAt: Date | null;
}

/**
 * TeamMember + joined user display fields. Strips emergencyInfo entirely for Player viewers.
 */
export function serializeTeamMember(viewerRole: Role, row: TeamMemberWithUser): JsonObject {
  const base: JsonObject = {
    id: row.id,
    userId: row.userId,
    teamId: row.teamId,
    role: row.role,
    onboardingState: row.onboardingState,
    jerseyNumber: row.jerseyNumber,
    customRoleLabel: row.customRoleLabel,
    invitedAt: row.invitedAt.toISOString(),
    joinedAt: row.joinedAt?.toISOString() ?? null,
    name: row.name,
    email: row.email,
    phone: row.phone,
  };
  if (isPlayerViewer(viewerRole)) {
    return base;
  }
  const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const isStale =
    row.emergencyInfoUpdatedAt === null || row.emergencyInfoUpdatedAt < cutoff;
  base.emergencyInfo = {
    contactName: row.emergencyContactName,
    contactPhone: row.emergencyContactPhone,
    allergyAlert: row.emergencyAllergyAlert,
    staffNote: row.emergencyStaffNote,
    updatedAt: row.emergencyInfoUpdatedAt?.toISOString() ?? null,
    isStale,
  };
  return base;
}
