import { describe, expect, it } from 'vitest';
import { serializeAvailabilitySubmission } from './availability.serializer';
import { serializeTeamMember } from './member.serializer';

describe('serializeTeamMember', () => {
  const row = {
    id: 'tm1',
    userId: 'u1',
    teamId: 't1',
    role: 'player' as const,
    onboardingState: 'active' as const,
    jerseyNumber: null,
    customRoleLabel: null,
    invitedAt: new Date(),
    joinedAt: new Date(),
    name: 'P',
    email: 'p@x.com',
    phone: null,
    emergencyContactName: 'E',
    emergencyContactPhone: '1',
    emergencyAllergyAlert: null,
    emergencyStaffNote: null,
    emergencyInfoUpdatedAt: new Date(),
  };

  it('omits emergencyInfo for player viewer', () => {
    const json = JSON.stringify(serializeTeamMember('player', row));
    expect(json).not.toContain('emergencyInfo');
    expect(json).not.toContain('emergencyContactName');
  });

  it('includes emergencyInfo for coach viewer', () => {
    const out = serializeTeamMember('coach', row);
    expect(out.emergencyInfo).toBeDefined();
  });
});

describe('serializeAvailabilitySubmission', () => {
  const row = {
    id: 'a1',
    teamMemberId: 'tm1',
    memberName: 'P',
    availabilityStatus: 'available' as const,
    note: null,
    operationalStatus: 'medicallyRestricted' as const,
    operationalStatusSetBy: 'x',
    submittedAt: new Date(),
    updatedAt: new Date(),
    selectionNotificationSentAt: null,
  };

  it('omits operational fields and medicallyRestricted for player viewer', () => {
    const out = serializeAvailabilitySubmission('player', row, { selectionNotificationsSent: true });
    const json = JSON.stringify(out);
    expect(json).not.toContain('operationalStatus');
    expect(json).not.toContain('operationalStatusSetBy');
    expect(json).not.toContain('medicallyRestricted');
    expect(out.selectionOutcome).toBe('notSelected');
  });

  it('includes operationalStatus for coach viewer', () => {
    const out = serializeAvailabilitySubmission('coach', row);
    expect(out.operationalStatus).toBe('medicallyRestricted');
  });
});
