import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/foundation/Text';
import { TextAreaInput } from '@/components/input/TextAreaInput';
import { RecipientSelector } from '@/components/input/RecipientSelector';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { BottomSheet } from '@/components/overlay/BottomSheet';
import { ConfirmationSheet } from '@/components/overlay/ConfirmationSheet';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { usePublishPost } from '@/mutations/usePublishPost';
import { loadPostDraft, savePostDraft, clearPostDraft, type PostDraftPayload } from '@/services/postDraftStorage';
import type { PostType, RecipientGroup } from '@/types/models';
import type { FeedStackParamList } from '@/types/navigation';
import { canCreatePosts } from '@/utils/roles';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const MAX_CHARS = 500;

const typeOptions: { key: PostType; title: string; description: string }[] = [
  {
    key: 'scheduleUpdate',
    title: 'Schedule Update',
    description: 'Requires acknowledgment from recipients',
  },
  {
    key: 'travelInfo',
    title: 'Travel Info',
    description: 'Logistics and travel details',
  },
  {
    key: 'generalAnnouncement',
    title: 'Announcement',
    description: 'General team information',
  },
  {
    key: 'urgentAlert',
    title: 'Urgent Alert',
    description: 'High priority — requires acknowledgment',
  },
];

export function PostCreationScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<FeedStackParamList, 'PostCreation'>>();
  const { teamMemberId, role } = useCurrentMember();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const isOffline = useUiStore((s) => s.isOffline);

  const canCreate = role ? canCreatePosts(role) : false;
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<RecipientGroup | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [content, setContent] = useState('');
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const publishMutation = usePublishPost();

  // For MVP we treat hasTravelingSquad as true when there is any active trip; here assume true.
  // In a fuller implementation we would query active trip state.
  const hasTravelingSquad = true;

  useEffect(() => {
    if (!teamMemberId || !canCreate) {
      return;
    }
    const existing = loadPostDraft(teamMemberId);
    if (existing && existing.content.length > 0) {
      setShowDraftPrompt(true);
    }
  }, [canCreate, teamMemberId]);

  useEffect(() => {
    if (!teamMemberId || !canCreate) {
      return;
    }
    const payload: PostDraftPayload = {
      type: selectedType,
      recipientGroup: selectedGroup,
      eventId,
      isUrgent,
      content,
      updatedAt: new Date().toISOString(),
    };
    const handle = setTimeout(() => {
      savePostDraft(teamMemberId, payload);
    }, 2000);
    return () => clearTimeout(handle);
  }, [canCreate, content, eventId, isUrgent, selectedGroup, selectedType, teamMemberId]);

  const over80 = content.length >= 0.8 * MAX_CHARS;
  const overLimit = content.length > MAX_CHARS;

  const canPublish =
    canCreate &&
    !isOffline &&
    !overLimit &&
    content.trim().length > 0 &&
    selectedType !== null &&
    selectedGroup !== null;

  const warningsColor =
    overLimit ? color.stateDestructive : over80 ? color.stateWarning : color.textSecondary;

  const charLabel =
    content.length === 0
      ? ''
      : `${MAX_CHARS - content.length} characters remaining`;

  const handlePublish = () => {
    if (!teamId || !selectedType || !selectedGroup) {
      return;
    }
    publishMutation.mutate(
      {
        type: selectedType,
        content: content.trim(),
        recipientGroup: selectedGroup,
        eventId,
        isUrgent,
      },
      {
        onSuccess: () => {
          if (teamMemberId) {
            clearPostDraft(teamMemberId);
          }
          navigation.goBack();
        },
      },
    );
  };

  const handleResumeDraft = () => {
    if (!teamMemberId) {
      setShowDraftPrompt(false);
      return;
    }
    const existing = loadPostDraft(teamMemberId);
    if (!existing) {
      setShowDraftPrompt(false);
      return;
    }
    setSelectedType(existing.type);
    setSelectedGroup(existing.recipientGroup);
    setEventId(existing.eventId);
    setIsUrgent(existing.isUrgent);
    setContent(existing.content);
    setShowDraftPrompt(false);
  };

  const handleDiscardDraft = () => {
    setShowDraftPrompt(false);
    setShowDiscardConfirm(true);
  };

  const confirmDiscard = () => {
    if (teamMemberId) {
      clearPostDraft(teamMemberId);
    }
    setShowDiscardConfirm(false);
    setSelectedType(null);
    setSelectedGroup(null);
    setEventId(null);
    setIsUrgent(false);
    setContent('');
  };

  if (!canCreate) {
    return (
      <ScreenContainer scrollable>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="body">Feed creation is only available to coaches and coordinators.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer scrollable={false}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.space16, paddingBottom: spacing.space24 }}
        >
          <Text variant="title" style={{ marginBottom: spacing.space12 }}>
            Post type
          </Text>
          {typeOptions.map((opt) => {
            const selected = selectedType === opt.key;
            return (
              <View
                key={opt.key}
                style={{
                  borderRadius: spacing.space12,
                  borderWidth: 1,
                  borderColor: selected ? color.actionPrimary : color.borderSubtle,
                  padding: spacing.space12,
                  marginBottom: spacing.space8,
                  backgroundColor: selected ? color.surfaceInput : color.surfaceElevated,
                }}
              >
                <Text variant="body" style={{ marginBottom: spacing.space4 }}>
                  {opt.title}
                </Text>
                <Text variant="caption" style={{ color: color.textSecondary }}>
                  {opt.description}
                </Text>
              </View>
            );
          })}

          <View style={{ height: spacing.space24 }} />

          <Text variant="title" style={{ marginBottom: spacing.space8 }}>
            Recipients
          </Text>
          <RecipientSelector
            selectedGroup={selectedGroup}
            onSelect={setSelectedGroup}
            hasTravelingSquad={hasTravelingSquad}
          />

          <View style={{ height: spacing.space24 }} />

          <Text variant="title" style={{ marginBottom: spacing.space8 }}>
            Urgent
          </Text>
          <Text variant="body" style={{ marginBottom: spacing.space12 }}>
            Mark this as high priority — requires acknowledgment.
          </Text>
          {/* Simple toggle via text tap for MVP; can be replaced with switch */}
          <Text
            variant="body"
            style={{
              color: isUrgent ? color.stateWarning : color.textSecondary,
            }}
            onPress={() => setIsUrgent((v) => !v)}
          >
            {isUrgent ? 'Urgent' : 'Not urgent'}
          </Text>

          <View style={{ height: spacing.space24 }} />

          <TextAreaInput
            label="Content"
            placeholder="Write your update (500 character limit)"
            value={content}
            onChangeText={setContent}
            maxLength={MAX_CHARS}
          />
          {charLabel ? (
            <Text
              variant="caption"
              style={{ alignSelf: 'flex-end', marginTop: spacing.space4, color: warningsColor }}
            >
              {charLabel}
            </Text>
          ) : null}
        </ScrollView>

        <View
          style={{
            padding: spacing.space16,
            borderTopWidth: 1,
            borderTopColor: color.borderSubtle,
          }}
        >
          <LoadingButton
            label="Publish"
            onPress={handlePublish}
            disabled={!canPublish}
            isLoading={publishMutation.status === 'pending'}
          />
          {isOffline ? (
            <Text
              variant="caption"
              style={{ marginTop: spacing.space8, textAlign: 'center', color: color.textSecondary }}
            >
              Available when connected
            </Text>
          ) : null}
        </View>
      </ScreenContainer>

      <BottomSheet
        visible={showDraftPrompt}
        onClose={() => setShowDraftPrompt(false)}
      >
        <View style={{ paddingBottom: spacing.space16 }}>
          <Text variant="title" style={{ marginBottom: spacing.space8 }}>
            You have a saved draft
          </Text>
          <Text variant="body" style={{ marginBottom: spacing.space16 }}>
            Resume your earlier post or start fresh.
          </Text>
          <LoadingButton label="Resume draft" onPress={handleResumeDraft} isLoading={false} />
          <View style={{ height: spacing.space12 }} />
          <LoadingButton
            label="Discard and start fresh"
            onPress={handleDiscardDraft}
            isLoading={false}
          />
        </View>
      </BottomSheet>

      <ConfirmationSheet
        visible={showDiscardConfirm}
        title="Discard this draft?"
        body="Your draft will be deleted."
        confirmLabel="Discard draft"
        cancelLabel="Go back"
        isDestructive
        onConfirm={confirmDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
}

