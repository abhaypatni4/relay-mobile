import type { DocumentApplicability, OnboardingState, Role } from '@prisma/client';
import { prisma } from '../db/prisma';
import { sendToMultiple } from './notification.service';

function isApplicableForMember(
  item: { applicability: DocumentApplicability; specificMemberIds: string[] },
  memberId: string,
  isTraveling: boolean,
): boolean {
  switch (item.applicability) {
    case 'allPlayers':
      return true;
    case 'travelingSquad':
      return isTraveling;
    case 'specific':
      return item.specificMemberIds.includes(memberId);
  }
}

async function getTripWorkspaceOrNull(eventId: string) {
  return prisma.tripWorkspace.findUnique({
    where: { eventId },
    include: {
      event: { select: { id: true, name: true, type: true, teamId: true } },
    },
  });
}

async function getOrCreateChecklist(tripWorkspaceId: string): Promise<string> {
  const existing = await prisma.documentChecklist.findUnique({
    where: { tripWorkspaceId },
    select: { id: true },
  });
  if (existing) {
    return existing.id;
  }
  const created = await prisma.documentChecklist.create({
    data: { tripWorkspaceId },
    select: { id: true },
  });
  return created.id;
}

async function travelingMemberIds(tripWorkspaceId: string): Promise<Set<string>> {
  const rows = await prisma.tripSquadAssignment.findMany({
    where: { tripWorkspaceId, travelingStatus: 'traveling' },
    select: { teamMemberId: true },
  });
  return new Set(rows.map((r) => r.teamMemberId));
}

