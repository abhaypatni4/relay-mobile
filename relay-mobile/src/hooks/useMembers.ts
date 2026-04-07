import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { OnboardingState, Role } from '@/types/models';

/** Coordinator roster row from GET /teams/:id/members */
export interface CoordinatorRosterMember {
  id: string;
  userId: string;
  teamId: string;
  role: Role;
  onboardingState: OnboardingState;
  jerseyNumber: string | null;
  customRoleLabel: string | null;
  invitedAt: string;
  joinedAt: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  emergencyInfo?: {
    contactName: string | null;
    contactPhone: string | null;
    allergyAlert: string | null;
    staffNote: string | null;
    updatedAt: string | null;
    isStale: boolean;
  };
}

export interface BasicRosterMember {
  id: string;
  name: string;
  role: Role;
  customRoleLabel?: string;
}

export type RosterMemberRow = CoordinatorRosterMember | BasicRosterMember;

export function useMembers(teamId: string | null) {
  return useQuery({
    queryKey: ['members', teamId],
    queryFn: async () => {
      const { data } = await api.get<{ members: RosterMemberRow[] }>(`/teams/${teamId}/members`);
      return data.members;
    },
    enabled: Boolean(teamId),
  });
}
