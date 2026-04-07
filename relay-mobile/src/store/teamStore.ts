import { create } from 'zustand';
import type { OnboardingState, Role } from '@/types/models';

interface TeamState {
  activeTeamId: string | null;
  activeTeamMemberId: string | null;
  role: Role | null;
  onboardingState: OnboardingState | null;
  setTeamContext: (input: {
    activeTeamId: string;
    activeTeamMemberId: string;
    role: Role;
    onboardingState: OnboardingState;
  }) => void;
  clearTeamContext: () => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  activeTeamId: null,
  activeTeamMemberId: null,
  role: null,
  onboardingState: null,
  setTeamContext: (input) => set({ ...input }),
  clearTeamContext: () =>
    set({
      activeTeamId: null,
      activeTeamMemberId: null,
      role: null,
      onboardingState: null,
    }),
}));
