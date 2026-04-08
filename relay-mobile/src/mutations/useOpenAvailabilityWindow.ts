import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@/services/api';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';

export function useOpenAvailabilityWindow() {
  const queryClient = useQueryClient();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (eventId: string) => {
      await api.post(`/events/${eventId}/availability/open`);
    },
    onSuccess: (_d, eventId) => {
      void queryClient.invalidateQueries({ queryKey: ['eventAvailability', teamId, eventId] });
      void queryClient.invalidateQueries({ queryKey: ['teamEvents', teamId] });
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        addToast('error', 'Availability is already open for this event.');
        return;
      }
      addToast('error', "Couldn't open availability.");
    },
  });
}
