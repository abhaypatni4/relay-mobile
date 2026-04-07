import type { Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { serializeAvailabilitySubmission } from '../serializers/availability.serializer';
import { serializeTeamMember } from '../serializers/member.serializer';

/**
 * Demo-only handlers to exercise serializers (M0-T05). Protected by auth + team + role.
 */
export const demoController = {
  sampleMember: (req: Request, res: Response): void => {
    const member = req.member;
    if (!member) {
      res.status(500).json({ error: 'Missing member context' });
      return;
    }
    const viewerRole = member.role;
    const tid = req.params.teamId;
    const teamId = Array.isArray(tid) ? tid[0] : tid;
    const row = {
      id: 'tm_demo',
      userId: 'u_demo',
      teamId: teamId ?? 'team_demo',
      role: 'player' as Role,
      onboardingState: 'active' as const,
      jerseyNumber: '12',
      customRoleLabel: null,
      invitedAt: new Date(),
      joinedAt: new Date(),
      name: 'Demo Player',
      email: 'demo@example.com',
      phone: null,
      emergencyContactName: 'Parent',
      emergencyContactPhone: '+15550001',
      emergencyAllergyAlert: 'nuts',
      emergencyStaffNote: null,
      emergencyInfoUpdatedAt: new Date(),
    };
    res.json(serializeTeamMember(viewerRole, row));
  },

  sampleAvailability: (req: Request, res: Response): void => {
    const member = req.member;
    if (!member) {
      res.status(500).json({ error: 'Missing member context' });
      return;
    }
    const viewerRole = member.role;
    const row = {
      id: 'as_demo',
      teamMemberId: 'tm_demo',
      memberName: 'Demo Player',
      availabilityStatus: 'available' as const,
      note: null,
      operationalStatus: 'medicallyRestricted' as const,
      operationalStatusSetBy: 'tm_staff',
      submittedAt: new Date(),
      updatedAt: new Date(),
      selectionNotificationSentAt: null,
    };
    res.json(serializeAvailabilitySubmission(viewerRole, row));
  },
};
