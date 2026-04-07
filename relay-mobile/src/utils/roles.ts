import type { Role } from '@/types/models';

export function canCreatePosts(role: Role): boolean {
  return role === 'coordinator' || role === 'coach';
}

export function canViewDeliveryStates(role: Role): boolean {
  return role === 'coordinator' || role === 'coach';
}

export function canSetOperationalStatus(role: Role): boolean {
  return role === 'coordinator' || role === 'coach';
}

export function canSetMedicallyRestricted(role: Role): boolean {
  return role === 'coordinator' || role === 'staff';
}

export function canViewEmergencyInfo(role: Role): boolean {
  return role === 'coordinator' || role === 'coach' || role === 'staff';
}

export function canViewAllAvailability(role: Role): boolean {
  return role === 'coordinator' || role === 'coach';
}

export function canManageTrip(role: Role): boolean {
  return role === 'coordinator';
}

export function canAccessTeamSettings(role: Role): boolean {
  return role === 'coordinator';
}
