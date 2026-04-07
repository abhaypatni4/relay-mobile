import type { Role } from '@/types/models';
import {
  canAccessTeamSettings,
  canCreatePosts,
  canManageTrip,
  canSetMedicallyRestricted,
  canSetOperationalStatus,
  canViewAllAvailability,
  canViewDeliveryStates,
  canViewEmergencyInfo,
} from './roles';

const roles: Role[] = ['coordinator', 'coach', 'staff', 'player'];

describe('role helpers', () => {
  it('canCreatePosts — coordinator and coach only', () => {
    expect(roles.filter(canCreatePosts)).toEqual(['coordinator', 'coach']);
  });

  it('canViewDeliveryStates — coordinator and coach only', () => {
    expect(roles.filter(canViewDeliveryStates)).toEqual(['coordinator', 'coach']);
  });

  it('canSetOperationalStatus — coordinator and coach only', () => {
    expect(roles.filter(canSetOperationalStatus)).toEqual(['coordinator', 'coach']);
  });

  it('canSetMedicallyRestricted — coordinator and staff only', () => {
    expect(roles.filter(canSetMedicallyRestricted)).toEqual(['coordinator', 'staff']);
  });

  it('canViewEmergencyInfo — coordinator, coach, staff only', () => {
    expect(roles.filter(canViewEmergencyInfo)).toEqual(['coordinator', 'coach', 'staff']);
  });

  it('canViewAllAvailability — coordinator and coach only', () => {
    expect(roles.filter(canViewAllAvailability)).toEqual(['coordinator', 'coach']);
  });

  it('canManageTrip — coordinator only', () => {
    expect(roles.filter(canManageTrip)).toEqual(['coordinator']);
  });

  it('canAccessTeamSettings — coordinator only', () => {
    expect(roles.filter(canAccessTeamSettings)).toEqual(['coordinator']);
  });
});
