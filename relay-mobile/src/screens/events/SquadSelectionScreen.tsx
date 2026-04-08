import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Switch, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useTeamMembers, type TeamRosterMemberRow } from '@/hooks/useTeamMembers';
import { useTeamStore } from '@/store/teamStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { EventsStackParamList } from '@/types/navigation';
import type { TravelingStatus } from '@/types/models';

interface SquadAssignmentRow {
  teamMemberId: string;
  travelingStatus: TravelingStatus;
  memberName: string;
  memberRole: string;
  onboardingState?: string;
}

export function SquadSelectionScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('SquadSelectionScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<EventsStackParamList, 'SquadSelection'>>();
  const route = useRoute<RouteProp<EventsStackParamList, 'SquadSelection'>>();
  const { tripId, eventId } = route.params;
  const teamId = useTeamStore((s) => s.activeTeamId);

  const { data: roster = [], isLoading: rosterLoading } = useTeamMembers(teamId);
  const { data: squadData, isLoading: squadLoading } = useQuery({
    queryKey: ['tripSquad', eventId],
    queryFn: async () => {
      const { data } = await api.get<{ assignments: SquadAssignmentRow[] }>(`/events/${eventId}/trip/squad`);
      return data.assignments;
    },
    enabled: Boolean(eventId),
  });

  const [statusByMemberId, setStatusByMemberId] = useState<Record<string, TravelingStatus>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!roster.length || !squadData) {
      return;
    }
    const next: Record<string, TravelingStatus> = {};
    for (const m of roster) {
      const a = squadData.find((x) => x.teamMemberId === m.id);
      next[m.id] = a?.travelingStatus ?? 'unassigned';
    }
    setStatusByMemberId(next);
  }, [roster, squadData]);

  const selectAll = useCallback(() => {
    setStatusByMemberId((prev) => {
      const o = { ...prev };
      for (const m of roster) {
        o[m.id] = 'traveling';
      }
      return o;
    });
  }, [roster]);

  const deselectAll = useCallback(() => {
    setStatusByMemberId((prev) => {
      const o = { ...prev };
      for (const m of roster) {
        o[m.id] = 'notTraveling';
      }
      return o;
    });
  }, [roster]);

  const toggleMember = useCallback((memberId: string) => {
    setStatusByMemberId((prev) => {
      const cur = prev[memberId] ?? 'unassigned';
      const next: TravelingStatus = cur === 'traveling' ? 'notTraveling' : 'traveling';
      return { ...prev, [memberId]: next };
    });
  }, []);

  const onContinue = useCallback(async () => {
    setSaving(true);
    try {
      const assignments = roster.map((m) => ({
        teamMemberId: m.id,
        travelingStatus: statusByMemberId[m.id] ?? 'unassigned',
      }));
      await api.patch(`/events/${eventId}/trip/squad`, { assignments });
      navigation.navigate('TripReview', { tripId, eventId });
    } catch {
      /* toast optional */
    } finally {
      setSaving(false);
    }
  }, [eventId, navigation, roster, statusByMemberId, tripId]);

  const rows = useMemo(() => [...roster].sort((a, b) => a.name.localeCompare(b.name)), [roster]);

  const renderItem = useCallback(
    ({ item }: { item: TeamRosterMemberRow }) => {
      const st = statusByMemberId[item.id] ?? 'unassigned';
      const traveling = st === 'traveling';
      const pending = item.onboardingState !== undefined && item.onboardingState !== 'active';
      return (
        <Pressable
          onPress={() => toggleMember(item.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: spacing.space12,
            borderBottomWidth: 1,
            borderBottomColor: color.borderSubtle,
          }}
        >
          <View style={{ flex: 1, marginRight: spacing.space12 }}>
            <Text variant="body">{item.name}</Text>
            <Text variant="caption" colorToken={color.textSecondary}>
              {item.customRoleLabel ?? item.role}
            </Text>
            {pending ? (
              <Text variant="caption" colorToken={color.textSecondary} style={{ marginTop: spacing.space4 }}>
                Awaiting app setup
              </Text>
            ) : null}
          </View>
          <Switch
            value={traveling}
            onValueChange={() => toggleMember(item.id)}
            accessibilityLabel={`Traveling for ${item.name}`}
          />
        </Pressable>
      );
    },
    [statusByMemberId, toggleMember],
  );

  const loading = rosterLoading || squadLoading;

  const listHeader = useMemo(
    () => (
      <View>
        <Text variant="title" style={{ marginBottom: spacing.space8 }}>
          Traveling squad
        </Text>
        <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space16 }}>
          Tap a row to mark who is traveling. You can continue with no one selected.
        </Text>
        <View style={{ flexDirection: 'row', marginBottom: spacing.space12 }}>
          <Pressable onPress={selectAll} accessibilityRole="button" style={{ marginRight: spacing.space16 }}>
            <Text variant="label" colorToken={color.actionPrimary}>
              Select all
            </Text>
          </Pressable>
          <Pressable onPress={deselectAll} accessibilityRole="button">
            <Text variant="label" colorToken={color.actionPrimary}>
              Deselect all
            </Text>
          </Pressable>
        </View>
      </View>
    ),
    [deselectAll, selectAll],
  );

  const listFooter = useMemo(
    () => (
      <View style={{ marginTop: spacing.space24, paddingBottom: spacing.space24 }}>
        <LoadingButton label="Continue" isLoading={saving} disabled={loading} onPress={() => void onContinue()} />
      </View>
    ),
    [loading, onContinue, saving],
  );

  return (
    <ScreenContainer>
      {loading ? (
        <View style={{ flex: 1 }}>
          {listHeader}
          <Text variant="body" colorToken={color.textSecondary}>
            Loading…
          </Text>
          {listFooter}
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={rows}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </ScreenContainer>
  );
}
