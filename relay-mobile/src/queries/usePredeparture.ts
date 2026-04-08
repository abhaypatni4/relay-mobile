import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export type PredepartureFixedItem = {
  key: 'squadConfirmed' | 'documentsCollected' | 'itineraryAcknowledged' | 'emergencyInfoOnFile';
  label: string;
  currentCount: number;
  totalCount: number;
  isComplete: boolean;
};

export type PredepartureCustomItem = {
  id: string;
  label: string;
  isComplete: boolean;
};

export type PredepartureResponse = {
  fixedItems: PredepartureFixedItem[];
  customItems: PredepartureCustomItem[];
};

export function usePredeparture(eventId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['predeparture', eventId],
    queryFn: async () => {
      const { data } = await api.get<PredepartureResponse>(`/events/${eventId}/trip/predeparture`);
      return data;
    },
    enabled: Boolean(eventId && enabled),
    refetchInterval: enabled ? 30_000 : false,
  });
}

