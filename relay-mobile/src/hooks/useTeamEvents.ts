import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { EventStatus, EventType } from '@/types/models';

export interface ApiEventListItem {
  id: string;
  teamId: string;
  type: EventType;
  name: string;
  date: string;
  startTime: string;
  location: string | null;
  status: EventStatus;
  cancelledAt: string | null;
  postponedAt: string | null;
  newDateAfterPostponement: string | null;
  newTimeAfterPostponement: string | null;
  createdBy: string;
  createdAt: string;
}

export function useTeamEvents(teamId: string | null) {
  return useQuery<ApiEventListItem[]>({
    queryKey: ['teamEvents', teamId],
    queryFn: async () => {
      if (!teamId) {
        return [];
      }
      const { data } = await api.get<{ events: ApiEventListItem[] }>(`/teams/${teamId}/events`);
      return data.events;
    },
    enabled: Boolean(teamId),
  });
}
