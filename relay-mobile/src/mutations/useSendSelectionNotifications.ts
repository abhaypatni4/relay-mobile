import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';

export function useSendSelectionNotifications(eventId: string) {
  const queryClient = useQueryClient();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ selected: number; notSelected: number; skipped: number }>(
        `/events/${eventId}/availability/notify`,
      );
      return data;
    },
    onSuccess: (data) => {
      const n = data.selected + data.notSelected;
      addToast('success', `Selection notifications sent to ${String(n)} members`);
      void queryClient.invalidateQueries({ queryKey: ['eventAvailability', teamId, eventId] });
      void queryClient.invalidateQueries({ queryKey: ['teamEvents', teamId] });
    },
    onError: () => {
      addToast('error', "Couldn't send notifications.");
    },
  });
}
