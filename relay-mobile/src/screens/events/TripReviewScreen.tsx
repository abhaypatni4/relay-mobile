import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api } from '@/services/api';
import { useTripDocuments } from '@/queries/useTripDocuments';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { EventsStackParamList } from '@/types/navigation';
import type { OnboardingState, TravelingStatus } from '@/types/models';

interface TripWorkspaceApi {
  departureTime: string | null;
  departureMeetingPoint: string | null;
}

interface SquadAssignmentRow {
  teamMemberId: string;
  travelingStatus: TravelingStatus;
  memberName: string;
  onboardingState: OnboardingState;
}

function formatDeparture(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function TripReviewScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<EventsStackParamList, 'TripReview'>>();
  const route = useRoute<RouteProp<EventsStackParamList, 'TripReview'>>();
  const { eventId } = route.params;
  const queryClient = useQueryClient();

  const { data: trip } = useQuery({
    queryKey: ['tripWorkspace', eventId],
    queryFn: async () => {
      const { data } = await api.get<TripWorkspaceApi>(`/events/${eventId}/trip`);
      return data;
    },
    enabled: Boolean(eventId),
  });

  const { data: squad = [] } = useQuery({
    queryKey: ['tripSquad', eventId],
    queryFn: async () => {
      const { data } = await api.get<{ assignments: SquadAssignmentRow[] }>(`/events/${eventId}/trip/squad`);
      return data.assignments;
    },
    enabled: Boolean(eventId),
  });

  const documentsQuery = useTripDocuments(eventId);
  const documentItemCount = useMemo(() => documentsQuery.data?.items?.length ?? 0, [documentsQuery.data?.items?.length]);

  const squadTravelingCount = useMemo(
    () => squad.filter((a) => a.travelingStatus === 'traveling').length,
    [squad],
  );

  const notifyCount = useMemo(
    () =>
      squad.filter((a) => a.travelingStatus === 'traveling' && a.onboardingState === 'active').length,
    [squad],
  );

  const pendingInSquad = useMemo(
    () => squad.some((a) => a.travelingStatus === 'traveling' && a.onboardingState !== 'active'),
    [squad],
  );

  const criticalOk = Boolean(trip?.departureTime?.trim() && trip?.departureMeetingPoint?.trim());

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');

  const onPublish = useCallback(async () => {
    setPublishError('');
    setPublishing(true);
    try {
      await api.post(`/events/${eventId}/trip/publish`);
      await queryClient.invalidateQueries({ queryKey: ['teamEvents'] });
      await queryClient.invalidateQueries({ queryKey: ['tripWorkspace', eventId] });
      navigation.navigate('EventsList');
    } catch {
      setPublishError('Could not publish. Check departure details and try again.');
    } finally {
      setPublishing(false);
    }
  }, [eventId, navigation, queryClient]);

  const onSaveDraft = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['teamEvents'] });
    navigation.navigate('EventsList');
  }, [navigation, queryClient]);

  return (
    <ScreenContainer scrollable>
      <Text variant="title" style={{ marginBottom: spacing.space16 }}>
        Review trip
      </Text>

      <View style={{ marginBottom: spacing.space12 }}>
        <Text variant="label" colorToken={color.textSecondary}>
          Departure time
        </Text>
        <Text variant="body">{formatDeparture(trip?.departureTime ?? null)}</Text>
      </View>
      <View style={{ marginBottom: spacing.space12 }}>
        <Text variant="label" colorToken={color.textSecondary}>
          Meeting point
        </Text>
        <Text variant="body">{trip?.departureMeetingPoint?.trim() ? trip.departureMeetingPoint : '—'}</Text>
      </View>
      <View style={{ marginBottom: spacing.space12 }}>
        <Text variant="label" colorToken={color.textSecondary}>
          Squad
        </Text>
        <Text variant="body">{squadTravelingCount} traveling</Text>
      </View>
      <View style={{ marginBottom: spacing.space24 }}>
        <Text variant="label" colorToken={color.textSecondary}>
          Push notifications
        </Text>
        <Text variant="body">{notifyCount} recipients (active members only)</Text>
      </View>

      <View style={{ marginBottom: spacing.space24 }}>
        <Text variant="label" colorToken={color.textSecondary}>
          Documents
        </Text>
        <Text variant="body">{documentItemCount} items</Text>
      </View>

      {pendingInSquad ? (
        <Text variant="caption" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
          Pending members in the squad will not receive trip notifications until they finish app setup.
        </Text>
      ) : null}

      {publishError ? (
        <Text variant="caption" colorToken={color.stateError} style={{ marginBottom: spacing.space12 }}>
          {publishError}
        </Text>
      ) : null}

      <LoadingButton
        label="Publish trip"
        isLoading={publishing}
        disabled={!criticalOk}
        onPress={() => void onPublish()}
      />
      <View style={{ height: spacing.space12 }} />
      <Pressable
        onPress={onSaveDraft}
        style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
        accessibilityRole="button"
      >
        <Text variant="label" colorToken={color.actionPrimary}>
          Save as draft
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
