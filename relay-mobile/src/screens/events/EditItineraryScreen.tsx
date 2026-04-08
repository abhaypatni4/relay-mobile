import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, UIManager, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { ConfirmationSheet } from '@/components/overlay/ConfirmationSheet';
import { DateTimePickerField } from '@/components/input/DateTimePicker';
import { TextInput } from '@/components/input/TextInput';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api } from '@/services/api';
import {
  clearItineraryDraft,
  loadItineraryDraft,
  saveItineraryDraft,
  type ItineraryDraftPayload,
} from '@/services/tripDraftStorage';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { EventsStackParamList } from '@/types/navigation';

interface TripWorkspaceApi {
  id: string;
  eventId: string;
  departureTime: string | null;
  departureMeetingPoint: string | null;
  transportationNotes: string | null;
  accommodationName: string | null;
  accommodationAddress: string | null;
  accommodationCheckInTime: string | null;
  matchEventTime: string | null;
  matchEventLocation: string | null;
  returnDepartureTime: string | null;
  returnDeparturePoint: string | null;
  additionalNotes: string | null;
  itineraryVersion: number;
  isPublished: boolean;
  publishedAt: string | null;
}

function toPayload(
  departureTime: string,
  meetingPoint: string,
  transportationNotes: string,
  accommodationName: string,
  accommodationAddress: string,
  accommodationCheckInTime: string,
  matchEventTime: string,
  matchEventLocation: string,
  returnDepartureTime: string,
  returnDeparturePoint: string,
  additionalNotes: string,
): ItineraryDraftPayload {
  return {
    departureTime: departureTime.trim() ? departureTime : null,
    departureMeetingPoint: meetingPoint,
    transportationNotes,
    accommodationName,
    accommodationAddress,
    accommodationCheckInTime,
    matchEventTime,
    matchEventLocation,
    returnDepartureTime,
    returnDeparturePoint,
    additionalNotes,
  };
}

