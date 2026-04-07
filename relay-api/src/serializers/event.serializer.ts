import type { EventStatus, EventType } from '@prisma/client';
import type { JsonObject } from './base.serializer';

export function serializeEventBase(e: {
  id: string;
  teamId: string;
  type: EventType;
  name: string;
  date: Date;
  startTime: string;
  location: string | null;
  status: EventStatus;
  cancelledAt: Date | null;
  postponedAt: Date | null;
  newDateAfterPostponement: Date | null;
  newTimeAfterPostponement: string | null;
  createdBy: string;
  createdAt: Date;
}): JsonObject {
  return {
    id: e.id,
    teamId: e.teamId,
    type: e.type,
    name: e.name,
    date: e.date.toISOString().slice(0, 10),
    startTime: e.startTime,
    location: e.location,
    status: e.status,
    cancelledAt: e.cancelledAt?.toISOString() ?? null,
    postponedAt: e.postponedAt?.toISOString() ?? null,
    newDateAfterPostponement: e.newDateAfterPostponement?.toISOString().slice(0, 10) ?? null,
    newTimeAfterPostponement: e.newTimeAfterPostponement,
    createdBy: e.createdBy,
    createdAt: e.createdAt.toISOString(),
  };
}

export function serializeTripWorkspace(w: {
  id: string;
  eventId: string;
  departureTime: Date | null;
  departureMeetingPoint: string | null;
  transportationNotes: string | null;
  accommodationName: string | null;
  accommodationAddress: string | null;
  accommodationCheckInTime: Date | null;
  matchEventTime: Date | null;
  matchEventLocation: string | null;
  returnDepartureTime: Date | null;
  returnDeparturePoint: string | null;
  additionalNotes: string | null;
  itineraryVersion: number;
  isPublished: boolean;
  publishedAt: Date | null;
}): JsonObject {
  return {
    id: w.id,
    eventId: w.eventId,
    departureTime: w.departureTime?.toISOString() ?? null,
    departureMeetingPoint: w.departureMeetingPoint,
    transportationNotes: w.transportationNotes,
    accommodationName: w.accommodationName,
    accommodationAddress: w.accommodationAddress,
    accommodationCheckInTime: w.accommodationCheckInTime?.toISOString() ?? null,
    matchEventTime: w.matchEventTime?.toISOString() ?? null,
    matchEventLocation: w.matchEventLocation,
    returnDepartureTime: w.returnDepartureTime?.toISOString() ?? null,
    returnDeparturePoint: w.returnDeparturePoint,
    additionalNotes: w.additionalNotes,
    itineraryVersion: w.itineraryVersion,
    isPublished: w.isPublished,
    publishedAt: w.publishedAt?.toISOString() ?? null,
  };
}
