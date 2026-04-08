import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { OnboardingState, Role } from '@/types/models';

/** Coordinator roster row from GET /teams/:teamId/members (coach-serialized shape). */
export interface TeamRosterMemberRow {
  id: string;
  name: string;
  role: Role;
  onboardingState?: OnboardingState;
  customRoleLabel?: string | null;
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: async () => {
      const { data } = await api.get<{ members: TeamRosterMemberRow[] }>(`/teams/${teamId}/members`);
      return data.members;
    },
    enabled: Boolean(teamId),
  });
}
