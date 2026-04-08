import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { SkeletonLoader } from '@/components/feedback/SkeletonLoader';
import { EventCard, eventStartDate } from '@/components/data-display/EventCard';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api } from '@/services/api';
import { useTeamEvents, type ApiEventListItem } from '@/hooks/useTeamEvents';
import { useTeamStore } from '@/store/teamStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { EventsStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'EventsList'>;

interface EventSection {
  key: 'upcoming' | 'past';
  title: string;
  count: number;
  data: ApiEventListItem[];
}

export function EventsListScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const role = useTeamStore((s) => s.role);
  const { data: teamEventsData, isLoading, refetch, isRefetching } = useTeamEvents(teamId);

  const [pastExpanded, setPastExpanded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight:
        role === 'coordinator'
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

  const { upcoming, past } = useMemo(() => {
    const list = teamEventsData ?? [];
    const now = new Date();
    const u: ApiEventListItem[] = [];
    const p: ApiEventListItem[] = [];
    for (const e of list) {
      if (eventStartDate(e) >= now) {
        u.push(e);
      } else {
        p.push(e);
      }
    }
    return { upcoming: u, past: p };
  }, [teamEventsData]);

  const sections: EventSection[] = useMemo(
    () => [
      { key: 'upcoming', title: 'Upcoming', count: upcoming.length, data: upcoming },
      {
        key: 'past',
        title: 'Past',
        count: past.length,
        data: pastExpanded ? past : [],
      },
    ],
    [past, pastExpanded, upcoming],
  );

  const onOpenEvent = useCallback(
    async (e: ApiEventListItem) => {
      if (!teamId) {
        return;
      }
      if (e.type === 'trip') {
        try {
          const { data } = await api.get<ApiEventListItem & { tripWorkspace?: { id: string } }>(
            `/teams/${teamId}/events/${e.id}`,
          );
          const tw = data.tripWorkspace;
          if (tw?.id) {
            navigation.navigate('TripDetail', { tripId: tw.id, eventId: data.id });
          }
        } catch {
          /* empty */
        }
        return;
      }
      navigation.navigate('EventDetail', { eventId: e.id });
    },
    [navigation, teamId],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: EventSection }) => {
      if (section.key === 'past') {
        return (
          <Pressable onPress={() => setPastExpanded((x) => !x)} accessibilityRole="button">
            <SectionHeader title={section.title} count={section.count} />
          </Pressable>
        );
      }
      return <SectionHeader title={section.title} count={section.count} />;
    },
    [],
  );

  const renderSectionFooter = useCallback(
    ({ section }: { section: EventSection }) => {
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
      <ScreenContainer scrollable>
        <SectionHeader title="Upcoming" count={0} />
        <SkeletonLoader variant="card" style={{ marginBottom: spacing.space12 }} />
        <SkeletonLoader variant="card" style={{ marginBottom: spacing.space12 }} />
        <SkeletonLoader variant="card" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} onPress={() => void onOpenEvent(item)} />}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        contentContainerStyle={{ paddingBottom: spacing.space32 }}
      />
    </ScreenContainer>
  );
}
