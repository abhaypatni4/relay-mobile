import { prisma } from '../db/prisma';
import { sendToMultiple } from './notification.service';

const TRANSFER_TTL_MS = 48 * 60 * 60 * 1000;

function iso(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}

export async function getTransferForTeam(teamId: string, transferId: string) {
  const row = await prisma.coordinatorTransfer.findFirst({
    where: { id: transferId, teamId },
  });
  if (!row) {
    return null;
  }
  const [fromMember, toMember] = await Promise.all([
    prisma.teamMember.findUnique({ where: { id: row.fromMemberId }, include: { user: { select: { name: true } } } }),
    prisma.teamMember.findUnique({ where: { id: row.toMemberId }, include: { user: { select: { name: true } } } }),
  ]);
  return {
    id: row.id,
    teamId: row.teamId,
    fromMemberId: row.fromMemberId,
    fromMemberName: fromMember?.user.name ?? 'Member',
    toMemberId: row.toMemberId,
    toMemberName: toMember?.user.name ?? 'Member',
    status: row.status,
    initiatedAt: row.initiatedAt.toISOString(),
    respondedAt: iso(row.respondedAt),
    expiresAt: row.expiresAt.toISOString(),
  };
}

export async function getPendingTransferForTeam(teamId: string) {
  const row = await prisma.coordinatorTransfer.findFirst({
    where: { teamId, status: 'pending' },
    orderBy: { initiatedAt: 'desc' },
  });
  if (!row) {
    return null;
  }
  return getTransferForTeam(teamId, row.id);
}

export async function createTransfer(teamId: string, fromMemberId: string, toMemberId: string) {
  const [team, fromMember, toMember, pending] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId }, select: { id: true, name: true } }),
    prisma.teamMember.findUnique({
      where: { id: fromMemberId },
      include: { user: { select: { name: true } } },
    }),
    prisma.teamMember.findUnique({
      where: { id: toMemberId },
      include: { user: { select: { name: true, pushToken: true } } },
    }),
    prisma.coordinatorTransfer.findFirst({ where: { teamId, status: 'pending' }, select: { id: true } }),
  ]);
  if (!team || !fromMember || !toMember || fromMember.teamId !== teamId || toMember.teamId !== teamId) {
    return { ok: false as const, code: 'NOT_FOUND' as const };
  }
  if (fromMember.role !== 'coordinator') {
    return { ok: false as const, code: 'FORBIDDEN' as const };
  }
  if (toMember.onboardingState !== 'active' || toMember.removedAt !== null) {
    return { ok: false as const, code: 'TARGET_NOT_ACTIVE' as const };
  }
  if (pending) {
    return { ok: false as const, code: 'PENDING_EXISTS' as const };
  }

  const created = await prisma.coordinatorTransfer.create({
    data: {
      teamId,
      fromMemberId,
      toMemberId,
      status: 'pending',
      expiresAt: new Date(Date.now() + TRANSFER_TTL_MS),
    },
  });

  const token = toMember.user.pushToken;
  if (token) {
    await sendToMultiple([token], {
      title: team.name,
      body: `${fromMember.user.name} is inviting you to become coordinator for ${team.name}`,
      data: {
        deepLink: `relay://transfers/${created.id}`,
        type: 'COORDINATOR_TRANSFER_REQUEST',
      },
    });
  }

  const view = await getTransferForTeam(teamId, created.id);
  if (!view) {
    return { ok: false as const, code: 'NOT_FOUND' as const };
  }
  return { ok: true as const, transfer: view };
}

