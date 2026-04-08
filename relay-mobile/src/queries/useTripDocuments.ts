import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export type PlayerTripDocumentItem = {
  id: string;
  name: string;
  isConfirmedByCurrentUser: boolean;
  confirmedAt: string | null;
};

export type CoordinatorTripDocumentConfirmationRow = {
  teamMemberId: string;
  memberName: string;
  confirmedAt: string;
  onboardingState: string;
};

export type CoordinatorTripDocumentItem = {
  id: string;
  name: string;
  applicability: 'allPlayers' | 'travelingSquad' | 'specific';
  specificMemberIds: string[];
  confirmedCount: number;
  totalApplicable: number;
  confirmations: CoordinatorTripDocumentConfirmationRow[];
};

export type TripDocumentsResponse = {
  items: Array<PlayerTripDocumentItem | CoordinatorTripDocumentItem>;
};

export type TripDocumentsPlayerResponse = { items: PlayerTripDocumentItem[] };
export type TripDocumentsAggregateResponse = { items: CoordinatorTripDocumentItem[] };
export type TripDocumentsUnionResponse = TripDocumentsPlayerResponse | TripDocumentsAggregateResponse;

export function isAggregateDocumentsResponse(
  r: TripDocumentsUnionResponse | undefined,
): r is TripDocumentsAggregateResponse {
  const first = r?.items?.[0] as unknown;
  if (!first || typeof first !== 'object') {
    return false;
  }
  const o = first as { totalApplicable?: unknown; confirmedCount?: unknown };
  return typeof o.totalApplicable === 'number' && typeof o.confirmedCount === 'number';
}

export function useTripDocuments(eventId: string | null) {
  return useQuery({
    queryKey: ['tripDocuments', eventId],
    queryFn: async () => {
      const { data } = await api.get<TripDocumentsUnionResponse>(`/events/${eventId}/trip/documents`);
      return data;
    },
    enabled: Boolean(eventId),
  });
}

