import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { DateTimePickerField } from '@/components/input/DateTimePicker';
import { TextInput } from '@/components/input/TextInput';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { EventsStackParamList } from '@/types/navigation';
import type { EventType } from '@/types/models';

function toYmd(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function toHHmm(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const TYPES: { id: EventType; label: string }[] = [
  { id: 'trip', label: 'Trip' },
  { id: 'match', label: 'Match' },
  { id: 'training', label: 'Training' },
];

export function CreateEventScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('CreateEventScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<EventsStackParamList, 'CreateEvent'>>();
  const queryClient = useQueryClient();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const addToast = useUiStore((s) => s.addToast);
  const [eventType, setEventType] = useState<EventType>('trip');
  const [name, setName] = useState('');
  const [eventDateIso, setEventDateIso] = useState('');
  const [startTimeIso, setStartTimeIso] = useState('');
  const [location, setLocation] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const onContinue = useCallback(async () => {
    setSubmitError('');
    if (!teamId || !name.trim() || !eventDateIso || !startTimeIso) {
      return;
    }
    setLoading(true);
    try {
      const existingEvents = (queryClient.getQueryData(['teamEvents', teamId]) as Array<unknown> | undefined) ?? [];
      const isFirstEvent = existingEvents.length === 0;
      const { data } = await api.post<{
        event: { id: string };
        tripWorkspaceId: string | null;
      }>(`/teams/${teamId}/events`, {
        type: eventType,
        name: name.trim(),
        date: toYmd(eventDateIso),
        startTime: toHHmm(startTimeIso),
        location: location.trim() || null,
      });
      if (eventType === 'trip') {
        analytics.track('trip_created', {});
      }
      if (isFirstEvent) {
        analytics.track('first_event_created', {
          eventType,
          deltaFromTeamCreation: 0,
        });
      }
      if (eventType === 'trip' && data.tripWorkspaceId) {
        navigation.replace('EditItinerary', {
          tripId: data.tripWorkspaceId,
          eventId: data.event.id,
        });
        return;
      }
      if (eventType === 'match' || eventType === 'training') {
        addToast('success', `${eventType === 'match' ? 'Match' : 'Training'} created. Availability window is open.`);
        navigation.replace('EventDetail', { eventId: data.event.id });
        return;
      }
      navigation.navigate('EventsList');
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setSubmitError('Could not create event. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [addToast, eventDateIso, eventType, location, name, navigation, queryClient, startTimeIso, teamId]);

  return (
    <ScreenContainer scrollable>
      <Text variant="title" style={{ marginBottom: spacing.space16 }}>
        New event
      </Text>
      <Text variant="label" colorToken={color.textLabel} style={{ marginBottom: spacing.space8 }}>
        Event type
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.space24 }}>
        {TYPES.map((t) => {
          const selected = eventType === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setEventType(t.id)}
              style={{
                paddingVertical: spacing.space12,
                paddingHorizontal: spacing.space16,
                marginRight: spacing.space8,
                marginBottom: spacing.space8,
                borderRadius: radius.md,
                backgroundColor: selected ? color.actionPrimary : color.surfaceInput,
                minWidth: '28%',
              }}
            >
              <Text
                variant="label"
                colorToken={selected ? color.actionOnPrimary : color.textPrimary}
                style={{ textAlign: 'center' }}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {eventType === 'trip' ? (
        <TextInput label="Trip name" value={name} onChangeText={setName} autoCapitalize="words" />
      ) : (
        <TextInput label="Event name" value={name} onChangeText={setName} autoCapitalize="words" />
      )}
      <DateTimePickerField
        label="Event date"
        valueIso={eventDateIso}
        onChange={setEventDateIso}
        pickerMode="date"
      />
      <DateTimePickerField
        label="Start time"
        valueIso={startTimeIso}
        onChange={setStartTimeIso}
        pickerMode="time"
      />
      <TextInput label="Location" optional value={location} onChangeText={setLocation} />
      {submitError ? (
        <Text variant="caption" colorToken={color.stateError} style={{ marginBottom: spacing.space12 }}>
          {submitError}
        </Text>
      ) : null}
      <LoadingButton
        label="Continue"
        isLoading={loading}
        disabled={!name.trim() || !eventDateIso || !startTimeIso}
        onPress={() => void onContinue()}
      />
    </ScreenContainer>
  );
}
