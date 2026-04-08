import bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { getEnv } from '../config/env';
import { prisma } from '../db/prisma';
import { signAccessToken } from '../utils/jwt';

/**
 * Security: operationalStatus / medicallyRestricted must never appear in Player-role
 * GET /events/:eventId/availability responses (see M5 requirements).
 */
let envForTest: ReturnType<typeof getEnv> | null = null;
try {
  envForTest = getEnv();
} catch {
  envForTest = null;
}

(envForTest ? describe : describe.skip)('availability player medical security (integration)', () => {
  let app: ReturnType<typeof createApp>;
  let env: ReturnType<typeof getEnv>;

  let teamId = '';
  let eventId = '';
  let coordUserId = '';
  let playerUserId = '';
  let player2UserId = '';
  let playerMemberId = '';

  beforeAll(async () => {
    if (!envForTest) {
      throw new Error('Missing env'); // should be skipped; defensive
    }
    env = envForTest;
    app = createApp(env);

    const suffix = `${String(Date.now())}_${Math.random().toString(36).slice(2, 9)}`;
    const passHash = await bcrypt.hash('Password123456!', 12);

    const coordUser = await prisma.user.create({
      data: {
        name: 'Coord',
        email: `coord_${suffix}@test.relay`,
        passwordHash: passHash,
      },
    });
    const playerUser = await prisma.user.create({
      data: {
        name: 'Player One',
        email: `p1_${suffix}@test.relay`,
        passwordHash: passHash,
      },
    });
    const player2User = await prisma.user.create({
      data: {
        name: 'Player Two',
        email: `p2_${suffix}@test.relay`,
        passwordHash: passHash,
      },
    });

    coordUserId = coordUser.id;
    playerUserId = playerUser.id;
    player2UserId = player2User.id;

    const team = await prisma.team.create({
      data: { name: `Team ${suffix}` },
    });
    teamId = team.id;

    const coordMember = await prisma.teamMember.create({
      data: {
        userId: coordUser.id,
        teamId: team.id,
        role: 'coordinator',
        onboardingState: 'active',
        joinedAt: new Date(),
      },
    });
    const p1 = await prisma.teamMember.create({
      data: {
        userId: playerUser.id,
        teamId: team.id,
        role: 'player',
        onboardingState: 'active',
        joinedAt: new Date(),
      },
    });
    await prisma.teamMember.create({
      data: {
        userId: player2User.id,
        teamId: team.id,
        role: 'player',
        onboardingState: 'active',
        joinedAt: new Date(),
      },
    });
    playerMemberId = p1.id;

    const event = await prisma.event.create({
      data: {
        teamId: team.id,
        type: 'match',
        name: 'Security Test Match',
        date: new Date('2026-07-15T12:00:00.000Z'),
        startTime: '19:00',
        status: 'active',
        createdBy: coordMember.id,
      },
    });
    eventId = event.id;
  }, 120_000);

  afterAll(async () => {
    try {
      if (eventId && teamId) {
        await prisma.availabilitySubmission.deleteMany({
          where: { availabilityWindow: { eventId } },
        });
        await prisma.availabilityWindow.deleteMany({ where: { eventId } });
      }
      if (teamId) {
        await prisma.event.deleteMany({ where: { teamId } });
        await prisma.teamMember.deleteMany({ where: { teamId } });
        await prisma.team.deleteMany({ where: { id: teamId } });
      }
      const userIds = [coordUserId, playerUserId, player2UserId].filter((id) => id.length > 0);
      if (userIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it('player GET /availability omits operational fields and never includes medicallyRestricted', async () => {
    const coordToken = signAccessToken(env, {
      userId: coordUserId,
      email: `coord@test.relay`,
    });
    const playerToken = signAccessToken(env, {
      userId: playerUserId,
      email: `p1@test.relay`,
    });
    const player2Token = signAccessToken(env, {
      userId: player2UserId,
      email: `p2@test.relay`,
    });

    await request(app)
      .post(`/events/${eventId}/availability/open`)
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(201);

    await request(app)
      .post(`/events/${eventId}/availability/submit`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ availabilityStatus: 'available' })
      .expect(200);

    await request(app)
      .post(`/events/${eventId}/availability/submit`)
      .set('Authorization', `Bearer ${player2Token}`)
      .send({ availabilityStatus: 'limited' })
      .expect(200);

    const rosterRes = await request(app)
      .get(`/events/${eventId}/availability`)
      .set('Authorization', `Bearer ${coordToken}`)
      .expect(200);

    interface SubRow {
      id: string;
      teamMemberId: string;
    }
    const rosterBody = rosterRes.body as { submissions: SubRow[] };
    const p1Row = rosterBody.submissions.find((s) => s.teamMemberId === playerMemberId);
    if (!p1Row) {
      throw new Error('expected player submission row');
    }
    const submissionId = p1Row.id;

    await request(app)
      .patch(`/events/${eventId}/availability/${submissionId}/operational`)
      .set('Authorization', `Bearer ${coordToken}`)
      .send({ operationalStatus: 'medicallyRestricted' })
      .expect(200);

    const playerGet = await request(app)
      .get(`/events/${eventId}/availability`)
      .set('Authorization', `Bearer ${playerToken}`)
      .expect(200);

    interface PlayerSub {
      teamMemberId: string;
      operationalStatus?: string;
      operationalStatusSetBy?: string | null;
    }
    const playerBody = playerGet.body as { submissions: PlayerSub[] };

    expect(playerGet.status).toBe(200);
    expect(Array.isArray(playerBody.submissions)).toBe(true);
    expect(playerBody.submissions.length).toBe(1);
    const playerSub = playerBody.submissions[0];
    if (!playerSub) {
      throw new Error('expected one submission for player');
    }
    expect(playerSub.teamMemberId).toBe(playerMemberId);
    expect(playerSub).not.toHaveProperty('operationalStatus');
    expect(playerSub).not.toHaveProperty('operationalStatusSetBy');

    const raw = JSON.stringify(playerBody);
    expect(raw).not.toContain('medicallyRestricted');

    console.log('SECURITY TEST PASSED');
  });
});
