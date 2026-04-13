import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';

export function useOpenAvailabilityWindow() {
  const queryClient = useQueryClient();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (useUiStore.getState().isOffline) {
        analytics.track('offline_write_attempted', { actionType: 'availability_open' });
      }
      await api.post(`/events/${eventId}/availability/open`);
      analytics.track('availability_window_opened', { eventId });
    },
    onSuccess: (_d, eventId) => {
      void queryClient.invalidateQueries({ queryKey: ['availability', eventId] });
      void queryClient.invalidateQueries({ queryKey: ['teamEvents', teamId] });
    },
    onError: (err: unknown) => {
      analytics.track('write_action_failed', { actionType: 'availability_open', retried: false });
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        addToast('error', 'Availability is already open for this event.');
        return;
      }
      addToast('error', "Couldn't open availability.");
    },
  });
}
