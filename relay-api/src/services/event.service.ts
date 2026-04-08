import type { EventType } from '@prisma/client';
import { prisma } from '../db/prisma';
import { sendToMultiple } from './notification.service';
import { dispatchItineraryCriticalFieldNotifications } from './trip.service';

export interface CreateEventInput {
  type: EventType;
  name: string;
  date: Date;
  startTime: string;
  location?: string | null;
}

export interface PatchEventInput {
  name?: string;
  date?: Date;
  startTime?: string;
  location?: string | null;
}

export async function createTeamEvent(
  teamId: string,
  createdByMemberId: string,
  input: CreateEventInput,
): Promise<{ eventId: string; tripWorkspaceId: string | null }> {
  return prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        teamId,
        type: input.type,
        name: input.name.trim(),
        date: input.date,
        startTime: input.startTime.trim(),
        location: input.location?.trim() ?? null,
        status: 'draft',
        createdBy: createdByMemberId,
      },
    });

    if (input.type === 'trip') {
      const tw = await tx.tripWorkspace.create({
        data: { eventId: event.id },
      });
      const members = await tx.teamMember.findMany({
        where: { teamId, removedAt: null },
        select: { id: true },
      });
      if (members.length > 0) {
        await tx.tripSquadAssignment.createMany({
          data: members.map((m) => ({
            tripWorkspaceId: tw.id,
            teamMemberId: m.id,
            travelingStatus: 'unassigned' as const,
          })),
        });
      }
      return { eventId: event.id, tripWorkspaceId: tw.id };
    }

    return { eventId: event.id, tripWorkspaceId: null };
  });
}

export async function listTeamEventsChronological(teamId: string) {
  return prisma.event.findMany({
    where: { teamId },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
}

export async function getEventByIdForTeam(teamId: string, eventId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, teamId },
    include: { tripWorkspace: true },
  });
}

export type CancelTripResult = 'ok' | 'EVENT_NOT_FOUND' | 'NOT_TRIP' | 'ALREADY_CANCELLED';
export type PostponeTripResult =
  | { kind: 'ok'; tripWorkspaceId: string; previousVersion: number | null }
  | { kind: 'EVENT_NOT_FOUND' | 'NOT_TRIP' | 'ALREADY_TERMINAL' };

/**
 * Coordinator-only trip cancellation: irreversible; notifies all squad assignments (any traveling status).
 */
export async function cancelTripEvent(eventId: string): Promise<CancelTripResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { tripWorkspace: true },
  });
  if (!event) {
    return 'EVENT_NOT_FOUND';
  }
  if (event.type !== 'trip') {
    return 'NOT_TRIP';
  }
  if (event.status === 'cancelled') {
    return 'ALREADY_CANCELLED';
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { status: 'cancelled', cancelledAt: new Date() },
  });

  const tw = event.tripWorkspace;
  if (tw) {
    const rows = await prisma.tripSquadAssignment.findMany({
      where: { tripWorkspaceId: tw.id },
      include: {
        teamMember: {
          include: { user: { select: { pushToken: true } } },
        },
      },
    });
    const tokens = rows
      .map((r) => r.teamMember.user.pushToken)
      .filter((t): t is string => Boolean(t && t.length > 0));
    if (tokens.length > 0) {
      await sendToMultiple(tokens, {
        title: event.name,
        body: `${event.name} has been cancelled`,
        data: {
          deepLink: `relay://events/${eventId}`,
          type: 'TRIP_CANCELLED',
        },
      });
    }
  }

  return 'ok';
}

export async function patchTeamEvent(
  teamId: string,
  eventId: string,
  input: PatchEventInput,
): Promise<void> {
  const existing = await prisma.event.findFirst({
    where: { id: eventId, teamId },
    select: { id: true },
  });
  if (!existing) {
    throw new Error('EVENT_NOT_FOUND');
  }
  await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.date !== undefined ? { date: input.date } : {}),
      ...(input.startTime !== undefined ? { startTime: input.startTime.trim() } : {}),
      ...(input.location !== undefined ? { location: input.location?.trim() ?? null } : {}),
    },
  });
}

function parseIsoDateOnly(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

function parseNewDeparture(newDate?: string, newTime?: string): Date | null {
  if (!newDate && !newTime) {
    return null;
  }
  const date = newDate ?? new Date().toISOString().slice(0, 10);
  const time = newTime ?? '09:00';
  const out = new Date(`${date}T${time}:00.000Z`);
  if (Number.isNaN(out.getTime())) {
    throw new Error('BAD_DATETIME');
  }
  return out;
}

export async function postponeTripEvent(eventId: string, newDate?: string, newTime?: string): Promise<PostponeTripResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { tripWorkspace: true },
  });
  if (!event) {
    return { kind: 'EVENT_NOT_FOUND' };
  }
  if (event.type !== 'trip' || !event.tripWorkspace) {
    return { kind: 'NOT_TRIP' };
  }
  if (event.status === 'cancelled' || event.status === 'postponed') {
    return { kind: 'ALREADY_TERMINAL' };
  }

  const hasNew = newDate != null || newTime != null;
  const nextDeparture = hasNew ? parseNewDeparture(newDate, newTime) : null;
  const tripWorkspaceId = event.tripWorkspace.id;
  const currentItineraryVersion = event.tripWorkspace.itineraryVersion;

  const txOut = await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: event.id },
      data: {
        status: 'postponed',
        postponedAt: new Date(),
        ...(newDate ? { newDateAfterPostponement: parseIsoDateOnly(newDate) } : {}),
        ...(newTime ? { newTimeAfterPostponement: newTime } : {}),
      },
    });
    let previousVersion: number | null = null;
    if (hasNew && nextDeparture) {
      previousVersion = currentItineraryVersion;
      await tx.tripWorkspace.update({
        where: { id: tripWorkspaceId },
        data: {
          departureTime: nextDeparture,
          itineraryVersion: { increment: 1 },
        },
      });
    }
    return { previousVersion };
  });

  const rows = await prisma.tripSquadAssignment.findMany({
    where: { tripWorkspaceId },
    include: { teamMember: { include: { user: { select: { pushToken: true } } } } },
  });
  const tokens = rows.map((r) => r.teamMember.user.pushToken).filter((t): t is string => Boolean(t));
  if (tokens.length > 0) {
    await sendToMultiple(tokens, {
      title: event.name,
      body: hasNew
        ? `${event.name} has been postponed — tap to see updated details and re-confirm`
        : `${event.name} has been postponed — details will be updated soon`,
      data: { deepLink: `relay://trips/${tripWorkspaceId}`, type: 'TRIP_POSTPONED' },
    });
  }

  if (txOut.previousVersion !== null) {
    await dispatchItineraryCriticalFieldNotifications(tripWorkspaceId, event.name, txOut.previousVersion);
  }

  return { kind: 'ok', tripWorkspaceId, previousVersion: txOut.previousVersion };
}
