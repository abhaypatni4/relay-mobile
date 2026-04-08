import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@/services/api';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import type { PostsResponse } from '@/queries/usePosts';
import type { PostType, RecipientGroup } from '@/types/models';

export function usePublishPost() {
  const queryClient = useQueryClient();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: async (body: {
      type: PostType;
      content: string;
      recipientGroup: RecipientGroup;
      eventId: string | null;
      isUrgent: boolean;
    }) => {
      const { data } = await api.post<{ postId: string }>(`/teams/${teamId}/posts`, body);
      return data;
    },
    onSuccess: async () => {
      addToast('success', 'Post published');
      await queryClient.invalidateQueries({ queryKey: ['teamPosts', teamId] });
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const msg =
          typeof err.response?.data === 'object' &&
          err.response?.data !== null &&
          'error' in err.response.data &&
          typeof (err.response.data as { error: unknown }).error === 'string'
            ? (err.response.data as { error: string }).error
            : '';
        if (err.response?.status === 400 && msg.toLowerCase().includes('traveling squad')) {
          addToast('error', 'Traveling Squad requires an active published trip.');
          return;
        }
      }
      addToast('error', "Couldn't save — check your connection and try again.");
    },
    onMutate: async () => {
      // No optimistic update: recipients require server-side delivery state creation.
      await queryClient.cancelQueries({ queryKey: ['teamPosts', teamId] });
      const prev = queryClient.getQueryData<PostsResponse>(['teamPosts', teamId]);
      return { prev };
    },
    onSettled: (_data, _err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['teamPosts', teamId], ctx.prev);
      }
    },
  });
}

