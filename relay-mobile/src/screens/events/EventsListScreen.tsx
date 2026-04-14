import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, View } from 'react-native';
import { Icon } from '@/components/foundation/Icon';
import { Text } from '@/components/foundation/Text';
import { EventCard, eventStartDate } from '@/components/data-display/EventCard';
import { ConfirmationSheet } from '@/components/overlay/ConfirmationSheet';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useTeamEvents, type ApiEventListItem } from '@/hooks/useTeamEvents';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { EventsStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'EventsList'>;

interface EventSection {
  key: 'drafts' | 'upcoming' | 'past';
  title: string;
  count: number;
  data: ApiEventListItem[];
}

export function EventsListScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('EventsListScreen');
    }, []),
  );

  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const role = useTeamStore((s) => s.role);
  const addToast = useUiStore((s) => s.addToast);
  const { data: teamEventsData, isLoading, isError, refetch, isRefetching } = useTeamEvents(teamId);

  const [pastExpanded, setPastExpanded] = useState(false);
  const [publishTarget, setPublishTarget] = useState<ApiEventListItem | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (teamId) {
        void queryClient.invalidateQueries({ queryKey: ['events', teamId] });
        void queryClient.invalidateQueries({ queryKey: ['teamEvents', teamId] });
      }
      void refetch();
    }, [queryClient, refetch, teamId]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight:
        role === 'coordinator' || role === 'coach'
          ? () => (
              <Pressable
                onPress={() => navigation.navigate('CreateEvent')}
                accessibilityRole="button"
                accessibilityLabel="Create event"
                style={{ marginRight: spacing.space16, padding: spacing.space8 }}
              >
                <Text variant="title" colorToken={color.actionPrimary}>
                  +
                </Text>
              </Pressable>
            )
          : undefined,
    });
  }, [navigation, role]);

  const { drafts, upcoming, past } = useMemo(() => {
    const list = teamEventsData ?? [];
    const now = new Date();
    const d: ApiEventListItem[] = [];
    const u: ApiEventListItem[] = [];
    const p: ApiEventListItem[] = [];
    for (const e of list) {
      if (role === 'coordinator' && e.type === 'trip' && e.status === 'draft') {
        d.push(e);
        continue;
      }
      if (eventStartDate(e) >= now) {
        u.push(e);
      } else {
        p.push(e);
      }
    }
    return { drafts: d, upcoming: u, past: p };
  }, [role, teamEventsData]);

  const resolveTripWorkspaceId = useCallback(
    async (e: ApiEventListItem): Promise<string | null> => {
      if (!teamId) {
        return null;
      }
      const { data } = await api.get<ApiEventListItem & { tripWorkspace?: { id: string } }>(`/teams/${teamId}/events/${e.id}`);
      return data.tripWorkspace?.id ?? null;
    },
    [teamId],
  );

  const publishMutation = useMutation({
    mutationFn: async (event: ApiEventListItem) => {
      await api.post(`/events/${event.id}/trip/publish`);
    },
    onSuccess: async () => {
      if (teamId) {
        await queryClient.invalidateQueries({ queryKey: ['teamEvents', teamId] });
        await queryClient.invalidateQueries({ queryKey: ['events', teamId] });
      }
      await queryClient.invalidateQueries({ queryKey: ['teamEvents'] });
      addToast('success', 'Trip published');
      setPublishTarget(null);
    },
    onError: () => {
      addToast('error', 'Could not publish trip.');
      setPublishTarget(null);
    },
  });

  const sections: EventSection[] = useMemo(
    () =>
      [
        ...(role === 'coordinator' ? [{ key: 'drafts' as const, title: 'DRAFTS', count: drafts.length, data: drafts }] : []),
        { key: 'upcoming' as const, title: 'UPCOMING', count: upcoming.length, data: upcoming },
        {
          key: 'past' as const,
          title: 'PAST',
          count: past.length,
          data: pastExpanded ? past : [],
        },
      ],
    [drafts, past, pastExpanded, role, upcoming],
  );

  const onOpenEvent = useCallback(
    async (e: ApiEventListItem) => {
      if (!teamId) {
        return;
      }
      if (e.type === 'trip') {
        try {
          const twId = await resolveTripWorkspaceId(e);
          if (twId) {
            navigation.navigate('TripDetail', { tripId: twId, eventId: e.id });
          }
        } catch {
          /* empty */
        }
        return;
      }
      navigation.navigate('EventDetail', { eventId: e.id });
    },
    [navigation, resolveTripWorkspaceId, teamId],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: EventSection }) => {
      if (section.key === 'past') {
        return (
          <Pressable onPress={() => setPastExpanded((x) => !x)} accessibilityRole="button">
            <SectionHeader title={`${section.title} [${section.count}]`} />
          </Pressable>
        );
      }
      return <SectionHeader title={`${section.title} [${section.count}]`} />;
    },
    [],
  );

  const renderSectionFooter = useCallback(
    ({ section }: { section: EventSection }) => {
      if (section.key === 'drafts' && section.data.length === 0) {
        return null;
      }
      if (section.key === 'upcoming' && section.data.length === 0) {
        const msg =
          role === 'coordinator'
            ? 'No upcoming events. Set up your next trip or match.'
            : 'Nothing scheduled yet. Your coordinator will add events here.';
        return (
          <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
            {msg}
          </Text>
        );
      }
      if (section.key === 'past' && pastExpanded && section.data.length === 0) {
        return (
          <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
            No past events yet.
          </Text>
        );
      }
      return null;
    },
    [pastExpanded, role],
  );

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={color.actionPrimary} />
        </View>
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="body" style={{ marginBottom: spacing.space12 }}>
            Something went wrong
          </Text>
          <Pressable onPress={() => void refetch()} style={{ padding: spacing.space8 }}>
            <Text variant="label" colorToken={color.actionPrimary}>
              Try again
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => void onOpenEvent(item)}
            onPublishTrip={role === 'coordinator' && item.type === 'trip' && item.status === 'draft' ? () => setPublishTarget(item) : undefined}
            isPublishing={publishMutation.isPending && publishTarget?.id === item.id}
          />
        )}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        ListEmptyComponent={
          <View
            style={{
              borderWidth: 1,
              borderColor: color.borderSubtle,
              backgroundColor: color.surfaceElevated,
              borderRadius: spacing.space12,
              padding: spacing.space24,
              alignItems: 'center',
            }}
          >
            <Icon name="calendar" size={40} color={color.actionPrimary} />
            <Text variant="body" style={{ marginTop: spacing.space12, textAlign: 'center' }}>
              No upcoming events
            </Text>
            <Text variant="label" colorToken={color.textSecondary} style={{ marginTop: spacing.space4, textAlign: 'center' }}>
              Create your next event to get started.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: spacing.space32 }}
      />
      <ConfirmationSheet
        visible={Boolean(publishTarget)}
        title="Publish this trip?"
        body="5 members will be notified"
        confirmLabel="Publish"
        cancelLabel="Review first"
        onConfirm={() => {
          if (!publishTarget) {
            return Promise.resolve();
          }
          return publishMutation.mutateAsync(publishTarget);
        }}
        onCancel={() => {
          if (!publishTarget) {
            setPublishTarget(null);
            return;
          }
          void (async () => {
            try {
              const twId = await resolveTripWorkspaceId(publishTarget);
              if (twId) {
                navigation.navigate('TripReview', { tripId: twId, eventId: publishTarget.id });
              }
            } finally {
              setPublishTarget(null);
            }
          })();
        }}
      />
    </ScreenContainer>
  );
}
