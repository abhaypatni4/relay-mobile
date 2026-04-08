import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { ApiEventListItem } from '@/hooks/useTeamEvents';

/**
 * Resolves eventId for a trip workspace when not passed in navigation (e.g. deep link).
 */
export function useTripEventId(teamId: string | null, tripId: string, initialEventId: string | undefined) {
  const q = useQuery({
    queryKey: ['tripEventId', teamId, tripId],
    queryFn: async (): Promise<string | null> => {
      if (!teamId) {
        return null;
      }
      const { data } = await api.get<{ events: ApiEventListItem[] }>(`/teams/${teamId}/events`);
      const trips = data.events.filter((e) => e.type === 'trip');
      const results = await Promise.all(
        trips.map(async (e) => {
          try {
            const d = await api.get<ApiEventListItem & { tripWorkspace?: { id: string } }>(
              `/teams/${teamId}/events/${e.id}`,
            );
            return d.data.tripWorkspace?.id === tripId ? e.id : null;
          } catch {
            return null;
          }
        }),
      );
      return results.find((id) => id !== null) ?? null;
    },
    enabled: Boolean(teamId && tripId) && !initialEventId,
  });

  return {
    eventId: initialEventId ?? q.data ?? null,
    isResolving: !initialEventId && q.isLoading,
  };
}
