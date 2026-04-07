import { create } from 'zustand';
import type { OnboardingState, Role } from '@/types/models';

interface TeamState {
  activeTeamId: string | null;
  activeTeamMemberId: string | null;
  role: Role | null;
  onboardingState: OnboardingState | null;
  teamName: string | null;
  sport: string | null;
  setTeamContext: (input: {
    activeTeamId: string;
    activeTeamMemberId: string;
    role: Role;
    onboardingState: OnboardingState;
    teamName?: string | null;
    sport?: string | null;
  }) => void;
  clearTeamContext: () => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  activeTeamId: null,
  activeTeamMemberId: null,
  role: null,
  onboardingState: null,
  teamName: null,
  sport: null,
  setTeamContext: (input) =>
    set({
      activeTeamId: input.activeTeamId,
      activeTeamMemberId: input.activeTeamMemberId,
      role: input.role,
      onboardingState: input.onboardingState,
      teamName: input.teamName ?? null,
      sport: input.sport ?? null,
    }),
  clearTeamContext: () =>
    set({
      activeTeamId: null,
      activeTeamMemberId: null,
      role: null,
      onboardingState: null,
      teamName: null,
      sport: null,
    }),
}));
