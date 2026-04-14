import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SquadRosterRow } from '@/components/data-display/SquadRosterRow';
import { Icon } from '@/components/foundation/Icon';
import { Text } from '@/components/foundation/Text';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ConfirmationSheet } from '@/components/overlay/ConfirmationSheet';
import { OperationalStatePicker } from '@/components/overlay/OperationalStatePicker';
import { useSendSelectionNotifications } from '@/mutations/useSendSelectionNotifications';
import { useSetOperationalStatus } from '@/mutations/useSetOperationalStatus';
import { useAvailability, type AvailabilitySubmissionDto } from '@/queries/useAvailability';
import { api } from '@/services/api';
import { useTeamStore } from '@/store/teamStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { EventsStackParamList } from '@/types/navigation';
import type { AvailabilityStatus, OperationalStatus, Role } from '@/types/models';

type AvailFilter = 'all' | AvailabilityStatus | 'notSubmitted';
type RoleFilter = 'all' | 'player' | 'staff';
const MIN_TOUCH_TARGET = 48; // WCAG minimum touch target

export function AvailabilityRosterScreen(): React.ReactElement {
  const route = useRoute<RouteProp<EventsStackParamList, 'AvailabilityRoster'>>();
  const { eventId } = route.params;
  const role = useTeamStore((s) => s.role);
  const queryClient = useQueryClient();

  const { data, isLoading } = useAvailability(eventId, { pollEvery30sWhileFocused: true });
  const setOp = useSetOperationalStatus(eventId);
  const sendNotify = useSendSelectionNotifications(eventId);
  const openWindow = useMutation({
    mutationFn: async () => {
      await api.post(`/events/${eventId}/availability/open`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['availability', eventId] });
    },
  });

  const [availFilter, setAvailFilter] = useState<AvailFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [pickerRow, setPickerRow] = useState<AvailabilitySubmissionDto | null>(null);
  const [confirmNotify, setConfirmNotify] = useState(false);

  const submissions = data?.submissions ?? [];

  const counts = useMemo(() => {
    let a = 0;
    let l = 0;
    let u = 0;
    let n = 0;
    for (const s of submissions) {
      if (s.availabilityStatus === null) {
        n += 1;
      } else if (s.availabilityStatus === 'available') {
        a += 1;
      } else if (s.availabilityStatus === 'limited') {
        l += 1;
      } else {
        u += 1;
      }
    }
    return { a, l, u, n };
  }, [submissions]);

  const notifyTargetCount = useMemo(
    () =>
      submissions.filter(
        (s) =>
          (s.memberRole ?? 'player') === 'player' &&
          s.operationalStatus !== undefined &&
          s.operationalStatus !== 'unassigned',
      ).length,
    [submissions],
  );

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const mr: Role = s.memberRole ?? 'player';
      if (roleFilter === 'player' && mr !== 'player') {
        return false;
      }
      if (roleFilter === 'staff' && mr !== 'staff') {
        return false;
      }
      if (availFilter === 'notSubmitted' && s.availabilityStatus !== null) {
        return false;
      }
      if (availFilter !== 'all' && availFilter !== 'notSubmitted' && s.availabilityStatus !== availFilter) {
        return false;
      }
      return true;
    });
  }, [availFilter, roleFilter, submissions]);

  const filterChip = useCallback(
    (label: string, active: boolean, onPress: () => void) => (
      <Pressable
        key={label}
        onPress={onPress}
        style={{
          paddingHorizontal: spacing.space12,
          paddingVertical: spacing.space8,
          marginRight: spacing.space8,
          borderRadius: spacing.space20,
          backgroundColor: active ? color.actionPrimary : color.surfaceInput,
        }}
      >
        <Text variant="caption" colorToken={active ? color.actionOnPrimary : color.textSecondary}>
          {label}
        </Text>
      </Pressable>
    ),
    [],
  );

  const onPickOperational = useCallback(
    (status: OperationalStatus) => {
      if (!pickerRow) {
        return;
      }
      setOp.mutate({ submissionId: pickerRow.id, operationalStatus: status });
    },
    [pickerRow, setOp],
  );

  if (role !== 'coordinator' && role !== 'coach') {
    return (
      <ScreenContainer scrollable>
        <Text variant="body" colorToken={color.textSecondary}>
          You don&apos;t have access to this screen.
        </Text>
      </ScreenContainer>
    );
  }

  if (isLoading && !data) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={color.actionPrimary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!data) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="body" style={{ marginBottom: spacing.space12 }}>
            Something went wrong
          </Text>
          <Pressable onPress={() => void queryClient.invalidateQueries({ queryKey: ['availability', eventId] })}>
            <Text variant="label" colorToken={color.actionPrimary}>Try again</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ flex: 1 }}>
        <Text variant="title" style={{ marginBottom: spacing.space8 }}>
          {`${String(counts.a)} Available  ${String(counts.l)} Limited  ${String(counts.u)} Unavailable  ${String(counts.n)} Not Submitted`}
        </Text>

        <Text variant="label" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
          Availability
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.space12 }}>
          {filterChip('All', availFilter === 'all', () => setAvailFilter('all'))}
          {filterChip('Available', availFilter === 'available', () => setAvailFilter('available'))}
          {filterChip('Limited', availFilter === 'limited', () => setAvailFilter('limited'))}
          {filterChip('Unavailable', availFilter === 'unavailable', () => setAvailFilter('unavailable'))}
          {filterChip('Not Submitted', availFilter === 'notSubmitted', () => setAvailFilter('notSubmitted'))}
        </View>

        <Text variant="label" colorToken={color.textSecondary} style={{ marginBottom: spacing.space8 }}>
          Role
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.space16 }}>
          {filterChip('All', roleFilter === 'all', () => setRoleFilter('all'))}
          {filterChip('Player', roleFilter === 'player', () => setRoleFilter('player'))}
          {filterChip('Staff', roleFilter === 'staff', () => setRoleFilter('staff'))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          getItemLayout={(_data, index) => ({ length: 72, offset: 72 * index, index })}
          removeClippedSubviews
          windowSize={7}
          maxToRenderPerBatch={10}
          initialNumToRender={12}
          renderItem={({ item }) => (
            <SquadRosterRow
              memberName={item.memberName}
              availabilityStatus={item.availabilityStatus}
              note={item.note}
              operationalStatus={item.operationalStatus ?? 'unassigned'}
              onPress={() => setPickerRow(item)}
            />
          )}
          ListEmptyComponent={
            <View
              style={{
                borderRadius: spacing.space12,
                borderWidth: 1,
                borderColor: color.borderSubtle,
                backgroundColor: color.surfaceElevated,
                padding: spacing.space24,
                alignItems: 'center',
              }}
            >
              <Icon name="team" size={40} color={color.actionPrimary} />
              <Text variant="body" style={{ textAlign: 'center', marginTop: spacing.space12 }}>No submissions yet</Text>
              <Text variant="label" colorToken={color.textSecondary} style={{ marginTop: spacing.space4, textAlign: 'center' }}>
                Player availability will appear here.
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      </View>
      {!data.window ? (
        <View style={{ position: 'absolute', left: spacing.space16, right: spacing.space16, bottom: spacing.space24 }}>
          <View
            style={{
              borderRadius: spacing.space12,
              borderWidth: 1,
              borderColor: color.borderSubtle,
              backgroundColor: color.surfaceElevated,
              padding: spacing.space16,
            }}
          >
            <Text variant="body" style={{ marginBottom: spacing.space8 }}>Availability window is not open.</Text>
            <Pressable onPress={() => openWindow.mutate()} style={{ paddingVertical: spacing.space8 }}>
              <Text variant="label" colorToken={color.actionPrimary}>Open window</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {notifyTargetCount > 0 ? (
        <View
          style={{
            position: 'absolute',
            left: spacing.space16,
            right: spacing.space16,
            bottom: spacing.space24,
          }}
        >
          <Pressable
            onPress={() => setConfirmNotify(true)}
            style={{
              minHeight: MIN_TOUCH_TARGET,
              borderRadius: spacing.space8,
              backgroundColor: color.actionPrimary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="label" colorToken={color.actionOnPrimary}>
              Send selection notifications
            </Text>
          </Pressable>
        </View>
      ) : null}

      <OperationalStatePicker
        visible={pickerRow !== null}
        onClose={() => setPickerRow(null)}
        memberName={pickerRow?.memberName ?? ''}
        current={pickerRow?.operationalStatus ?? 'unassigned'}
        viewerRole={role}
        onSelect={onPickOperational}
      />

      <ConfirmationSheet
        visible={confirmNotify}
        title="Send selection notifications?"
        body={`${String(notifyTargetCount)} players will be notified of their selection status.`}
        confirmLabel={`Notify ${String(notifyTargetCount)} players`}
        cancelLabel="Go back"
        onCancel={() => setConfirmNotify(false)}
        onConfirm={async () => {
          await sendNotify.mutateAsync();
          setConfirmNotify(false);
        }}
      />
    </ScreenContainer>
  );
}
