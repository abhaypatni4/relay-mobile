import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useCallback, useMemo } from 'react';
import { api } from '@/services/api';
import type { TravelingStatus } from '@/types/models';

export interface TripWorkspaceAckRef {
  itineraryVersion: number;
  isPublished: boolean;
}

export interface SquadAssignmentAckRef {
  acknowledgedItineraryVersion: number | null;
  travelingStatus: TravelingStatus;
}

export function useTripAcknowledgment(
  eventId: string | null,
  tripWorkspace: TripWorkspaceAckRef | null | undefined,
  currentMemberAssignment: SquadAssignmentAckRef | null | undefined,
) {
  const queryClient = useQueryClient();
  const version = tripWorkspace?.itineraryVersion ?? 0;
  const published = tripWorkspace?.isPublished ?? false;
  const ack = currentMemberAssignment?.acknowledgedItineraryVersion ?? null;
  const isTraveling = currentMemberAssignment?.travelingStatus === 'traveling';

  const isAcknowledged = useMemo(
    () => published && isTraveling && ack !== null && ack === version && version > 0,
    [ack, isTraveling, published, version],
  );

  const needsAcknowledgment = useMemo(
    () => published && isTraveling && version > 0 && (ack === null || ack < version),
    [ack, isTraveling, published, version],
  );

  const needsReacknowledgment = useMemo(
    () => needsAcknowledgment && ack !== null,
    [ack, needsAcknowledgment],
  );

  const mutation = useMutation({
    mutationFn: async (expectedVersion: number) => {
      if (!eventId) {
        throw new Error('Missing eventId');
      }
      await api.post(`/events/${eventId}/trip/itinerary/acknowledge`, {
        expectedVersion,
      });
    },
    onSuccess: () => {
      if (!eventId) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['tripWorkspace', eventId] });
      void queryClient.invalidateQueries({ queryKey: ['tripSquad', eventId] });
    },
    onError: (err: unknown) => {
      if (!eventId) {
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        void queryClient.invalidateQueries({ queryKey: ['tripWorkspace', eventId] });
        void queryClient.invalidateQueries({ queryKey: ['tripSquad', eventId] });
      }
    },
  });

  const acknowledge = useCallback(async () => {
    if (!eventId || !tripWorkspace) {
      return;
    }
    await mutation.mutateAsync(tripWorkspace.itineraryVersion);
  }, [eventId, mutation, tripWorkspace]);

  return {
    needsAcknowledgment,
    isAcknowledged,
    needsReacknowledgment,
    acknowledge,
    isPending: mutation.isPending,
  };
}
