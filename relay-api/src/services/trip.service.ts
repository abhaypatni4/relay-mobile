import type { Prisma, TravelingStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { sendToMultiple } from './notification.service';

function departureTimeChanged(a: Date | null, b: Date | null): boolean {
  const ta = a?.getTime() ?? null;
  const tb = b?.getTime() ?? null;
  return ta !== tb;
}

function meetingPointChanged(a: string | null, b: string | null): boolean {
  const na = (a ?? '').trim();
  const nb = (b ?? '').trim();
  return na !== nb;
}

export interface ItineraryPatchInput {
  departureTime?: string | null;
  departureMeetingPoint?: string | null;
  transportationNotes?: string | null;
  accommodationName?: string | null;
  accommodationAddress?: string | null;
  accommodationCheckInTime?: string | null;
  matchEventTime?: string | null;
  matchEventLocation?: string | null;
  returnDepartureTime?: string | null;
  returnDeparturePoint?: string | null;
  additionalNotes?: string | null;
}

function parseIsoDate(s: string | null | undefined): Date | null {
  if (s === undefined || s === null || s === '') {
    return null;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mergeItineraryData(
  current: Prisma.TripWorkspaceGetPayload<object>,
  patch: ItineraryPatchInput,
): Prisma.TripWorkspaceUpdateInput {
  const data: Prisma.TripWorkspaceUpdateInput = {};
  if (patch.departureTime !== undefined) {
    data.departureTime = parseIsoDate(patch.departureTime);
  }
  if (patch.departureMeetingPoint !== undefined) {
    data.departureMeetingPoint =
      patch.departureMeetingPoint === null || patch.departureMeetingPoint === ''
        ? null
        : patch.departureMeetingPoint.trim();
  }
  if (patch.transportationNotes !== undefined) {
    data.transportationNotes =
      patch.transportationNotes === null || patch.transportationNotes === ''
        ? null
        : patch.transportationNotes.trim();
  }
  if (patch.accommodationName !== undefined) {
    data.accommodationName =
      patch.accommodationName === null || patch.accommodationName === ''
        ? null
        : patch.accommodationName.trim();
  }
  if (patch.accommodationAddress !== undefined) {
    data.accommodationAddress =
      patch.accommodationAddress === null || patch.accommodationAddress === ''
        ? null
        : patch.accommodationAddress.trim();
  }
  if (patch.accommodationCheckInTime !== undefined) {
    data.accommodationCheckInTime = parseIsoDate(patch.accommodationCheckInTime);
  }
  if (patch.matchEventTime !== undefined) {
    data.matchEventTime = parseIsoDate(patch.matchEventTime);
  }
  if (patch.matchEventLocation !== undefined) {
    data.matchEventLocation =
      patch.matchEventLocation === null || patch.matchEventLocation === ''
        ? null
        : patch.matchEventLocation.trim();
  }
  if (patch.returnDepartureTime !== undefined) {
    data.returnDepartureTime = parseIsoDate(patch.returnDepartureTime);
  }
  if (patch.returnDeparturePoint !== undefined) {
    data.returnDeparturePoint =
      patch.returnDeparturePoint === null || patch.returnDeparturePoint === ''
        ? null
        : patch.returnDeparturePoint.trim();
  }
  if (patch.additionalNotes !== undefined) {
    data.additionalNotes =
      patch.additionalNotes === null || patch.additionalNotes === ''
        ? null
        : patch.additionalNotes.trim();
  }
  return data;
}

function resolvedDepartureTime(
  current: Date | null,
  patch: ItineraryPatchInput,
): Date | null {
  if (patch.departureTime !== undefined) {
    return parseIsoDate(patch.departureTime);
  }
  return current;
}

function resolvedMeetingPoint(current: string | null, patch: ItineraryPatchInput): string | null {
  if (patch.departureMeetingPoint !== undefined) {
    if (patch.departureMeetingPoint === null || patch.departureMeetingPoint === '') {
      return null;
    }
    return patch.departureMeetingPoint.trim();
  }
  return current;
}

export async function patchTripItineraryWithVersioning(
  eventId: string,
  patch: ItineraryPatchInput,
): Promise<{ previousVersion: number | null }> {
  const result = await prisma.$transaction(async (tx) => {
    const tw = await tx.tripWorkspace.findUnique({
      where: { eventId },
    });
    if (!tw) {
      throw new Error('TRIP_NOT_FOUND');
    }

    const newDep = resolvedDepartureTime(tw.departureTime, patch);
    const newMp = resolvedMeetingPoint(tw.departureMeetingPoint, patch);
    const criticalChanged =
      tw.isPublished &&
      (departureTimeChanged(tw.departureTime, newDep) || meetingPointChanged(tw.departureMeetingPoint, newMp));

    const prevVersion = tw.itineraryVersion;
    const data = mergeItineraryData(tw, patch);

    if (criticalChanged) {
      await tx.tripWorkspace.update({
        where: { eventId },
        data: {
          ...data,
          itineraryVersion: { increment: 1 },
        },
      });
      return { previousVersion: prevVersion };
    }

    await tx.tripWorkspace.update({
      where: { eventId },
      data,
    });
    return { previousVersion: null };
  });

  return result;
}

export async function dispatchItineraryCriticalFieldNotifications(
  tripWorkspaceId: string,
  eventName: string,
  previousVersion: number,
): Promise<void> {
  const rows = await prisma.tripSquadAssignment.findMany({
    where: {
      tripWorkspaceId,
      travelingStatus: 'traveling',
      acknowledgedItineraryVersion: previousVersion,
      teamMember: {
        onboardingState: 'active',
        removedAt: null,
      },
    },
    include: {
      teamMember: {
        include: { user: { select: { pushToken: true } } },
      },
    },
  });

  const tokens = rows
    .map((r) => r.teamMember.user.pushToken)
    .filter((t): t is string => Boolean(t && t.length > 0));

  if (tokens.length === 0) {
    return;
  }

  await sendToMultiple(tokens, {
    title: eventName,
    body: 'Departure time has changed — tap to re-confirm',
    data: {
      deepLink: `relay://trips/${tripWorkspaceId}?section=itinerary`,
      type: 'ITINERARY_CRITICAL_FIELD_CHANGED',
    },
  });
}

export async function getTripWorkspaceByEventId(eventId: string) {
  return prisma.tripWorkspace.findUnique({
    where: { eventId },
    include: {
      event: {
        select: {
          teamId: true,
          name: true,
          type: true,
          status: true,
          date: true,
          startTime: true,
          location: true,
        },
      },
    },
  });
}

export async function listTripSquadWithMembers(tripWorkspaceId: string) {
  return prisma.tripSquadAssignment.findMany({
    where: { tripWorkspaceId },
    include: {
      teamMember: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { assignedAt: 'asc' },
  });
}

export async function bulkPatchTripSquad(
  tripWorkspaceId: string,
  teamId: string,
  assignments: { teamMemberId: string; travelingStatus: TravelingStatus }[],
): Promise<void> {
  const memberIds = assignments.map((a) => a.teamMemberId);
  const valid = await prisma.teamMember.findMany({
    where: { id: { in: memberIds }, teamId, removedAt: null },
    select: { id: true },
  });
  const validSet = new Set(valid.map((v) => v.id));
  for (const a of assignments) {
    if (!validSet.has(a.teamMemberId)) {
      throw new Error('INVALID_MEMBER');
    }
  }

  await prisma.$transaction(
    assignments.map((a) =>
      prisma.tripSquadAssignment.updateMany({
        where: { tripWorkspaceId, teamMemberId: a.teamMemberId },
        data: { travelingStatus: a.travelingStatus },
      }),
    ),
  );
}

export async function publishTrip(
  eventId: string,
): Promise<{ tripWorkspaceId: string; teamName: string; eventName: string }> {
  const tw = await prisma.tripWorkspace.findUnique({
    where: { eventId },
    include: {
      event: {
        include: { team: { select: { name: true } } },
      },
    },
  });
  if (!tw) {
    throw new Error('TRIP_NOT_FOUND');
  }
  if (tw.event.type !== 'trip') {
    throw new Error('NOT_TRIP');
  }
  if (tw.departureTime === null || tw.departureMeetingPoint === null || tw.departureMeetingPoint.trim() === '') {
    throw new Error('PUBLISH_VALIDATION');
  }

  await prisma.tripWorkspace.update({
    where: { eventId },
    data: {
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  const traveling = await prisma.tripSquadAssignment.findMany({
    where: {
      tripWorkspaceId: tw.id,
      travelingStatus: 'traveling',
      teamMember: {
        onboardingState: 'active',
        removedAt: null,
      },
    },
    include: {
      teamMember: {
        include: { user: { select: { pushToken: true } } },
      },
    },
  });

  const tokens = traveling
    .map((r) => r.teamMember.user.pushToken)
    .filter((t): t is string => Boolean(t && t.length > 0));

  const teamName = tw.event.team.name;
  const eventName = tw.event.name;

  if (tokens.length > 0) {
    await sendToMultiple(tokens, {
      title: teamName,
      body: `You're on the ${eventName} trip — tap to see details`,
      data: {
        deepLink: `relay://trips/${tw.id}`,
        type: 'TRIP_PUBLISHED',
      },
    });
  }

  return { tripWorkspaceId: tw.id, teamName, eventName };
}
