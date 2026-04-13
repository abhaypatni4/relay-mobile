import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useUiStore } from '@/store/uiStore';
import type { AvailabilityResponse } from '@/queries/useAvailability';
import type { OperationalStatus } from '@/types/models';

export function useSetOperationalStatus(eventId: string) {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (input: { submissionId: string; operationalStatus: OperationalStatus }) => {
      if (useUiStore.getState().isOffline) {
        analytics.track('offline_write_attempted', { actionType: 'operational_status_set' });
      }
      await api.patch(`/events/${eventId}/availability/${input.submissionId}/operational`, {
        operationalStatus: input.operationalStatus,
      });
      analytics.track('operational_status_set', {
        eventId,
        operationalStatus: input.operationalStatus,
      });
    },
    onMutate: async (vars) => {
      const qk = ['availability', eventId] as const;
      await queryClient.cancelQueries({ queryKey: qk });
      const previous = queryClient.getQueryData<AvailabilityResponse>(qk);
      if (previous) {
        queryClient.setQueryData<AvailabilityResponse>(qk, {
          ...previous,
          submissions: previous.submissions.map((s) =>
            s.id === vars.submissionId ? { ...s, operationalStatus: vars.operationalStatus } : s,
          ),
        });
      }
      return { previous };
    },
    onError: (err: unknown, _vars, ctx) => {
      analytics.track('write_action_failed', { actionType: 'operational_status_set', retried: false });
      const qk = ['availability', eventId] as const;
      if (ctx?.previous) {
        queryClient.setQueryData(qk, ctx.previous);
      }
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        addToast('error', 'You cannot set that status.');
        return;
      }
      addToast('error', "Couldn't update status.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['availability', eventId] });
    },
  });
}
