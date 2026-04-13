import { analytics } from '@/services/analytics';
import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { SkeletonLoader } from '@/components/feedback/SkeletonLoader';
import { Text } from '@/components/foundation/Text';
import { Icon } from '@/components/foundation/Icon';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { PostCard } from '@/components/data-display/PostCard';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { usePosts } from '@/queries/usePosts';
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
          <>
            <SkeletonLoader variant="card" style={{ marginBottom: spacing.space12 }} />
            <SkeletonLoader variant="card" />
          </>
        ) : showEmpty ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text variant="body">No updates yet. Check back when your coordinator posts.</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
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