async function applicableMemberIdsForItem(
  tripWorkspaceId: string,
  teamId: string,
  item: { applicability: DocumentApplicability; specificMemberIds: string[] },
): Promise<string[]> {
  const traveling = await travelingMemberIds(tripWorkspaceId);

  if (item.applicability === 'specific') {
    const rows = await prisma.teamMember.findMany({
      where: {
        teamId,
        removedAt: null,
        id: { in: item.specificMemberIds },
      },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  if (item.applicability === 'travelingSquad') {
    return Array.from(traveling);
  }

  // allPlayers
  const rows = await prisma.teamMember.findMany({
    where: { teamId, removedAt: null },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function addChecklistItem(
  eventId: string,
  actorMemberId: string,
  input: { name: string; applicability: DocumentApplicability; specificMemberIds: string[] },
): Promise<{ ok: true; itemId: string } | { ok: false; code: 'NOT_FOUND' | 'FORBIDDEN' }> {
  const tw = await prisma.tripWorkspace.findUnique({
    where: { eventId },
    include: { event: { select: { id: true, name: true, teamId: true, type: true } } },
  });
  if (tw?.event.type !== 'trip') {
    return { ok: false, code: 'NOT_FOUND' };
  }

  const actor = await prisma.teamMember.findUnique({
    where: { id: actorMemberId },
    select: { role: true, teamId: true },
  });
  if (actor?.teamId !== tw.event.teamId || actor.role !== 'coordinator') {
    return { ok: false, code: 'FORBIDDEN' };
  }

  const checklistId = await getOrCreateChecklist(tw.id);
  const item = await prisma.documentChecklistItem.create({
    data: {
      documentChecklistId: checklistId,
      name: input.name.trim(),
      applicability: input.applicability,
      specificMemberIds: input.specificMemberIds,
    },
    select: { id: true },
  });

  // If trip is already published: dispatch DOCUMENT_REMINDER to all applicable members.
  if (tw.isPublished) {
    const recipients = await applicableMemberIdsForItem(tw.id, tw.event.teamId, {
      applicability: input.applicability,
      specificMemberIds: input.specificMemberIds,
    });
    const rows = await prisma.teamMember.findMany({
      where: {
        id: { in: recipients },
        removedAt: null,
        onboardingState: 'active',
      },
      include: { user: { select: { pushToken: true } } },
    });
    const tokens = rows
      .map((r) => r.user.pushToken)
      .filter((t): t is string => Boolean(t && t.length > 0));
    if (tokens.length > 0) {
      await sendToMultiple(tokens, {
        title: tw.event.name,
        body: `A new document has been added to your checklist for ${tw.event.name}`,
        data: {
          deepLink: `relay://trips/${tw.id}?section=documents`,
          type: 'DOCUMENT_REMINDER',
        },
      });
    }
  }

  return { ok: true, itemId: item.id };
}

export async function listChecklistItems(
  eventId: string,
  viewer: { id: string; role: Role; onboardingState: OnboardingState },
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false }> {
  const tw = await prisma.tripWorkspace.findUnique({
    where: { eventId },
    include: {
      event: { select: { id: true, type: true, teamId: true } },
      documentChecklist: {
        include: {
          items: {
            include: {
              confirmations: {
                include: {
                  teamMember: { include: { user: { select: { name: true } } } },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });
  if (tw?.event.type !== 'trip') {
    return { ok: false };
  }

  const traveling = await travelingMemberIds(tw.id);
  const isTraveling = traveling.has(viewer.id);

  const items = tw.documentChecklist?.items ?? [];

  if (viewer.role === 'player') {
    const applicable = items.filter((it) =>
      isApplicableForMember(
        { applicability: it.applicability, specificMemberIds: it.specificMemberIds },
        viewer.id,
        isTraveling,
      ),
    );
    return {
      ok: true,
      body: {
        items: applicable.map((it) => {
          const conf = it.confirmations.find((c) => c.teamMemberId === viewer.id) ?? null;
          return {
            id: it.id,
            name: it.name,
            isConfirmedByCurrentUser: Boolean(conf),
            confirmedAt: conf?.confirmedAt.toISOString() ?? null,
          };
        }),
      },
    };
  }

  // Non-player: ALL items with aggregate status + confirmations array.
  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId: tw.event.teamId, removedAt: null },
    include: { user: { select: { name: true } } },
  });
  const nameById = new Map(teamMembers.map((m) => [m.id, m.user.name]));
  const onboardingById = new Map(teamMembers.map((m) => [m.id, m.onboardingState]));

  const mapped = [];
  for (const it of items) {
    const applicableIds = await applicableMemberIdsForItem(tw.id, tw.event.teamId, {
      applicability: it.applicability,
      specificMemberIds: it.specificMemberIds,
    });
    const confirmedAtByMember = new Map(
      it.confirmations.map((c) => [c.teamMemberId, c.confirmedAt] as const),
    );
    const confirmations = applicableIds.map((teamMemberId) => ({
      teamMemberId,
      memberName: nameById.get(teamMemberId) ?? 'Member',
      confirmedAt: confirmedAtByMember.get(teamMemberId)?.toISOString() ?? null,
      onboardingState: onboardingById.get(teamMemberId) ?? 'invited',
    }));
    mapped.push({
      id: it.id,
      name: it.name,
      applicability: it.applicability,
      specificMemberIds: it.specificMemberIds,
      confirmedCount: confirmations.filter((c) => c.confirmedAt !== null).length,
      totalApplicable: applicableIds.length,
      confirmations,
    });
  }

  return { ok: true, body: { items: mapped } };
}

export async function confirmChecklistItem(
  eventId: string,
  itemId: string,
  memberId: string,
): Promise<{ ok: true } | { ok: false; code: 'NOT_FOUND' | 'NOT_APPLICABLE' | 'FORBIDDEN' }> {
  const tw = await getTripWorkspaceOrNull(eventId);
  if (tw?.event.type !== 'trip') {
    return { ok: false, code: 'NOT_FOUND' };
  }
  const checklist = await prisma.documentChecklist.findUnique({
    where: { tripWorkspaceId: tw.id },
    include: {
      items: { where: { id: itemId }, include: { confirmations: true } },
    },
  });
  const item = checklist?.items[0];
  if (!item) {
    return { ok: false, code: 'NOT_FOUND' };
  }

  const traveling = await travelingMemberIds(tw.id);
  const applicable = isApplicableForMember(
    { applicability: item.applicability, specificMemberIds: item.specificMemberIds },
    memberId,
    traveling.has(memberId),
  );
  if (!applicable) {
    return { ok: false, code: 'NOT_APPLICABLE' };
  }

  // Idempotent create.
  await prisma.documentConfirmation.upsert({
    where: {
      checklistItemId_teamMemberId: { checklistItemId: item.id, teamMemberId: memberId },
    },
    create: { checklistItemId: item.id, teamMemberId: memberId },
    update: {},
  });
  return { ok: true };
}

export async function deleteChecklistItem(
  eventId: string,
  actorRole: Role,
  itemId: string,
): Promise<{ ok: true } | { ok: false; code: 'NOT_FOUND' | 'FORBIDDEN' }> {
  if (actorRole !== 'coordinator') {
    return { ok: false, code: 'FORBIDDEN' };
  }
  const tw = await getTripWorkspaceOrNull(eventId);
  if (tw?.event.type !== 'trip') {
    return { ok: false, code: 'NOT_FOUND' };
  }
  const checklist = await prisma.documentChecklist.findUnique({
    where: { tripWorkspaceId: tw.id },
    select: { id: true },
  });
  if (!checklist) {
    return { ok: false, code: 'NOT_FOUND' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.documentConfirmation.deleteMany({ where: { checklistItemId: itemId } });
    await tx.documentChecklistItem.deleteMany({
      where: { id: itemId, documentChecklistId: checklist.id },
    });
  });

  return { ok: true };
}

export async function remindOutstandingMembers(
  eventId: string,
  eventName: string,
): Promise<{ ok: true; remindedCount: number } | { ok: false }> {
  const tw = await getTripWorkspaceOrNull(eventId);
  if (tw?.event.type !== 'trip') {
    return { ok: false };
  }
  const checklist = await prisma.documentChecklist.findUnique({
    where: { tripWorkspaceId: tw.id },
    include: { items: { include: { confirmations: true } } },
  });
  const items = checklist?.items ?? [];
  if (items.length === 0) {
    return { ok: true, remindedCount: 0 };
  }

  const traveling = await travelingMemberIds(tw.id);
  const members = await prisma.teamMember.findMany({
    where: { teamId: tw.event.teamId, removedAt: null, onboardingState: 'active' },
    include: { user: { select: { pushToken: true } } },
  });

  const memberHasOutstanding = new Set<string>();

  for (const m of members) {
    const mIsTraveling = traveling.has(m.id);
    const applicableItems = items.filter((it) =>
      isApplicableForMember(
        { applicability: it.applicability, specificMemberIds: it.specificMemberIds },
        m.id,
        mIsTraveling,
      ),
    );
    if (applicableItems.length === 0) {
      continue;
    }
    const confirmedItemIds = new Set(
      items
        .flatMap((it) => it.confirmations.filter((c) => c.teamMemberId === m.id).map((c) => c.checklistItemId)),
    );
    for (const it of applicableItems) {
      if (!confirmedItemIds.has(it.id)) {
        memberHasOutstanding.add(m.id);
        break;
      }
    }
  }

  const recipients = members.filter((m) => memberHasOutstanding.has(m.id));
  const tokens = recipients
    .map((r) => r.user.pushToken)
    .filter((t): t is string => Boolean(t && t.length > 0));

  if (tokens.length > 0) {
    await sendToMultiple(tokens, {
      title: eventName,
      body: 'Complete your document checklist before departure',
      data: {
        deepLink: `relay://trips/${tw.id}?section=documents`,
        type: 'DOCUMENT_REMINDER',
      },
    });
  }

  return { ok: true, remindedCount: recipients.length };
}

