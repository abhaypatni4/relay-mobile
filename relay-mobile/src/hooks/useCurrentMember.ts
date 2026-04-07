import { useAuthStore } from '@/store/authStore';
import { useTeamStore } from '@/store/teamStore';
import type { OnboardingState, Role } from '@/types/models';

export interface CurrentMember {
  userId: string | null;
  teamMemberId: string | null;
  role: Role | null;
  teamId: string | null;
  onboardingState: OnboardingState | null;
}

export function useCurrentMember(): CurrentMember {
  const userId = useAuthStore((s) => s.userId);
  const activeTeamId = useTeamStore((s) => s.activeTeamId);
  const activeTeamMemberId = useTeamStore((s) => s.activeTeamMemberId);
  const role = useTeamStore((s) => s.role);
  const onboardingState = useTeamStore((s) => s.onboardingState);

  return {
    userId,
    teamMemberId: activeTeamMemberId,
    role,
    teamId: activeTeamId,
    onboardingState,
  };
}
