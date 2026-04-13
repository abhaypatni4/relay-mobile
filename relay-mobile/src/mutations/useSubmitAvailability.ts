import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useUiStore } from '@/store/uiStore';
import type { AvailabilityResponse } from '@/queries/useAvailability';
import type { AvailabilityStatus } from '@/types/models';

export function useSubmitAvailability(eventId: string) {
  const queryClient = useQueryClient();
  const { teamMemberId } = useCurrentMember();
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (body: { availabilityStatus: AvailabilityStatus; note: string | null }) => {
      if (useUiStore.getState().isOffline) {
        analytics.track('offline_write_attempted', { actionType: 'availability_submit' });
      }
      await api.post(`/events/${eventId}/availability/submit`, body);
      analytics.track('availability_submitted', {
        status: body.availabilityStatus,
        hasNote: Boolean(body.note),
        eventId,
      });
    },
    onMutate: async (vars) => {
      const qk = ['availability', eventId] as const;
      await queryClient.cancelQueries({ queryKey: qk });
      const previous = queryClient.getQueryData<AvailabilityResponse>(qk);
      if (previous && teamMemberId) {
        const now = new Date().toISOString();
        queryClient.setQueryData<AvailabilityResponse>(qk, {
          ...previous,
          submissions: previous.submissions.map((s) =>
            s.teamMemberId === teamMemberId
              ? {
                  ...s,
                  availabilityStatus: vars.availabilityStatus,
                  note: vars.note,
                  submittedAt: now,
                  updatedAt: now,
                }
              : s,
          ),
        });
      }
      return { previous };
    },
    onError: (err: unknown, _vars, ctx) => {
      analytics.track('write_action_failed', { actionType: 'availability_submit', retried: false });
      const qk = ['availability', eventId] as const;
      if (ctx?.previous) {
        queryClient.setQueryData(qk, ctx.previous);
      }
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        const msg =
          typeof err.response.data === 'object' &&
          err.response.data !== null &&
          'error' in err.response.data &&
          typeof (err.response.data as { error: unknown }).error === 'string'
            ? (err.response.data as { error: string }).error
            : '';
        if (msg.includes('locked')) {
          addToast('error', 'Availability is now locked. Your response was not saved.');
          return;
        }
      }
      addToast('error', "Couldn't save — try again.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['availability', eventId] });
    },
  });
}
