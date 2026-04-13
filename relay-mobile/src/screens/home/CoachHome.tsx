import type { CompositeNavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/foundation/Icon';
import { Text } from '@/components/foundation/Text';
import { CardContainer } from '@/components/layout/CardContainer';
import { eventStartDate } from '@/components/data-display/EventCard';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { fetchMe } from '@/services/session';
import { useTeamEvents, type ApiEventListItem } from '@/hooks/useTeamEvents';
import { useAvailability } from '@/queries/useAvailability';
import { useAuthStore } from '@/store/authStore';
import { useTeamStore } from '@/store/teamStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { HomeStackParamList, MainTabParamList } from '@/types/navigation';

type HomeNav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Home'>,
  BottomTabNavigationProp<MainTabParamList>
>;

export function CoachHome(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('CoachHome');
    }, []),
  );

  const navigation = useNavigation<HomeNav>();
  const userId = useAuthStore((s) => s.userId);
  const teamId = useTeamStore((s) => s.activeTeamId);
  const { data: events = [], isLoading } = useTeamEvents(teamId);
  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: fetchMe,
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  const firstName = useMemo(() => {
    const n = me?.user.name?.trim();
    if (!n) {
      return 'Coach';
    }
    const [first] = n.split(/\s+/);
    return first || 'Coach';
  }, [me?.user.name]);
  const nextTrip = events.find((e) => e.type === 'trip' && e.status === 'active');
  const nextMatchTraining = events.find(
    (e) => (e.type === 'match' || e.type === 'training') && e.status === 'active',
  );

  const availQ = useAvailability(nextMatchTraining?.id ?? null);
  const hasActiveAvailabilityWindow = Boolean(nextMatchTraining && availQ.data?.window);

  const openEvent = (e: ApiEventListItem) => {
    if (e.type === 'trip') {
      void (async () => {
        try {
          const { data } = await api.get<ApiEventListItem & { tripWorkspace?: { id: string } }>(
            `/teams/${teamId}/events/${e.id}`,
          );
          if (data.tripWorkspace?.id) {
            navigation.navigate('EventsTab', {
              screen: 'TripDetail',
              params: { tripId: data.tripWorkspace.id, eventId: data.id },
            });
          }
        } catch {
          /* empty */
        }
      })();
      return;
    }
    navigation.navigate('EventsTab', { screen: 'EventDetail', params: { eventId: e.id } });
  };

  const openRoster = () => {
    if (!nextMatchTraining) {
      return;
    }
    navigation.navigate('EventsTab', {
      screen: 'AvailabilityRoster',
      params: { eventId: nextMatchTraining.id },
    });
  };

  if (isLoading) {
    return (
      <View style={{ padding: spacing.space16 }}>
        <Text variant="body" colorToken={color.textSecondary}>
          Loading…
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: spacing.space16, backgroundColor: color.surfaceBase }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.space16 }}>
        <Text variant="title">Hey, {firstName}</Text>
        <View
          style={{
            width: spacing.space32,
            height: spacing.space32,
            borderRadius: spacing.space16,
            borderWidth: 1,
            borderColor: color.borderDefault,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: color.surfaceElevated,
          }}
        >
          <Text variant="label" style={{ fontSize: spacing.space16 }}>
            🔔
          </Text>
          <View
            style={{
              position: 'absolute',
              top: -spacing.space4,
              right: -spacing.space4,
              minWidth: spacing.space16,
              height: spacing.space16,
              borderRadius: spacing.space8,
              backgroundColor: color.stateWarning,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: spacing.space4,
            }}
          >
            <Text variant="caption" colorToken={color.actionOnPrimary}>
              0
            </Text>
          </View>
        </View>
      </View>

      {nextTrip ? (
        <View style={{ marginBottom: spacing.space16 }}>
          <Text
            variant="caption"
            colorToken={color.textLabel}
            style={{ marginBottom: spacing.space8, letterSpacing: 1.2, textTransform: 'uppercase' }}
          >
            Upcoming trip
          </Text>
          <CardContainer
            pressable
            onPress={() => openEvent(nextTrip)}
            style={{
              borderWidth: 1,
              borderColor: color.borderSubtle,
              borderLeftWidth: spacing.space4,
              borderLeftColor: color.actionPrimary,
            }}
          >
            <Text variant="title" style={{ fontWeight: '700', marginBottom: spacing.space8 }}>
              {nextTrip.name}
            </Text>
            <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space4 }}>
              {new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(
                eventStartDate(nextTrip),
              )}
            </Text>
            {nextTrip.startTime?.trim() ? (
              <Text variant="caption" colorToken={color.textSecondary}>
                {`Departure: ${new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(eventStartDate(nextTrip))}`}
              </Text>
            ) : null}
          </CardContainer>
        </View>
      ) : null}

      {nextMatchTraining ? (
        <View style={{ marginBottom: spacing.space16 }}>
          <Text
            variant="caption"
            colorToken={color.textLabel}
            style={{ marginBottom: spacing.space8, letterSpacing: 1.2, textTransform: 'uppercase' }}
          >
            Next match / training
          </Text>
          <CardContainer
            pressable
            onPress={() => openEvent(nextMatchTraining)}
            style={{
              borderWidth: 1,
              borderColor: color.borderSubtle,
              borderLeftWidth: spacing.space4,
              borderLeftColor: color.actionPrimary,
            }}
          >
            <Text variant="title" style={{ fontWeight: '700', marginBottom: spacing.space8 }}>
              {nextMatchTraining.name}
            </Text>
            <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
              {new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(
                eventStartDate(nextMatchTraining),
              )}
            </Text>
            <Text variant="body" colorToken={color.textSecondary}>
              {availQ.data?.window ? 'Availability open' : 'No availability window'}
            </Text>
          </CardContainer>
        </View>
      ) : (
        <View
          style={{
            marginTop: spacing.space16,
            padding: spacing.space20,
            borderRadius: spacing.space12,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: color.borderDefault,
            backgroundColor: color.surfaceInput,
            alignItems: 'center',
          }}
        >
          <Icon name="calendar" size={spacing.space24} color={color.textDisabled} />
          <Text variant="label" colorToken={color.textSecondary} style={{ marginTop: spacing.space12 }}>
            No upcoming matches or training
          </Text>
          <Text variant="caption" colorToken={color.textLabel} style={{ marginTop: spacing.space4 }}>
            Trips and events will appear here
          </Text>
        </View>
      )}

      <View style={{ marginTop: spacing.space20 }}>
        <Text
          variant="caption"
          colorToken={color.textLabel}
          style={{ marginBottom: spacing.space8, letterSpacing: 1.2, textTransform: 'uppercase' }}
        >
          Squad
        </Text>
        <Pressable
          onPress={hasActiveAvailabilityWindow ? openRoster : undefined}
          disabled={!hasActiveAvailabilityWindow}
          style={{
            minHeight: 56,
            borderRadius: spacing.space12,
            borderWidth: 1,
            borderColor: color.borderSubtle,
            backgroundColor: color.surfaceElevated,
            paddingHorizontal: spacing.space16,
            paddingVertical: spacing.space12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: hasActiveAvailabilityWindow ? 1 : 0.65,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="team" size={spacing.space20} color={hasActiveAvailabilityWindow ? color.actionPrimary : color.textDisabled} />
            <Text
              variant="label"
              colorToken={hasActiveAvailabilityWindow ? color.actionPrimary : color.textSecondary}
              style={{ marginLeft: spacing.space8 }}
            >
              {hasActiveAvailabilityWindow ? 'View availability roster' : 'No active availability window'}
            </Text>
          </View>
          <Text variant="label" colorToken={hasActiveAvailabilityWindow ? color.actionPrimary : color.textDisabled}>
            ›
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
