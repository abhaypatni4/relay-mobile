import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useUiStore } from '@/store/uiStore';
import type { TripDocumentsPlayerResponse } from '@/queries/useTripDocuments';

export function useConfirmDocument(eventId: string | null) {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!eventId) {
        throw new Error('eventId required');
      }
      if (useUiStore.getState().isOffline) {
        analytics.track('offline_write_attempted', { actionType: 'document_confirm' });
      }
      await api.post(`/events/${eventId}/trip/documents/${itemId}/confirm`);
      analytics.track('document_item_confirmed', { eventId, itemId });
      return { itemId };
    },
    onMutate: async (itemId: string) => {
      if (!eventId) {
        return;
      }
      await queryClient.cancelQueries({ queryKey: ['tripDocuments', eventId] });

      const prev = queryClient.getQueryData<TripDocumentsPlayerResponse>(['tripDocuments', eventId]);

      queryClient.setQueryData<TripDocumentsPlayerResponse>(['tripDocuments', eventId], (cur) => {
        if (!cur) {
          return cur;
        }
        return {
          items: cur.items.map((it) =>
            it.id !== itemId
              ? it
              : {
                  ...it,
                  isConfirmedByCurrentUser: true,
                  confirmedAt: it.confirmedAt ?? new Date().toISOString(),
                },
          ),
        };
      });

      return { prev };
    },
    onError: (e: unknown, _itemId: string, ctx) => {
      analytics.track('write_action_failed', { actionType: 'document_confirm', retried: false });
      if (eventId && ctx?.prev !== undefined) {
        queryClient.setQueryData(['tripDocuments', eventId], ctx.prev);
      }
      if (axios.isAxiosError(e) && e.response?.status === 400) {
        addToast('error', "Couldn't save — check your connection and try again.");
        return;
      }
      addToast('error', "Couldn't save — check your connection and try again.");
    },
    onSuccess: async () => {
      if (!eventId) {
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['tripDocuments', eventId] });
    },
  });
}

