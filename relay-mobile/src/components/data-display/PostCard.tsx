import React, { useMemo } from 'react';
import { View } from 'react-native';
import { CardContainer } from '@/components/layout/CardContainer';
import { Text } from '@/components/foundation/Text';
import { Icon } from '@/components/foundation/Icon';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
const ACK_DOT_SIZE = spacing.space24 - 2;
const ACK_DOT_RADIUS = radius.full;
import type { DeliveryState, Post, PostType } from '@/types/models';

function typeLabel(t: PostType): string {
  switch (t) {
    case 'scheduleUpdate':
      return 'Schedule Update';
    case 'travelInfo':
      return 'Travel Info';
    case 'generalAnnouncement':
      return 'Announcement';
    case 'urgentAlert':
      return 'Urgent';
  }
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hours ago`;
  const days = Math.floor(h / 24);
  return `${days} days ago`;
}

function isUnread(state: DeliveryState): boolean {
  return state === 'notSeen';
}

export interface PostCardProps {
  post: Post;
  onPress: () => void;
}

export function PostCard({ post, onPress }: PostCardProps): React.ReactElement {
  const chip = useMemo(() => typeLabel(post.type), [post.type]);
  const urgentBorder = post.type === 'urgentAlert' || post.isUrgent;
  const unread = isUnread(post.currentUserDeliveryState);
  const requiresAck = post.requiresAcknowledgment;
  const isAcked = post.currentUserDeliveryState === 'acknowledged';

  const a11yState = unread ? 'Unread' : 'Read';
  const a11yType = chip;

  return (
    <CardContainer
      pressable
      onPress={onPress}
      style={{
        marginBottom: spacing.space12,
        backgroundColor: unread ? color.surfaceInput : color.surfaceElevated,
        borderLeftWidth: urgentBorder ? 4 : 0,
        borderLeftColor: urgentBorder ? color.stateWarning : 'transparent',
      }}
      accessibilityLabel={`${a11yType}, ${a11yState}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.space8 }}>
        <View
          style={{
            paddingHorizontal: spacing.space8,
            paddingVertical: spacing.space4,
            borderRadius: spacing.space8,
            backgroundColor: post.type === 'urgentAlert' ? color.stateWarning : color.surfaceInput,
          }}
        >
          <Text
            variant="label"
            style={{
              color: post.type === 'urgentAlert' ? color.textPrimary : color.textSecondary,
            }}
          >
            {chip}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        {requiresAck ? (
          <View
            style={{
              width: ACK_DOT_SIZE,
              height: ACK_DOT_SIZE,
              borderRadius: ACK_DOT_RADIUS,
              borderWidth: isAcked ? 0 : 1.5,
              borderColor: color.borderDefault,
              backgroundColor: isAcked ? color.stateSuccess : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel={isAcked ? 'Acknowledged' : 'Unacknowledged'}
          >
            {isAcked ? <Icon name="check" size={16} color={color.actionOnPrimary} /> : null}
          </View>
        ) : null}
      </View>

      <Text variant="body" style={{ marginBottom: spacing.space12 }}>
        {post.content.length > 100 ? `${post.content.slice(0, 100)}…` : post.content}
      </Text>

      <Text variant="caption" style={{ color: color.textSecondary }}>
        {post.createdByName} • {formatRelative(post.createdAt)}
      </Text>
    </CardContainer>
  );
}

