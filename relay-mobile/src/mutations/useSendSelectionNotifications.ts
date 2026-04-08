import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';

export function useSendSelectionNotifications(eventId: string) {
  const queryClient = useQueryClient();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: async () => {
      if (useUiStore.getState().isOffline) {
        analytics.track('offline_write_attempted', { actionType: 'selection_notify' });
      }
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
      analytics.track('write_action_failed', { actionType: 'selection_notify', retried: false });
      addToast('error', "Couldn't send notifications.");
    },
  });
}
