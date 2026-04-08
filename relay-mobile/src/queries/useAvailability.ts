import { useIsFocused } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useTeamStore } from '@/store/teamStore';
import type { AvailabilityStatus, OperationalStatus, PlayerSelectionOutcome, Role } from '@/types/models';

export type { PlayerSelectionOutcome };

export interface AvailabilityWindowDto {
  id: string;
  eventId: string;
  openedAt: string;
  lockedAt: string | null;
  isLocked: boolean;
  selectionNotificationsSentAt: string | null;
}

export interface AvailabilitySubmissionDto {
  id: string;
  teamMemberId: string;
  memberName: string;
  memberRole?: Role;
  availabilityStatus: AvailabilityStatus | null;
  note: string | null;
  submittedAt: string | null;
  updatedAt: string;
  selectionNotificationSentAt: string | null;
  operationalStatus?: OperationalStatus;
  operationalStatusSetBy?: string | null;
  selectionOutcome?: PlayerSelectionOutcome;
}

export interface AvailabilityResponse {
  window: AvailabilityWindowDto | null;
  submissions: AvailabilitySubmissionDto[];
}

export function useAvailability(
  eventId: string | null,
  options?: { pollEvery30sWhileFocused?: boolean },
): ReturnType<typeof useQuery<AvailabilityResponse>> {
  const teamId = useTeamStore((s) => s.activeTeamId);
  const focused = useIsFocused();
  const poll = Boolean(options?.pollEvery30sWhileFocused && focused);
  return useQuery({
    queryKey: ['eventAvailability', teamId, eventId],
    queryFn: async () => {
      const { data } = await api.get<AvailabilityResponse>(`/events/${eventId}/availability`);
      return data;
    },
    enabled: Boolean(teamId && eventId),
    refetchInterval: poll ? 30_000 : false,
    refetchIntervalInBackground: false,
  });
}
