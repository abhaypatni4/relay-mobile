import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import {
  deferEmergencyInfoReminder,
  getCurrentUserProfile,
  patchCurrentUser,
  patchEmergencyInfo,
  validateEmergencyPayload,
} from '../services/user-profile.service';

const pushTokenBody = z.object({
  pushToken: z.string().trim().min(1),
});

const patchMeBody = z.object({
  name: z.string().trim().min(1).optional(),
  role: z.enum(Role).optional(),
  customRoleLabel: z.string().trim().optional().nullable(),
  jerseyNumber: z.string().trim().optional().nullable(),
  teamId: z.string().trim().optional(),
});

const emergencyBody = z.object({
  contactName: z.unknown(),
  contactPhone: z.unknown(),
  allergyAlert: z.unknown(),
  staffNote: z.unknown().optional(),
});

const notificationPrefsBody = z.object({
  tripUpdates: z.boolean(),
  itineraryChanges: z.boolean(),
  availability: z.boolean(),
  selectionNotifications: z.boolean(),
  feedPostsRequired: z.boolean(),
  feedPostsGeneral: z.boolean(),
  reminders: z.boolean(),
  nudges: z.boolean(),
  urgentAlerts: z.boolean(),
});

const defaultPrefs = {
  tripUpdates: true,
  itineraryChanges: true,
  availability: true,
  selectionNotifications: true,
  feedPostsRequired: true,
  feedPostsGeneral: true,
  reminders: true,
  nudges: true,
  urgentAlerts: true,
};

export const usersController = {
  getMe: async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const profile = await getCurrentUserProfile(req.user.userId);
    res.json({
      user: {
        ...profile.user,
        emergencyInfoUpdatedAt: profile.user.emergencyInfoUpdatedAt?.toISOString() ?? null,
      },
      memberships: profile.memberships.map((m) => ({
        ...m,
      })),
    });
  },

  patchMe: async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const parsed = patchMeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    try {
      await patchCurrentUser(req.user.userId, parsed.data);
      const profile = await getCurrentUserProfile(req.user.userId);
      res.json({
        user: {
          ...profile.user,
          emergencyInfoUpdatedAt: profile.user.emergencyInfoUpdatedAt?.toISOString() ?? null,
        },
        memberships: profile.memberships,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'TEAM_NOT_FOUND') {
        res.status(404).json({ error: 'Team not found' });
        return;
      }
      if (msg === 'TEAM_ID_REQUIRED') {
        res.status(400).json({ error: 'teamId is required when updating role for multiple memberships' });
        return;
      }
      throw e;
    }
  },

  patchEmergencyInfo: async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const parsed = emergencyBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    const v = validateEmergencyPayload(parsed.data);
    if (!v.ok) {
      res.status(400).json({ error: 'Validation failed', fields: v.fields });
      return;
    }
    await patchEmergencyInfo(req.user.userId, v.data);
    const profile = await getCurrentUserProfile(req.user.userId);
    res.json({
      user: {
        ...profile.user,
        emergencyInfoUpdatedAt: profile.user.emergencyInfoUpdatedAt?.toISOString() ?? null,
      },
      memberships: profile.memberships,
    });
  },

  deferEmergencyReminder: async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await deferEmergencyInfoReminder(req.user.userId);
    res.status(204).send();
  },

  patchPushToken: async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const parsed = pushTokenBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { pushToken: parsed.data.pushToken },
    });
    res.status(204).send();
  },

  getNotificationPreferences: async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { notificationPreferences: true },
    });
    const prefs =
      user?.notificationPreferences && typeof user.notificationPreferences === 'object'
        ? { ...defaultPrefs, ...(user.notificationPreferences as Record<string, boolean>) }
        : defaultPrefs;
    res.status(200).json(prefs);
  },

  patchNotificationPreferences: async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const parsed = notificationPrefsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body' });
      return;
    }
    const data = {
      ...parsed.data,
      urgentAlerts: true,
    };
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { notificationPreferences: data },
    });
    res.status(200).json(data);
  },

  deleteMe: async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const now = new Date();
    const anonymizedEmail = `deleted+${req.user.userId}@relay.invalid`;
    const anonymizedPhone = `deleted-${req.user.userId}`;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: req.user!.userId },
        data: {
          deletionRequestedAt: now,
          name: 'Deleted User',
          email: anonymizedEmail,
          phone: anonymizedPhone,
          emergencyContactName: null,
          emergencyContactPhone: null,
          emergencyAllergyAlert: null,
          emergencyStaffNote: null,
          emergencyInfoUpdatedAt: null,
          pushToken: null,
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId: req.user!.userId, revokedAt: null },
        data: { revokedAt: now },
      });
    });

    const dueAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    console.info(
      `[account-deletion] user=${req.user.userId} requestedAt=${now.toISOString()} dueAt=${dueAt.toISOString()}`,
    );

    res.status(200).json({ message: 'Your account has been scheduled for deletion' });
  },
};
