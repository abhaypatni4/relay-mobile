import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { Text } from '@/components/foundation/Text';
import { AvailabilityPicker } from '@/components/input/AvailabilityPicker';
import { TextAreaInput } from '@/components/input/TextAreaInput';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useSubmitAvailability } from '@/mutations/useSubmitAvailability';
import { useAvailability } from '@/queries/useAvailability';
import { api } from '@/services/api';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { EventsStackParamList } from '@/types/navigation';
import type { ApiEventListItem } from '@/hooks/useTeamEvents';
import type { AvailabilityStatus } from '@/types/models';

function formatEventDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
}

function statusLabel(s: AvailabilityStatus): string {
  switch (s) {
    case 'available':
      return 'Available';
    case 'limited':
      return 'Limited';
    case 'unavailable':
      return 'Unavailable';
    default:
      return s;
  }
}

export function AvailabilitySubmissionScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<EventsStackParamList, 'AvailabilitySubmission'>>();
  const route = useRoute<RouteProp<EventsStackParamList, 'AvailabilitySubmission'>>();
  const { eventId } = route.params;
  const teamId = useTeamStore((s) => s.activeTeamId);
  const isOffline = useUiStore((s) => s.isOffline);
  const insets = useSafeAreaInsets();
  const { teamMemberId } = useCurrentMember();

  const eventQuery = useQuery({
    queryKey: ['eventDetail', teamId, eventId],
    queryFn: async () => {
      const { data } = await api.get<ApiEventListItem>(`/teams/${teamId}/events/${eventId}`);
      return data;
    },
    enabled: Boolean(teamId && eventId),
  });

  const availabilityQuery = useAvailability(eventId);
  const submitMutation = useSubmitAvailability(eventId);

  const myRow = useMemo(
    () => availabilityQuery.data?.submissions.find((s) => s.teamMemberId === teamMemberId),
    [availabilityQuery.data?.submissions, teamMemberId],
  );

  const window = availabilityQuery.data?.window ?? null;
  const locked = Boolean(window?.isLocked);
  const noWindow =
    availabilityQuery.isSuccess && !availabilityQuery.data?.window && !availabilityQuery.isFetching;

  const [picker, setPicker] = useState<AvailabilityStatus | null>(null);
  const [note, setNote] = useState('');
  const [inlineConfirm, setInlineConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (myRow?.availabilityStatus) {
      setPicker(myRow.availabilityStatus);
    }
    if (myRow?.note) {
      setNote(myRow.note);
    }
  }, [myRow?.availabilityStatus, myRow?.note]);

  const closeAfterConfirm = useCallback(() => {
    setTimeout(() => {
      navigation.goBack();
    }, 2000);
  }, [navigation]);

  const onSubmit = useCallback(() => {
    if (isOffline || locked || !picker || !eventQuery.data) {
      return;
    }
    const evName = eventQuery.data.name;
    submitMutation.mutate(
      { availabilityStatus: picker, note: note.trim() ? note.trim() : null },
      {
        onSuccess: () => {
          setInlineConfirm(`Got it — ${statusLabel(picker)} noted for ${evName}`);
          closeAfterConfirm();
        },
      },
    );
  }, [closeAfterConfirm, eventQuery.data, isOffline, locked, note, picker, submitMutation]);

  const event = eventQuery.data;
  const submitDisabled = isOffline || !picker || submitMutation.isPending;

  if (noWindow) {
    return (
      <View style={{ flex: 1, padding: spacing.space16, backgroundColor: color.surfaceBase }}>
        <Text variant="body" colorToken={color.textSecondary}>
          Availability not yet open
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.surfaceBase }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.space16,
          paddingTop: spacing.space16,
          paddingBottom: insets.bottom + 120,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {event ? (
          <>
            <Text variant="title" style={{ marginBottom: spacing.space8 }}>
              {event.name}
            </Text>
            <Text variant="label" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
              {formatEventDate(event.date)} · {event.startTime}
            </Text>
          </>
        ) : (
          <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
            Loading event…
          </Text>
        )}

        {locked ? (
          <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space16 }}>
            Availability is locked
          </Text>
        ) : null}

        <AvailabilityPicker currentStatus={picker} onSelect={setPicker} isLocked={locked} />

        {locked && myRow?.availabilityStatus ? (
          <Text variant="body" style={{ marginBottom: spacing.space16 }}>
            Your status: {statusLabel(myRow.availabilityStatus)}
          </Text>
        ) : null}

        {!locked ? (
          <TextAreaInput
            placeholder="Add a note if helpful"
            value={note}
            onChangeText={setNote}
            maxLength={120}
          />
        ) : null}

        {inlineConfirm ? (
          <Text variant="body" colorToken={color.stateSuccess} style={{ marginBottom: spacing.space16 }}>
            {inlineConfirm}
          </Text>
        ) : null}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing.space16,
          paddingTop: spacing.space12,
          paddingBottom: Math.max(insets.bottom, spacing.space16),
          borderTopWidth: 1,
          borderTopColor: color.borderSubtle,
          backgroundColor: color.surfaceElevated,
        }}
      >
        {!locked && !inlineConfirm ? (
          isOffline ? (
            <View
              style={{
                minHeight: 48,
                borderRadius: radius.md,
                backgroundColor: color.surfaceInput,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="label" colorToken={color.textSecondary}>
                Available when connected
              </Text>
            </View>
          ) : (
            <LoadingButton
              label="Submit"
              isLoading={submitMutation.isPending}
              disabled={submitDisabled}
              onPress={() => onSubmit()}
            />
          )
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
