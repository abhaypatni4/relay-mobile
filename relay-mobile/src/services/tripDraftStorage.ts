import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'relay-trip-itinerary-drafts' });

function key(eventId: string): string {
  return `itinerary-draft-${eventId}`;
}

export interface ItineraryDraftPayload {
  departureTime: string | null;
  departureMeetingPoint: string;
  transportationNotes: string;
  accommodationName: string;
  accommodationAddress: string;
  accommodationCheckInTime: string;
  matchEventTime: string;
  matchEventLocation: string;
  returnDepartureTime: string;
  returnDeparturePoint: string;
  additionalNotes: string;
}

export function loadItineraryDraft(eventId: string): ItineraryDraftPayload | null {
  const raw = storage.getString(key(eventId));
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as ItineraryDraftPayload;
  } catch {
    return null;
  }
}

export function saveItineraryDraft(eventId: string, payload: ItineraryDraftPayload): void {
  storage.set(key(eventId), JSON.stringify(payload));
}

export function clearItineraryDraft(eventId: string): void {
  storage.remove(key(eventId));
}
