import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@/services/api';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import type { AvailabilityResponse } from '@/queries/useAvailability';
import type { AvailabilityStatus } from '@/types/models';

export function useSubmitAvailability(eventId: string) {
  const queryClient = useQueryClient();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const { teamMemberId } = useCurrentMember();
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (body: { availabilityStatus: AvailabilityStatus; note: string | null }) => {
      await api.post(`/events/${eventId}/availability/submit`, body);
    },
    onMutate: async (vars) => {
      const qk = ['eventAvailability', teamId, eventId] as const;
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
      const qk = ['eventAvailability', teamId, eventId] as const;
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
      void queryClient.invalidateQueries({ queryKey: ['eventAvailability', teamId, eventId] });
    },
  });
}
