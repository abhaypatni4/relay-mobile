import { analytics } from '@/services/analytics';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/foundation/Text';
import { Icon } from '@/components/foundation/Icon';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { PostCard } from '@/components/data-display/PostCard';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { usePosts } from '@/queries/usePosts';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import type { FeedStackParamList } from '@/types/navigation';
import { canCreatePosts } from '@/utils/roles';

export function FeedScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('FeedScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<FeedStackParamList, 'Feed'>>();
  const { role } = useCurrentMember();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const isOffline = useUiStore((s) => s.isOffline);
  const canCreate = role ? canCreatePosts(role) : false;
  const queryClient = useQueryClient();

  useFocusEffect(
    React.useCallback(() => {
      if (!teamId) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['teamPosts', teamId] });
      void queryClient.invalidateQueries({ queryKey: ['teamPosts'] });
    }, [queryClient, teamId]),
  );

  const q = usePosts({ pollEvery120sWhileFocused: true });

  const posts = q.data?.posts ?? [];
  const seenMarkedRef = React.useRef<Set<string>>(new Set());

  const renderItem = ({ item }: { item: (typeof posts)[number] }) => (
    <PostCard post={item} onPress={() => navigation.navigate('PostDetail', { postId: item.id })} />
  );

  const showEmpty = q.isSuccess && posts.length === 0;
  const onViewableItemsChanged = React.useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: (typeof posts)[number] | null }> }) => {
      if (!teamId) {
        return;
      }
      for (const viewable of viewableItems) {
        const post = viewable.item;
        if (!post) {
          continue;
        }
        if (seenMarkedRef.current.has(post.id)) {
          continue;
        }
        seenMarkedRef.current.add(post.id);
        void api.post(`/teams/${teamId}/posts/${post.id}/seen`).catch(() => {
          /* best effort */
        });
      }
    },
  ).current;

  return (
    <ScreenContainer scrollable={false}>
      <OfflineBanner />
      <View style={{ flex: 1, paddingHorizontal: spacing.space16, paddingTop: spacing.space16 }}>
        {q.isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={color.actionPrimary} />
          </View>
        ) : q.isError ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text variant="body" style={{ marginBottom: spacing.space12 }}>
              Something went wrong
            </Text>
            <Pressable onPress={() => void q.refetch()} style={{ padding: spacing.space8 }}>
              <Text variant="label" colorToken={color.actionPrimary}>
                Try again
              </Text>
            </Pressable>
          </View>
        ) : showEmpty ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View
              style={{
                width: '100%',
                borderRadius: spacing.space12,
                borderWidth: 1,
                borderColor: color.borderSubtle,
                backgroundColor: color.surfaceElevated,
                padding: spacing.space24,
                alignItems: 'center',
              }}
            >
              <Icon name="feed" size={40} color={color.actionPrimary} />
              <Text variant="body" style={{ marginTop: spacing.space12, textAlign: 'center' }}>
                No posts yet
              </Text>
              <Text variant="label" colorToken={color.textSecondary} style={{ marginTop: spacing.space4, textAlign: 'center' }}>
                Team updates will appear here.
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} />}
            contentContainerStyle={{ paddingBottom: spacing.space24 }}
          />
        )}
      </View>

      {canCreate ? (
        <View
          style={{
            position: 'absolute',
            right: spacing.space16,
            bottom: spacing.space24,
          }}
        >
          <Pressable
            onPress={() => navigation.navigate('PostCreation')}
            accessibilityRole="button"
            accessibilityLabel={isOffline ? 'Create post, available when connected' : 'Create post'}
            disabled={isOffline}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.space16,
              paddingVertical: spacing.space12,
              borderRadius: spacing.space24,
              backgroundColor: isOffline ? color.surfaceInput : color.actionPrimary,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Icon
              name="plus"
              size={20}
              color={isOffline ? color.textSecondary : color.actionOnPrimary}
            />
            <Text
              variant="body"
              style={{
                marginLeft: spacing.space8,
                color: isOffline ? color.textSecondary : color.actionOnPrimary,
              }}
            >
              {isOffline ? 'Available when connected' : 'Post'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

