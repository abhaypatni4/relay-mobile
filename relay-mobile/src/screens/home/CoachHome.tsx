import type { CompositeNavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/foundation/Icon';
import { Text } from '@/components/foundation/Text';
import { eventStartDate } from '@/components/data-display/EventCard';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { fetchMe } from '@/services/session';
import { useTeamEvents, type ApiEventListItem } from '@/hooks/useTeamEvents';
import { useOpenAvailabilityWindow } from '@/mutations/useOpenAvailabilityWindow';
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
  const openWindow = useOpenAvailabilityWindow();
  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: fetchMe,
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  const now = Date.now();
  const firstName = useMemo(() => {
    const n = me?.user.name?.trim();
    if (!n) {
      return 'Coach';
    }
    const [first] = n.split(/\s+/);
    return first || 'Coach';
  }, [me?.user.name]);
  const nextUpcoming = useMemo(() => {
    const u = [...events]
      .filter((e) => eventStartDate(e).getTime() >= now)
      .sort((a, b) => eventStartDate(a).getTime() - eventStartDate(b).getTime());
    return u[0];
  }, [events, now]);

  const nextNonTrip = useMemo(() => {
    const u = [...events]
      .filter(
        (e) =>
          (e.type === 'match' || e.type === 'training') &&
          e.status === 'active' &&
          eventStartDate(e).getTime() >= now,
      )
      .sort((a, b) => eventStartDate(a).getTime() - eventStartDate(b).getTime());
    return u[0];
  }, [events, now]);

  const availQ = useAvailability(nextNonTrip?.id ?? null);
  const hasActiveAvailabilityWindow = Boolean(nextNonTrip && availQ.data?.window);
  const availabilityCounts = useMemo(() => {
    const rows = availQ.data?.submissions ?? [];
    let available = 0;
    let limited = 0;
    let unavailable = 0;
    let pending = 0;
    for (const row of rows) {
      if (row.availabilityStatus === 'available') {
        available += 1;
      } else if (row.availabilityStatus === 'limited') {
        limited += 1;
      } else if (row.availabilityStatus === 'unavailable') {
        unavailable += 1;
      } else {
        pending += 1;
      }
    }
    return { available, limited, unavailable, pending };
  }, [availQ.data?.submissions]);

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
    if (!nextNonTrip) {
      return;
    }
    navigation.navigate('EventsTab', {
      screen: 'AvailabilityRoster',
      params: { eventId: nextNonTrip.id },
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

      {nextUpcoming && nextUpcoming.type === 'trip' ? (
        <View style={{ marginBottom: spacing.space20 }}>
          <Text
            variant="caption"
            colorToken={color.textLabel}
            style={{ marginBottom: spacing.space8, letterSpacing: 1.2, textTransform: 'uppercase' }}
          >
            Active trip
          </Text>
          <Pressable
            onPress={() => openEvent(nextUpcoming)}
            style={{
              padding: spacing.space20,
              borderRadius: spacing.space12,
              backgroundColor: color.surfaceElevated,
              borderWidth: 1,
              borderColor: color.borderSubtle,
              borderLeftWidth: spacing.space4,
              borderLeftColor: color.actionPrimary,
              shadowColor: color.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: spacing.space8,
              elevation: 2,
            }}
          >
            <Text variant="title" style={{ fontWeight: '700', marginBottom: spacing.space8 }}>
              {nextUpcoming.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.space8 }}>
              <Icon name="calendar" size={spacing.space16} color={color.textSecondary} />
              <Text variant="caption" colorToken={color.textSecondary} style={{ marginLeft: spacing.space8 }}>
                {new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(
                  eventStartDate(nextUpcoming),
                )}
              </Text>
            </View>
            <Text variant="caption" colorToken={color.textLabel} style={{ letterSpacing: 0.8 }}>
              DEPARTURE
            </Text>
            <Text
              variant="title"
              colorToken={color.actionPrimary}
              style={{ fontWeight: '700', fontSize: 30, lineHeight: 36, marginBottom: spacing.space8 }}
            >
              {new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(eventStartDate(nextUpcoming))}
            </Text>
            <Text variant="body" colorToken={color.textSecondary}>
              📍 {nextUpcoming.location?.trim() ? nextUpcoming.location : 'Location not set'}
            </Text>
            <View style={{ alignItems: 'flex-end', marginTop: spacing.space8 }}>
              <Text variant="label" colorToken={color.textDisabled}>
                ›
              </Text>
            </View>
          </Pressable>
        </View>
      ) : null}

      {nextNonTrip ? (
        <View style={{ marginBottom: spacing.space20 }}>
          <Text
            variant="caption"
            colorToken={color.textLabel}
            style={{ marginBottom: spacing.space8, letterSpacing: 1.2, textTransform: 'uppercase' }}
          >
            Availability
          </Text>
          <Text variant="body" style={{ marginBottom: spacing.space12, fontWeight: '600' }}>
            {nextNonTrip.name}
          </Text>
          {!availQ.data?.window ? (
            <View
              style={{
                borderRadius: spacing.space12,
                backgroundColor: color.surfaceElevated,
                borderWidth: 1,
                borderColor: color.borderSubtle,
                padding: spacing.space16,
                marginBottom: spacing.space12,
              }}
            >
              <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
                Availability not opened yet
              </Text>
              <Pressable onPress={() => openWindow.mutate(nextNonTrip.id)} disabled={openWindow.isPending}>
                <Text variant="label" colorToken={color.actionPrimary}>
                  {openWindow.isPending ? 'Opening…' : 'Open availability'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', marginBottom: spacing.space12 }}>
                {[
                  { label: 'Available', value: availabilityCounts.available, dot: color.stateSuccess },
                  { label: 'Limited', value: availabilityCounts.limited, dot: color.stateWarning },
                  { label: 'Unavailable', value: availabilityCounts.unavailable, dot: color.stateError },
                  { label: 'Pending', value: availabilityCounts.pending, dot: color.textDisabled },
                ].map((chip) => (
                  <View
                    key={chip.label}
                    style={{
                      flex: 1,
                      borderRadius: spacing.space8,
                      backgroundColor: color.surfaceElevated,
                      borderWidth: 1,
                      borderColor: color.borderSubtle,
                      marginRight: chip.label === 'Pending' ? 0 : spacing.space8,
                      paddingVertical: spacing.space8,
                      alignItems: 'center',
                      shadowColor: color.shadow,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: spacing.space4,
                      elevation: 1,
                    }}
                  >
                    <View
                      style={{
                        width: spacing.space8,
                        height: spacing.space8,
                        borderRadius: spacing.space4,
                        backgroundColor: chip.dot,
                        marginBottom: spacing.space4,
                      }}
                    />
                    <Text variant="title" style={{ fontWeight: '700', marginBottom: spacing.space4 }}>
                      {chip.value}
                    </Text>
                    <Text variant="caption" colorToken={color.textSecondary}>
                      {chip.label}
                    </Text>
                  </View>
                ))}
              </View>
              <Pressable onPress={openRoster}>
                <Text variant="label" colorToken={color.actionPrimary}>
                  View full roster →
                </Text>
              </Pressable>
            </>
          )}
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
