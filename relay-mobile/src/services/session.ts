import type { OnboardingState, Role } from '@/types/models';
import { api } from './api';
import { useTeamStore } from '@/store/teamStore';

export interface MeMembership {
  teamId: string;
  teamMemberId: string;
  role: Role;
  onboardingState: OnboardingState;
  teamName: string;
  sport: string | null;
}

export interface MeResponse {
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyAllergyAlert: string | null;
    emergencyStaffNote: string | null;
    emergencyInfoUpdatedAt: string | null;
  };
  memberships: MeMembership[];
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>('/users/me');
  return data;
}

/** Applies first membership to team store (MVP single-team). Returns suggested app entry state. */
export function applyMembershipsToTeamStore(memberships: MeMembership[]): {
  initialAppRoute: 'CreateTeam' | 'EmergencyInfoPrompt' | 'MainTabs';
} {
  if (memberships.length === 0) {
    useTeamStore.getState().clearTeamContext();
    return { initialAppRoute: 'CreateTeam' };
  }
  const m = memberships[0];
  if (!m) {
    useTeamStore.getState().clearTeamContext();
    return { initialAppRoute: 'CreateTeam' };
  }
  useTeamStore.getState().setTeamContext({
    activeTeamId: m.teamId,
    activeTeamMemberId: m.teamMemberId,
    role: m.role,
    onboardingState: m.onboardingState,
    teamName: m.teamName,
    sport: m.sport,
  });
  const needsEmergency =
    m.onboardingState !== 'active' && m.role !== 'coordinator';
  if (needsEmergency) {
    return { initialAppRoute: 'EmergencyInfoPrompt' };
  }
  return { initialAppRoute: 'MainTabs' };
}

export async function bootstrapSessionAfterAuth(): Promise<{
  initialAppRoute: 'CreateTeam' | 'EmergencyInfoPrompt' | 'MainTabs';
}> {
  const me = await fetchMe();
  return applyMembershipsToTeamStore(me.memberships);
}