export function EditItineraryScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<EventsStackParamList, 'EditItinerary'>>();
  const route = useRoute<RouteProp<EventsStackParamList, 'EditItinerary'>>();
  const { tripId, eventId } = route.params;

  const [hydrated, setHydrated] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);

  const [departureTime, setDepartureTime] = useState('');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [transportationNotes, setTransportationNotes] = useState('');
  const [accommodationName, setAccommodationName] = useState('');
  const [accommodationAddress, setAccommodationAddress] = useState('');
  const [accommodationCheckInTime, setAccommodationCheckInTime] = useState('');
  const [matchEventTime, setMatchEventTime] = useState('');
  const [matchEventLocation, setMatchEventLocation] = useState('');
  const [returnDepartureTime, setReturnDepartureTime] = useState('');
  const [returnDeparturePoint, setReturnDeparturePoint] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const skipResumeRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const applyServer = useCallback((t: TripWorkspaceApi) => {
    setDepartureTime(t.departureTime ?? '');
    setMeetingPoint(t.departureMeetingPoint ?? '');
    setTransportationNotes(t.transportationNotes ?? '');
    setAccommodationName(t.accommodationName ?? '');
    setAccommodationAddress(t.accommodationAddress ?? '');
    setAccommodationCheckInTime(t.accommodationCheckInTime ?? '');
    setMatchEventTime(t.matchEventTime ?? '');
    setMatchEventLocation(t.matchEventLocation ?? '');
    setReturnDepartureTime(t.returnDepartureTime ?? '');
    setReturnDeparturePoint(t.returnDeparturePoint ?? '');
    setAdditionalNotes(t.additionalNotes ?? '');
  }, []);

  const applyDraft = useCallback((d: ItineraryDraftPayload) => {
    setDepartureTime(d.departureTime ?? '');
    setMeetingPoint(d.departureMeetingPoint);
    setTransportationNotes(d.transportationNotes);
    setAccommodationName(d.accommodationName);
    setAccommodationAddress(d.accommodationAddress);
    setAccommodationCheckInTime(d.accommodationCheckInTime);
    setMatchEventTime(d.matchEventTime);
    setMatchEventLocation(d.matchEventLocation);
    setReturnDepartureTime(d.returnDepartureTime);
    setReturnDeparturePoint(d.returnDeparturePoint);
    setAdditionalNotes(d.additionalNotes);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await api.get<TripWorkspaceApi>(`/events/${eventId}/trip`);
        if (cancelled) {
          return;
        }
        applyServer(data);
        const draft = loadItineraryDraft(eventId);
        if (
          !skipResumeRef.current &&
          draft &&
          (draft.departureTime || draft.departureMeetingPoint.trim() || draft.transportationNotes.trim())
        ) {
          const serverEmpty = !data.departureTime && !(data.departureMeetingPoint ?? '').trim();
          if (serverEmpty) {
            setResumeOpen(true);
          }
        }
      } catch {
        /* empty */
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyServer, eventId]);

  const patchBody = useMemo(
    () => ({
      departureTime: departureTime.trim() || null,
      departureMeetingPoint: meetingPoint.trim() || null,
      transportationNotes: transportationNotes.trim() || null,
      accommodationName: accommodationName.trim() || null,
      accommodationAddress: accommodationAddress.trim() || null,
      accommodationCheckInTime: accommodationCheckInTime.trim() || null,
      matchEventTime: matchEventTime.trim() || null,
      matchEventLocation: matchEventLocation.trim() || null,
      returnDepartureTime: returnDepartureTime.trim() || null,
      returnDeparturePoint: returnDeparturePoint.trim() || null,
      additionalNotes: additionalNotes.trim() || null,
    }),
    [
      accommodationAddress,
      accommodationCheckInTime,
      accommodationName,
      additionalNotes,
      departureTime,
      matchEventLocation,
      matchEventTime,
      meetingPoint,
      returnDeparturePoint,
      returnDepartureTime,
      transportationNotes,
    ],
  );

  useEffect(() => {
    if (!hydrated || !dirty) {
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        try {
          await api.patch(`/events/${eventId}/trip/itinerary`, patchBody);
          saveItineraryDraft(eventId, toPayload(
            departureTime,
            meetingPoint,
            transportationNotes,
            accommodationName,
            accommodationAddress,
            accommodationCheckInTime,
            matchEventTime,
            matchEventLocation,
            returnDepartureTime,
            returnDeparturePoint,
            additionalNotes,
          ));
        } catch {
          /* offline / validation */
        }
      })();
    }, 2000);
    return () => clearTimeout(t);
  }, [hydrated, dirty, eventId, patchBody, departureTime, meetingPoint, transportationNotes, accommodationName, accommodationAddress, accommodationCheckInTime, matchEventTime, matchEventLocation, returnDepartureTime, returnDeparturePoint, additionalNotes]);

  const criticalOk = Boolean(departureTime.trim() && meetingPoint.trim());

  const onResume = useCallback(() => {
    const draft = loadItineraryDraft(eventId);
    if (draft) {
      applyDraft(draft);
    }
    setDirty(true);
    setResumeOpen(false);
  }, [applyDraft, eventId]);

  const onStartFresh = useCallback(() => {
    clearItineraryDraft(eventId);
    setResumeOpen(false);
    skipResumeRef.current = true;
    setDirty(false);
    void (async () => {
      try {
        const { data } = await api.get<TripWorkspaceApi>(`/events/${eventId}/trip`);
        applyServer(data);
      } catch {
        /* empty */
      }
    })();
  }, [applyServer, eventId]);

  const toggleExtras = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExtrasOpen((o) => !o);
  }, []);

  return (
    <ScreenContainer scrollable>
      <Text variant="title" style={{ marginBottom: spacing.space8 }}>
        Itinerary
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
        Departure time and meeting point are required before you can continue. Other details are optional.
      </Text>

      <Text variant="label" colorToken={color.stateError} style={{ marginBottom: spacing.space4 }}>
        Departure time (required)
      </Text>
      <DateTimePickerField
        label=""
        valueIso={departureTime}
        onChange={(v) => {
          setDirty(true);
          setDepartureTime(v);
        }}
        pickerMode="datetime"
      />

      <Text variant="label" colorToken={color.stateError} style={{ marginBottom: spacing.space4 }}>
        Departure meeting point (required)
      </Text>
      <TextInput
        label=""
        value={meetingPoint}
        onChangeText={(t) => {
          setDirty(true);
          setMeetingPoint(t);
        }}
        autoCapitalize="sentences"
      />

      <Pressable onPress={toggleExtras} style={{ marginVertical: spacing.space16 }}>
        <Text variant="label" colorToken={color.actionPrimary}>
          {extrasOpen ? 'Hide optional details' : 'Optional details'}
        </Text>
      </Pressable>

      {extrasOpen ? (
        <View>
          <TextInput
            label="Transportation notes"
            optional
            value={transportationNotes}
            onChangeText={(t) => {
              setDirty(true);
              setTransportationNotes(t);
            }}
            multiline
          />
          <TextInput
            label="Accommodation name"
            optional
            value={accommodationName}
            onChangeText={(t) => {
              setDirty(true);
              setAccommodationName(t);
            }}
          />
          <TextInput
            label="Accommodation address"
            optional
            value={accommodationAddress}
            onChangeText={(t) => {
              setDirty(true);
              setAccommodationAddress(t);
            }}
            multiline
          />
          <DateTimePickerField
            label="Accommodation check-in time"
            valueIso={accommodationCheckInTime}
            onChange={(v) => {
              setDirty(true);
              setAccommodationCheckInTime(v);
            }}
            optional
            pickerMode="datetime"
          />
          <DateTimePickerField
            label="Match or event time"
            valueIso={matchEventTime}
            onChange={(v) => {
              setDirty(true);
              setMatchEventTime(v);
            }}
            optional
            pickerMode="datetime"
          />
          <TextInput
            label="Match or event location"
            optional
            value={matchEventLocation}
            onChangeText={(t) => {
              setDirty(true);
              setMatchEventLocation(t);
            }}
          />
          <DateTimePickerField
            label="Return departure time"
            valueIso={returnDepartureTime}
            onChange={(v) => {
              setDirty(true);
              setReturnDepartureTime(v);
            }}
            optional
            pickerMode="datetime"
          />
          <TextInput
            label="Return departure point"
            optional
            value={returnDeparturePoint}
            onChangeText={(t) => {
              setDirty(true);
              setReturnDeparturePoint(t);
            }}
          />
          <TextInput
            label="Additional notes"
            optional
            value={additionalNotes}
            onChangeText={(t) => {
              setDirty(true);
              setAdditionalNotes(t);
            }}
            multiline
          />
        </View>
      ) : null}

      <LoadingButton
        label="Continue"
        isLoading={false}
        disabled={!criticalOk}
        onPress={() => navigation.navigate('SquadSelection', { tripId, eventId })}
      />

      <ConfirmationSheet
        visible={resumeOpen}
        title="Saved draft will replace empty fields"
        body="Resume applies your last saved progress to this trip. Starting fresh clears the saved draft."
        confirmLabel="Resume draft"
        cancelLabel="Start fresh"
        onConfirm={onResume}
        onCancel={onStartFresh}
      />
    </ScreenContainer>
  );
}
