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
import type { ApiEventListItem } from '@/hooks/useTeamEvents';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { EventsStackParamList } from '@/types/navigation';

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
}

export function EventDetailScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<EventsStackParamList, 'EventDetail'>>();
  const route = useRoute<RouteProp<EventsStackParamList, 'EventDetail'>>();
  const { eventId } = route.params;
  const teamId = useTeamStore((s) => s.activeTeamId);
  const addToast = useUiStore((s) => s.addToast);
  const handled404 = useRef(false);

  const q = useQuery({
    queryKey: ['eventDetail', teamId, eventId],
    queryFn: async () => {
      const { data } = await api.get<ApiEventListItem & { tripWorkspace?: { id: string } }>(
        `/teams/${teamId}/events/${eventId}`,
      );
      return data;
    },
    enabled: Boolean(teamId && eventId),
  });

  useEffect(() => {
    const d = q.data;
    if (d?.type === 'trip' && d.tripWorkspace?.id) {
      navigation.replace('TripDetail', { tripId: d.tripWorkspace.id, eventId: d.id });
    }
  }, [navigation, q.data]);

  useEffect(() => {
    if (handled404.current) {
      return;
    }
    if (q.isError && axios.isAxiosError(q.error) && q.error.response?.status === 404) {
      handled404.current = true;
      addToast('error', 'This event is no longer available.');
      navigation.navigate('EventsList');
    }
  }, [addToast, navigation, q.error, q.isError]);

  if (q.isError) {
    const st = axios.isAxiosError(q.error) ? q.error.response?.status : undefined;
    if (st === 404) {
      return <View style={{ flex: 1 }} />;
    }
    return (
      <ScreenContainer scrollable>
        <Text variant="body">Could not load this event.</Text>
      </ScreenContainer>
    );
  }

  if (q.isPending || !q.data) {
    return (
      <ScreenContainer scrollable>
        <SkeletonLoader variant="card" style={{ marginBottom: spacing.space12 }} />
        <SkeletonLoader variant="card" />
      </ScreenContainer>
    );
  }

  const d = q.data;
  if (d.type === 'trip' && d.tripWorkspace?.id) {
    return (
      <ScreenContainer scrollable>
        <SkeletonLoader variant="card" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <Text variant="display" style={{ marginBottom: spacing.space8 }}>
        {d.name}
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space16 }}>
        {formatDate(d.date)} · {d.startTime}
      </Text>
      {d.location ? (
        <Text variant="body" colorToken={color.textSecondary}>
          {d.location}
        </Text>
      ) : (
        <View />
      )}
    </ScreenContainer>
  );
}