export async function respondToTransfer(input: {
  teamId: string;
  transferId: string;
  actingMemberId: string;
  action: 'accept' | 'decline';
}) {
  const { teamId, transferId, actingMemberId, action } = input;
  const row = await prisma.coordinatorTransfer.findFirst({ where: { id: transferId, teamId } });
  if (row?.toMemberId !== actingMemberId) {
    return { ok: false as const, code: 'FORBIDDEN' as const };
  }
  if (row.status !== 'pending' || row.expiresAt.getTime() <= Date.now()) {
    return { ok: false as const, code: 'NOT_VALID' as const };
  }

  if (action === 'decline') {
    const updated = await prisma.coordinatorTransfer.update({
      where: { id: row.id },
      data: { status: 'declined', respondedAt: new Date() },
    });
    const [team, fromMember] = await Promise.all([
      prisma.team.findUnique({ where: { id: teamId }, select: { name: true } }),
      prisma.teamMember.findUnique({
        where: { id: row.fromMemberId },
        include: { user: { select: { pushToken: true } } },
      }),
    ]);
    if (team && fromMember?.user.pushToken) {
      await sendToMultiple([fromMember.user.pushToken], {
        title: team.name,
        body: "Transfer was declined. You're still the coordinator.",
        data: { deepLink: `relay://team/settings`, type: 'COORDINATOR_TRANSFER_DECLINED' },
      });
    }
    const view = await getTransferForTeam(teamId, updated.id);
    if (!view) {
      return { ok: false as const, code: 'FORBIDDEN' as const };
    }
    return { ok: true as const, transfer: view };
  }

  const accepted = await prisma.$transaction(async (tx) => {
    await tx.teamMember.update({
      where: { id: row.fromMemberId },
      data: { role: 'coach' },
    });
    await tx.teamMember.update({
      where: { id: row.toMemberId },
      data: { role: 'coordinator' },
    });
    return tx.coordinatorTransfer.update({
      where: { id: row.id },
      data: { status: 'accepted', respondedAt: new Date() },
    });
  });

  const [team, fromMember, toMember] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId }, select: { name: true } }),
    prisma.teamMember.findUnique({
      where: { id: row.fromMemberId },
      include: { user: { select: { pushToken: true } } },
    }),
    prisma.teamMember.findUnique({
      where: { id: row.toMemberId },
      include: { user: { select: { pushToken: true } } },
    }),
  ]);

  if (team) {
    if (toMember?.user.pushToken) {
      await sendToMultiple([toMember.user.pushToken], {
        title: team.name,
        body: `You are now the coordinator for ${team.name}`,
        data: { deepLink: 'relay://home', type: 'COORDINATOR_TRANSFER_ACCEPTED' },
      });
    }
    if (fromMember?.user.pushToken) {
      await sendToMultiple([fromMember.user.pushToken], {
        title: team.name,
        body: 'Coordinator role transferred to your teammate',
        data: { deepLink: 'relay://team/settings', type: 'COORDINATOR_TRANSFER_COMPLETED' },
      });
    }
  }

  const view = await getTransferForTeam(teamId, accepted.id);
  if (!view) {
    return { ok: false as const, code: 'FORBIDDEN' as const };
  }
  return { ok: true as const, transfer: view };
}

export async function expirePendingTransfers() {
  const now = new Date();
  const rows = await prisma.coordinatorTransfer.findMany({
    where: { status: 'pending', expiresAt: { lt: now } },
  });
  for (const row of rows) {
    await prisma.coordinatorTransfer.update({
      where: { id: row.id },
      data: { status: 'expired' },
    });
    const [team, fromMember] = await Promise.all([
      prisma.team.findUnique({ where: { id: row.teamId }, select: { name: true } }),
      prisma.teamMember.findUnique({
        where: { id: row.fromMemberId },
        include: { user: { select: { pushToken: true } } },
      }),
    ]);
    if (team && fromMember?.user.pushToken) {
      await sendToMultiple([fromMember.user.pushToken], {
        title: team.name,
        body: 'Your coordinator transfer request has expired. You are still the coordinator.',
        data: { deepLink: 'relay://team/settings', type: 'COORDINATOR_TRANSFER_EXPIRED' },
      });
    }
  }
  return rows.length;
}

