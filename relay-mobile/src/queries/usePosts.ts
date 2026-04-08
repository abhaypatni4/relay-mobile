import { useIsFocused } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useTeamStore } from '@/store/teamStore';
import type { Post } from '@/types/models';

export interface PostsResponse {
  posts: Post[];
}

export function usePosts(options?: {
  pollEvery120sWhileFocused?: boolean;
}): ReturnType<typeof useQuery<PostsResponse>> {
  const teamId = useTeamStore((s) => s.activeTeamId);
  const focused = useIsFocused();
  const poll = Boolean(options?.pollEvery120sWhileFocused && focused);
  return useQuery({
    queryKey: ['teamPosts', teamId],
    queryFn: async () => {
      const { data } = await api.get<PostsResponse>(`/teams/${teamId}/posts`);
      return data;
    },
    enabled: Boolean(teamId),
    refetchInterval: poll ? 120_000 : false,
    refetchIntervalInBackground: false,
  });
}

