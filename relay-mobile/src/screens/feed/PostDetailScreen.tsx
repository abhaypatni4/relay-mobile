import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { SkeletonLoader } from '@/components/feedback/SkeletonLoader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api } from '@/services/api';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { spacing } from '@/tokens/spacing';
import type { FeedStackParamList } from '@/types/navigation';

export function PostDetailScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<FeedStackParamList, 'PostDetail'>>();
  const route = useRoute<RouteProp<FeedStackParamList, 'PostDetail'>>();
  const { postId } = route.params;
  const teamId = useTeamStore((s) => s.activeTeamId);
  const addToast = useUiStore((s) => s.addToast);
  const handled404 = useRef(false);

  const q = useQuery({
    queryKey: ['postDetail', teamId, postId],
    queryFn: async () => {
      const { data } = await api.get<Record<string, unknown>>(`/teams/${teamId}/posts/${postId}`);
      return data;
    },
    enabled: Boolean(teamId && postId),
    retry: false,
  });

  useEffect(() => {
    if (handled404.current || !q.isFetched) {
      return;
    }
    if (q.isError && axios.isAxiosError(q.error) && q.error.response?.status === 404) {
      handled404.current = true;
      addToast('error', 'This post is no longer available.');
      navigation.navigate('Feed');
    }
  }, [addToast, navigation, q.error, q.isError, q.isFetched]);

  if (q.isLoading) {
    return (
      <ScreenContainer scrollable>
        <SkeletonLoader variant="card" style={{ marginBottom: spacing.space12 }} />
        <SkeletonLoader variant="card" />
      </ScreenContainer>
    );
  }

  if (q.isError) {
    const status = axios.isAxiosError(q.error) ? q.error.response?.status : undefined;
    if (status === 404) {
      return <View style={{ flex: 1 }} />;
    }
    return (
      <ScreenContainer scrollable>
        <Text variant="body">Could not load this post.</Text>
      </ScreenContainer>
    );
  }

  const body =
    typeof q.data?.body === 'string'
      ? q.data.body
      : typeof q.data?.content === 'string'
        ? q.data.content
        : null;
  const title = typeof q.data?.title === 'string' ? q.data.title : 'Post';

  return (
    <ScreenContainer scrollable>
      <Text variant="display" style={{ marginBottom: spacing.space12 }}>
        {title}
      </Text>
      {body ? <Text variant="body">{body}</Text> : <Text variant="body">No content.</Text>}
    </ScreenContainer>
  );
}
