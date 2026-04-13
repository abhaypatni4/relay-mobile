import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { SkeletonLoader } from '@/components/feedback/SkeletonLoader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/foundation/Text';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { color } from '@/tokens/colors';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { spacing } from '@/tokens/spacing';
import type { FeedStackParamList } from '@/types/navigation';
import type { DeliveryState, Post } from '@/types/models';

export function PostDetailScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('PostDetailScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<FeedStackParamList, 'PostDetail'>>();
  const route = useRoute<RouteProp<FeedStackParamList, 'PostDetail'>>();
  const { postId } = route.params;
  const { role, teamMemberId } = useCurrentMember();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const addToast = useUiStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const handled404 = useRef(false);
  const [showMembers, setShowMembers] = React.useState(false);

  const q = useQuery({
    queryKey: ['postDetail', teamId, postId],
    queryFn: async () => {
      const { data } = await api.get<{ post: Record<string, unknown> }>(`/teams/${teamId}/posts/${postId}`);
      return data.post;
    },
    enabled: Boolean(teamId && postId),
    retry: false,
  });
  useFocusEffect(
    React.useCallback(() => {
      if (!teamId || !postId) {
        return;
      }
      void api.post(`/teams/${teamId}/posts/${postId}/seen`).catch(() => {
        /* best effort */
      });
    }, [teamId, postId]),
  );

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

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      if (!teamId || !postId) {
        return;
      }
      await api.post(`/teams/${teamId}/posts/${postId}/acknowledge`);
    },
    onMutate: async () => {
      if (!teamId || !postId) {
        return;
      }
      await queryClient.cancelQueries({ queryKey: ['postDetail', teamId, postId] });
      const previousDetail = queryClient.getQueryData<Post>(['postDetail', teamId, postId]);
      const normalizeState = (
        state: Post['currentUserDeliveryState'],
      ): { state: DeliveryState; seenAt: string | null; acknowledgedAt: string | null } =>
        typeof state === 'string'
          ? { state, seenAt: null, acknowledgedAt: null }
          : state;
      const nowIso = new Date().toISOString();
      queryClient.setQueryData<Post>(['postDetail', teamId, postId], (prev) => {
        if (!prev) {
          return prev;
        }
        const cur = normalizeState(prev.currentUserDeliveryState);
        return {
          ...prev,
          currentUserDeliveryState: {
            state: 'acknowledged',
            seenAt: cur.seenAt ?? nowIso,
            acknowledgedAt: nowIso,
          },
          currentUserAcknowledgedAt: nowIso,
        };
      });
      queryClient.setQueryData<{ posts: Post[] }>(['teamPosts', teamId], (prev) => {
        if (!prev) {
          return prev;
        }
        return {
          posts: prev.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  currentUserDeliveryState: {
                    state: 'acknowledged',
                    seenAt:
                      typeof p.currentUserDeliveryState === 'string'
                        ? nowIso
                        : (p.currentUserDeliveryState.seenAt ?? nowIso),
                    acknowledgedAt: nowIso,
                  },
                  currentUserAcknowledgedAt: nowIso,
                }
              : p,
          ),
        };
      });
      return { previousDetail };
    },
    onError: (_err, _vars, ctx) => {
      if (teamId && postId && ctx?.previousDetail) {
        queryClient.setQueryData(['postDetail', teamId, postId], ctx.previousDetail);
      }
      addToast('error', "Couldn't save — check your connection");
    },
    onSuccess: async () => {
      if (!teamId) {
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['postDetail', teamId, postId] });
      await queryClient.invalidateQueries({ queryKey: ['teamPosts', teamId] });
    },
  });

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

  const post = (q.data ?? null) as Post | null;
  const body = typeof post?.content === 'string' ? post.content : null;
  const title = typeof post?.type === 'string' ? String(post.type) : 'Post';
  const showDelivery = role === 'coordinator' || role === 'coach';
  const delivery = post?.deliverySummary;
  const members = delivery?.members ?? [];
  const stateLabel = (state: DeliveryState): string => {
    if (state === 'acknowledged') return 'Acknowledged';
    if (state === 'seen') return 'Seen';
    return 'Not seen';
  };
  const stateIcon = (state: DeliveryState): string => {
    if (state === 'acknowledged') return '✓';
    if (state === 'seen') return '👁';
    return '○';
  };
  const deliveryState = (() => {
    const raw = post?.currentUserDeliveryState;
    if (!raw) {
      return 'notSeen' as DeliveryState;
    }
    return typeof raw === 'string' ? raw : raw.state;
  })();
  const canAcknowledgeRole = Boolean(role && role !== 'coordinator');
  const isCreator = Boolean(post?.createdBy && teamMemberId && post.createdBy === teamMemberId);
  const showAcknowledgeButton =
    Boolean(post?.requiresAcknowledgment) &&
    canAcknowledgeRole &&
    !isCreator &&
    deliveryState !== 'acknowledged';

  return (
    <ScreenContainer scrollable>
      <Text variant="display" style={{ marginBottom: spacing.space12 }}>
        {title}
      </Text>
      {body ? <Text variant="body">{body}</Text> : <Text variant="body">No content.</Text>}
      {showAcknowledgeButton ? (
        <Pressable
          onPress={() => acknowledgeMutation.mutate()}
          disabled={acknowledgeMutation.isPending}
          style={({ pressed }) => ({
            marginTop: spacing.space16,
            borderRadius: spacing.space12,
            backgroundColor: color.actionPrimary,
            paddingVertical: spacing.space12,
            alignItems: 'center',
            opacity: pressed || acknowledgeMutation.isPending ? 0.85 : 1,
          })}
          accessibilityRole="button"
          accessibilityLabel="Acknowledge post"
        >
          <Text variant="label" style={{ color: color.actionOnPrimary }}>
            {acknowledgeMutation.isPending ? 'Saving...' : "I've got it"}
          </Text>
        </Pressable>
      ) : null}
      {showDelivery && delivery ? (
        <View style={{ marginTop: spacing.space20 }}>
          <Text
            variant="caption"
            style={{ color: color.textSecondary, letterSpacing: 1, marginBottom: spacing.space8 }}
          >
            DELIVERY
          </Text>
          <Text variant="body" style={{ marginBottom: spacing.space8 }}>
            👁 {delivery.seen ?? delivery.seenCount} seen | ○ {delivery.notSeen ?? Math.max((delivery.total ?? delivery.sentCount) - (delivery.seen ?? delivery.seenCount), 0)} not seen | ✓ {delivery.acknowledged ?? delivery.acknowledgedCount} acknowledged
          </Text>
          <Text
            variant="label"
            style={{ color: color.actionPrimary, marginBottom: spacing.space8 }}
            onPress={() => setShowMembers((v) => !v)}
          >
            {showMembers ? 'Hide recipients' : 'Show recipients'}
          </Text>
          {showMembers
            ? members.map((member) => (
                <Text key={member.memberId} variant="body" style={{ marginBottom: spacing.space8 }}>
                  {stateIcon(member.state)} {member.memberName} - {stateLabel(member.state)}
                </Text>
              ))
            : null}
        </View>
      ) : null}
    </ScreenContainer>
  );
}
