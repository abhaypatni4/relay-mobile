import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useTeamStore } from '@/store/teamStore';

export type EmergencyInfoResponse = {
  contactName: string | null;
  contactPhone: string | null;
  allergyAlert: string | null;
  staffNote: string | null;
  updatedAt: string | null;
  isStale: boolean;
};

export function useEmergencyInfo(params: {
  eventId: string | null;
  tripWorkspaceId: string | null;
  memberId: string | null;
}) {
  const role = useTeamStore((s) => s.role);
  const canView = role === 'coordinator' || role === 'coach' || role === 'staff';

  const { eventId, tripWorkspaceId, memberId } = params;

  return useQuery({
    queryKey: ['emergencyInfo', tripWorkspaceId, memberId],
    queryFn: async () => {
      if (!eventId || !memberId) {
        throw new Error('eventId and memberId required');
      }
      const { data } = await api.get<EmergencyInfoResponse>(
        `/events/${eventId}/trip/squad/${memberId}/emergency`,
      );
      return data;
    },
    enabled: Boolean(canView && eventId && tripWorkspaceId && memberId),
    staleTime: 5 * 60 * 1000,
  });
}

