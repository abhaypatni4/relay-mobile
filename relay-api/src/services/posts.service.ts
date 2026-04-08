import type { DeliveryState, PostType, RecipientGroup, Role } from '@prisma/client';
import { prisma } from '../db/prisma';
import { sendToMultiple } from './notification.service';

function requiresAcknowledgmentForType(type: PostType): boolean {
  return type === 'scheduleUpdate' || type === 'urgentAlert';
}

function firstNChars(s: string, n: number): string {
  const trimmed = s.trim();
  if (trimmed.length <= n) {
    return trimmed;
  }
  return trimmed.slice(0, n);
}

async function loadTeamName(teamId: string): Promise<string> {
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } });
  return team?.name ?? 'Relay';
}

async function resolveRecipientMemberIds(teamId: string, recipientGroup: RecipientGroup): Promise<string[]> {
  if (recipientGroup === 'fullTeam') {
    const rows = await prisma.teamMember.findMany({
      where: { teamId, removedAt: null, onboardingState: 'active' },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  if (recipientGroup === 'coachingStaff') {
    const rows = await prisma.teamMember.findMany({
      where: {
        teamId,
        removedAt: null,
        onboardingState: 'active',
        role: { in: ['coach', 'coordinator'] },
      },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  if (recipientGroup === 'allStaff') {
    const rows = await prisma.teamMember.findMany({
      where: {
        teamId,
        removedAt: null,
        onboardingState: 'active',
        role: { in: ['staff', 'coordinator'] },
      },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  // travelingSquad
  const activeTripEvent = await prisma.event.findFirst({
    where: {
      teamId,
      type: 'trip',
      status: 'active',
      tripWorkspace: { isPublished: true },
    },
    include: { tripWorkspace: { select: { id: true } } },
    orderBy: { date: 'desc' },
  });
  const tripWorkspaceId = activeTripEvent?.tripWorkspace?.id;
  if (!tripWorkspaceId) {
    throw new Error('NO_ACTIVE_TRIP');
  }
  const rows = await prisma.tripSquadAssignment.findMany({
    where: {
      tripWorkspaceId,
      travelingStatus: 'traveling',
      teamMember: { removedAt: null, onboardingState: 'active' },
    },
    select: { teamMemberId: true },
  });
  return rows.map((r) => r.teamMemberId);
}

export async function createPost(
  teamId: string,
  creatorMemberId: string,
  input: {
    type: PostType;
    content: string;
    recipientGroup: RecipientGroup;
    eventId?: string | null;
    isUrgent?: boolean;
    isDraft?: boolean;
  },
): Promise<{ postId: string }> {
  const content = input.content.trim();
  if (content.length === 0 || content.length > 500) {
    throw new Error('INVALID_CONTENT');
  }
  const isDraft = input.isDraft ?? false;
  const requiresAcknowledgment = requiresAcknowledgmentForType(input.type);

  const post = await prisma.post.create({
    data: {
      teamId,
      eventId: input.eventId ?? null,
      type: input.type,
      content,
      recipientGroup: input.recipientGroup,
      isUrgent: Boolean(input.isUrgent),
      requiresAcknowledgment,
      createdBy: creatorMemberId,
      isDraft,
    },
    select: { id: true },
  });

  if (isDraft) {
    return { postId: post.id };
  }

  const recipientIds = await resolveRecipientMemberIds(teamId, input.recipientGroup);
  if (recipientIds.length > 0) {
    await prisma.postDeliveryState.createMany({
      data: recipientIds.map((teamMemberId) => ({
        postId: post.id,
        teamMemberId,
      })),
      skipDuplicates: true,
    });
  }

  // Dispatch notification to recipients (copy from docs/engineering/notifications-and-alerts.md)
  const recipients = await prisma.teamMember.findMany({
    where: { id: { in: recipientIds } },
    include: { user: { select: { pushToken: true, name: true } } },
  });
  const tokens = recipients
    .map((r) => r.user.pushToken)
    .filter((t): t is string => Boolean(t && t.length > 0));

  if (tokens.length > 0) {
    const teamName = await loadTeamName(teamId);
    const sender = await prisma.teamMember.findUnique({
      where: { id: creatorMemberId },
      include: { user: { select: { name: true } } },
    });
    const senderName = sender?.user.name ?? 'Coordinator';

    const body60 = firstNChars(content, 60);
    const notificationType =
      input.type === 'scheduleUpdate' || input.type === 'urgentAlert'
        ? 'POST_ACKNOWLEDGMENT_REQUIRED'
        : 'POST_GENERAL';

    const body =
      input.type === 'urgentAlert'
        ? `Urgent: ${body60}`
        : input.type === 'scheduleUpdate'
          ? `Schedule update: ${body60}`
          : `New update from ${senderName}: ${body60}`;

    await sendToMultiple(tokens, {
      title: teamName,
      body,
      data: {
        deepLink: `relay://posts/${post.id}`,
        type: notificationType,
        postId: post.id,
      },
    });
  }

  return { postId: post.id };
}

function isRecipientGroupAllowedForRole(role: Role, group: RecipientGroup): boolean {
  switch (group) {
    case 'fullTeam':
      return true;
    case 'travelingSquad':
      return true;
    case 'coachingStaff':
      return role === 'coach' || role === 'coordinator';
    case 'allStaff':
      return role === 'staff' || role === 'coordinator';
  }
}

export async function listPostsForMember(teamId: string, member: { id: string; role: Role }) {
  const posts = await prisma.post.findMany({
    where: {
      teamId,
      deletedAt: null,
      OR: [
        {
          isDraft: false,
          deliveryStates: { some: { teamMemberId: member.id } },
        },
        {
          isDraft: true,
          createdBy: member.id,
        },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      deliveryStates: {
        where: { teamMemberId: member.id },
        select: { deliveryState: true, acknowledgedAt: true },
      },
    },
  });

  // Prisma include cannot alias; do a separate creator name lookup in bulk.
  const creatorIds = Array.from(new Set(posts.map((p) => p.createdBy)));
  const creators = await prisma.teamMember.findMany({
    where: { id: { in: creatorIds } },
    include: { user: { select: { name: true } } },
  });
  const creatorNameById = new Map(creators.map((c) => [c.id, c.user.name]));

  // Aggregate delivery summary for coach/coordinator only.
  const needSummary = member.role === 'coordinator' || member.role === 'coach';
  const postIds = posts.filter((p) => !p.isDraft).map((p) => p.id);

  const grouped = needSummary
    ? await prisma.postDeliveryState.groupBy({
        by: ['postId', 'deliveryState'],
        where: { postId: { in: postIds } },
        _count: { _all: true },
      })
    : [];

  const countsByPostId = new Map<
    string,
    { sent: number; seen: number; acknowledged: number }
  >();
  for (const g of grouped) {
    const cur = countsByPostId.get(g.postId) ?? { sent: 0, seen: 0, acknowledged: 0 };
    cur.sent += g._count._all;
    if (g.deliveryState === 'seen' || g.deliveryState === 'acknowledged') {
      cur.seen += g._count._all;
    }
    if (g.deliveryState === 'acknowledged') {
      cur.acknowledged += g._count._all;
    }
    countsByPostId.set(g.postId, cur);
  }

  const now = new Date();

  return posts
    .filter((p) => (p.isDraft ? true : isRecipientGroupAllowedForRole(member.role, p.recipientGroup)))
    .map((p) => {
      const current = p.deliveryStates[0];
      const state: DeliveryState = current?.deliveryState ?? 'notSeen';
      const ackAt = current?.acknowledgedAt ?? null;
      const createdByName = creatorNameById.get(p.createdBy) ?? 'Coordinator';

      const base = {
        id: p.id,
        teamId: p.teamId,
        eventId: p.eventId,
        type: p.type,
        content: p.content,
        recipientGroup: p.recipientGroup,
        isUrgent: p.isUrgent,
        requiresAcknowledgment: p.requiresAcknowledgment,
        overdueThresholdHours: p.overdueThresholdHours,
        createdBy: p.createdBy,
        createdByName,
        createdAt: p.createdAt,
        deletedAt: p.deletedAt,
        currentUserDeliveryState: state,
        currentUserAcknowledgedAt: ackAt,
      };

      if (!needSummary || p.isDraft) {
        return base;
      }

      const c = countsByPostId.get(p.id) ?? { sent: 0, seen: 0, acknowledged: 0 };
      const overdueAt = new Date(p.createdAt.getTime() + p.overdueThresholdHours * 60 * 60 * 1000);
      const isOverdue = p.requiresAcknowledgment && overdueAt <= now;

      return {
        ...base,
        deliverySummary: {
          sentCount: c.sent,
          seenCount: c.seen,
          acknowledgedCount: c.acknowledged,
          overdueCount: isOverdue ? c.sent - c.acknowledged : 0,
        },
      };
    });
}

export async function getPostForMember(
  teamId: string,
  postId: string,
  member: { id: string; role: Role },
): Promise<
  | { kind: 'not_found' }
  | { kind: 'forbidden' }
  | {
      kind: 'ok';
      post: {
        id: string;
        teamId: string;
        eventId: string | null;
        type: PostType;
        content: string;
        recipientGroup: RecipientGroup;
        isUrgent: boolean;
        requiresAcknowledgment: boolean;
        overdueThresholdHours: number;
        createdBy: string;
        createdByName: string;
        createdAt: Date;
        deletedAt: Date | null;
        currentUserDeliveryState: DeliveryState;
        currentUserAcknowledgedAt: Date | null;
        deliverySummary?: {
          sentCount: number;
          seenCount: number;
          acknowledgedCount: number;
          overdueCount: number;
          overdueMembers?: {
            teamMemberId: string;
            memberName: string;
            lastNudgeSentAt: Date | null;
            canNudge: boolean;
          }[];
        };
      };
    }
> {
  const post = await prisma.post.findFirst({
    where: { id: postId, teamId, deletedAt: null },
  });
  if (!post) {
    return { kind: 'not_found' };
  }

  // Drafts are visible only to creator.
  if (post.isDraft) {
    if (post.createdBy !== member.id) {
      return { kind: 'forbidden' };
    }
  } else {
    const ds = await prisma.postDeliveryState.findUnique({
      where: { postId_teamMemberId: { postId: post.id, teamMemberId: member.id } },
      select: { deliveryState: true },
    });
    if (!ds) {
      return { kind: 'forbidden' };
    }
    if (!isRecipientGroupAllowedForRole(member.role, post.recipientGroup)) {
      return { kind: 'forbidden' };
    }
  }

  const creator = await prisma.teamMember.findUnique({
    where: { id: post.createdBy },
    include: { user: { select: { name: true } } },
  });
  const createdByName = creator?.user.name ?? 'Coordinator';

  let currentUserDeliveryState: DeliveryState = 'notSeen';
  let currentUserAcknowledgedAt: Date | null = null;

  if (!post.isDraft) {
    const ds = await prisma.postDeliveryState.findUnique({
      where: { postId_teamMemberId: { postId: post.id, teamMemberId: member.id } },
      select: { deliveryState: true, acknowledgedAt: true },
    });
    currentUserDeliveryState = ds?.deliveryState ?? 'notSeen';
    currentUserAcknowledgedAt = ds?.acknowledgedAt ?? null;

    // Mark seen if notSeen.
    if (currentUserDeliveryState === 'notSeen') {
      await prisma.postDeliveryState.update({
        where: { postId_teamMemberId: { postId: post.id, teamMemberId: member.id } },
        data: { deliveryState: 'seen', seenAt: new Date() },
      });
      currentUserDeliveryState = 'seen';
    }
  }

  const base = {
    id: post.id,
    teamId: post.teamId,
    eventId: post.eventId,
    type: post.type,
    content: post.content,
    recipientGroup: post.recipientGroup,
    isUrgent: post.isUrgent,
    requiresAcknowledgment: post.requiresAcknowledgment,
    overdueThresholdHours: post.overdueThresholdHours,
    createdBy: post.createdBy,
    createdByName,
    createdAt: post.createdAt,
    deletedAt: post.deletedAt,
    currentUserDeliveryState,
    currentUserAcknowledgedAt,
  };

  const needSummary = member.role === 'coordinator' || member.role === 'coach';
  if (!needSummary || post.isDraft) {
    return { kind: 'ok', post: base };
  }

  const grouped = await prisma.postDeliveryState.groupBy({
    by: ['deliveryState'],
    where: { postId: post.id },
    _count: { _all: true },
  });
  let sentCount = 0;
  let seenCount = 0;
  let acknowledgedCount = 0;
  for (const g of grouped) {
    sentCount += g._count._all;
    if (g.deliveryState === 'seen' || g.deliveryState === 'acknowledged') {
      seenCount += g._count._all;
    }
    if (g.deliveryState === 'acknowledged') {
      acknowledgedCount += g._count._all;
    }
  }

  const now = new Date();
  const overdueAt = new Date(post.createdAt.getTime() + post.overdueThresholdHours * 60 * 60 * 1000);
  const isOverdue = post.requiresAcknowledgment && overdueAt <= now;

  let overdueMembers:
    | {
        teamMemberId: string;
        memberName: string;
        lastNudgeSentAt: Date | null;
        canNudge: boolean;
      }[]
    | undefined;

  if (post.requiresAcknowledgment && isOverdue) {
    const unacked = await prisma.postDeliveryState.findMany({
      where: { postId: post.id, deliveryState: { not: 'acknowledged' } },
      include: { teamMember: { include: { user: { select: { name: true } } } } },
      orderBy: { teamMember: { user: { name: 'asc' } } },
    });
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    overdueMembers = unacked.map((r) => ({
      teamMemberId: r.teamMemberId,
      memberName: r.teamMember.user.name,
      lastNudgeSentAt: r.lastNudgeSentAt,
      canNudge: r.lastNudgeSentAt === null || r.lastNudgeSentAt < twentyFourHoursAgo,
    }));
  }

  return {
    kind: 'ok',
    post: {
      ...base,
      deliverySummary: {
        sentCount,
        seenCount,
        acknowledgedCount,
        overdueCount: isOverdue ? sentCount - acknowledgedCount : 0,
        overdueMembers: post.requiresAcknowledgment && isOverdue ? overdueMembers : undefined,
      },
    },
  };
}

export async function acknowledgePost(
  teamId: string,
  postId: string,
  memberId: string,
): Promise<
  | { kind: 'not_found' }
  | { kind: 'forbidden' }
  | { kind: 'not_required' }
  | { kind: 'ok' }
> {
  const post = await prisma.post.findFirst({ where: { id: postId, teamId, deletedAt: null } });
  if (!post) {
    return { kind: 'not_found' };
  }
  if (post.isDraft) {
    return { kind: 'forbidden' };
  }
  if (!post.requiresAcknowledgment) {
    return { kind: 'not_required' };
  }
  const ds = await prisma.postDeliveryState.findUnique({
    where: { postId_teamMemberId: { postId: post.id, teamMemberId: memberId } },
  });
  if (!ds) {
    return { kind: 'forbidden' };
  }
  if (ds.deliveryState === 'acknowledged') {
    return { kind: 'ok' };
  }
  const now = new Date();
  await prisma.postDeliveryState.update({
    where: { postId_teamMemberId: { postId: post.id, teamMemberId: memberId } },
    data: {
      deliveryState: 'acknowledged',
      acknowledgedAt: now,
      seenAt: ds.seenAt ?? now,
    },
  });
  return { kind: 'ok' };
}

export async function sendNudge(
  teamId: string,
  postId: string,
  actorRole: Role,
): Promise<{ kind: 'not_found' } | { kind: 'forbidden' } | { kind: 'not_required' } | { kind: 'ok'; nudgedCount: number }> {
  if (!(actorRole === 'coordinator' || actorRole === 'coach')) {
    return { kind: 'forbidden' };
  }
  const post = await prisma.post.findFirst({
    where: { id: postId, teamId, deletedAt: null },
  });
  if (!post) {
    return { kind: 'not_found' };
  }
  if (!post.requiresAcknowledgment) {
    return { kind: 'not_required' };
  }
  if (post.isDraft) {
    return { kind: 'forbidden' };
  }
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const eligible = await prisma.postDeliveryState.findMany({
    where: {
      postId: post.id,
      deliveryState: { not: 'acknowledged' },
      OR: [{ lastNudgeSentAt: null }, { lastNudgeSentAt: { lt: twentyFourHoursAgo } }],
      teamMember: { removedAt: null, onboardingState: 'active' },
    },
    include: { teamMember: { include: { user: { select: { pushToken: true, name: true } } } } },
  });

  const nudgedCount = eligible.length;
  if (nudgedCount === 0) {
    return { kind: 'ok', nudgedCount: 0 };
  }

  const teamName = await loadTeamName(teamId);
  const body40 = firstNChars(post.content, 40);

  const tokens = eligible
    .map((r) => r.teamMember.user.pushToken)
    .filter((t): t is string => Boolean(t && t.length > 0));
  if (tokens.length > 0) {
    await sendToMultiple(tokens, {
      title: teamName,
      body: `You haven't confirmed: ${body40}`,
      data: {
        deepLink: `relay://posts/${post.id}`,
        type: 'ACKNOWLEDGMENT_NUDGE',
        postId: post.id,
      },
    });
  }

  await prisma.postDeliveryState.updateMany({
    where: { id: { in: eligible.map((e) => e.id) } },
    data: {
      lastNudgeSentAt: now,
      nudgeCount: { increment: 1 },
    },
  });

  return { kind: 'ok', nudgedCount };
}

export async function deletePost(
  teamId: string,
  postId: string,
  member: { id: string; role: Role },
): Promise<{ kind: 'not_found' } | { kind: 'forbidden' } | { kind: 'ok'; notified: boolean }> {
  const post = await prisma.post.findFirst({ where: { id: postId, teamId, deletedAt: null } });
  if (!post) {
    return { kind: 'not_found' };
  }
  const now = new Date();
  const graceEndsAt = new Date(post.createdAt.getTime() + 5 * 60 * 1000);
  const withinGrace = now < graceEndsAt;

  if (withinGrace) {
    if (post.createdBy !== member.id) {
      return { kind: 'forbidden' };
    }
    await prisma.post.update({ where: { id: post.id }, data: { deletedAt: now } });
    return { kind: 'ok', notified: false };
  }

  if (member.role !== 'coordinator') {
    return { kind: 'forbidden' };
  }

  await prisma.post.update({ where: { id: post.id }, data: { deletedAt: now } });

  const recipients = await prisma.postDeliveryState.findMany({
    where: { postId: post.id },
    include: { teamMember: { include: { user: { select: { pushToken: true } } } } },
  });
  const tokens = recipients
    .map((r) => r.teamMember.user.pushToken)
    .filter((t): t is string => Boolean(t && t.length > 0));

  if (tokens.length > 0) {
    const teamName = await loadTeamName(teamId);
    await sendToMultiple(tokens, {
      title: teamName,
      body: 'A post was removed by the coordinator',
      data: {
        deepLink: `relay://posts/${post.id}`,
        type: 'POST_GENERAL',
        postId: post.id,
      },
    });
  }

  return { kind: 'ok', notified: true };
}

