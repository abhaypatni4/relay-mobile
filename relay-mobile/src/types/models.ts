/** Mirrors docs/engineering/domain-models.md (TypeScript interfaces). */

export type Role = 'coordinator' | 'coach' | 'staff' | 'player';

export type OnboardingState = 'invited' | 'profileIncomplete' | 'active';

export type EventType = 'match' | 'training' | 'trip';

export type EventStatus = 'draft' | 'active' | 'cancelled' | 'postponed' | 'complete';

export type TravelingStatus = 'traveling' | 'notTraveling' | 'unassigned';

export type AvailabilityStatus = 'available' | 'limited' | 'unavailable';

/** Player-safe selection state from GET /availability (no operationalStatus leak). */
export type PlayerSelectionOutcome = 'selected' | 'notSelected' | 'pending';

export type OperationalStatus =
  | 'selected'
  | 'notSelected'
  | 'traveling'
  | 'medicallyRestricted'
  | 'unassigned';

export type PostType =
  | 'scheduleUpdate'
  | 'travelInfo'
  | 'generalAnnouncement'
  | 'urgentAlert';

export type RecipientGroup =
  | 'fullTeam'
  | 'travelingSquad'
  | 'players'
  | 'coaches'
  | 'staff'
  | 'coachingStaff'
  | 'allStaff';

export type DeliveryState = 'notSeen' | 'seen' | 'acknowledged';

export type TransferStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyAllergyAlert: string | null;
  emergencyStaffNote: string | null;
  emergencyInfoUpdatedAt: string | null;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  sport: string | null;
  homeLocation: string | null;
  createdAt: string;
}

export interface EmergencyInfo {
  contactName: string | null;
  contactPhone: string | null;
  allergyAlert: string | null;
  staffNote: string | null;
  updatedAt: string | null;
  isStale: boolean;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: Role;
  onboardingState: OnboardingState;
  jerseyNumber: string | null;
  customRoleLabel: string | null;
  invitedAt: string;
  joinedAt: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  emergencyInfo?: EmergencyInfo;
}

export interface Event {
  id: string;
  teamId: string;
  type: EventType;
  name: string;
  date: string;
  startTime: string;
  location: string | null;
  status: EventStatus;
  cancelledAt: string | null;
  postponedAt: string | null;
  newDateAfterPostponement: string | null;
  newTimeAfterPostponement: string | null;
  createdBy: string;
  createdAt: string;
  tripWorkspace?: TripWorkspace;
  availabilityWindow?: AvailabilityWindow;
}

export interface TripWorkspace {
  id: string;
  eventId: string;
  departureTime: string | null;
  departureMeetingPoint: string | null;
  transportationNotes: string | null;
  accommodationName: string | null;
  accommodationAddress: string | null;
  accommodationCheckInTime: string | null;
  matchEventTime: string | null;
  matchEventLocation: string | null;
  returnDepartureTime: string | null;
  returnDeparturePoint: string | null;
  additionalNotes: string | null;
  itineraryVersion: number;
  isPublished: boolean;
  publishedAt: string | null;
}

export interface TripSquadAssignment {
  id: string;
  tripWorkspaceId: string;
  teamMemberId: string;
  travelingStatus: TravelingStatus;
  acknowledgedItineraryVersion: number | null;
  memberName: string;
  memberRole: Role;
  onboardingState: OnboardingState;
}

export interface DocumentChecklistItem {
  id: string;
  documentChecklistId: string;
  name: string;
  applicability: 'allPlayers' | 'travelingSquad' | 'specific';
  specificMemberIds: string[];
  isConfirmedByCurrentUser: boolean;
  confirmedAt: string | null;
  confirmedCount?: number;
  totalApplicable?: number;
}

export interface AvailabilityWindow {
  id: string;
  eventId: string;
  openedAt: string;
  lockedAt: string | null;
  isLocked: boolean;
  selectionNotificationsSentAt: string | null;
}

export interface AvailabilitySubmission {
  id: string;
  teamMemberId: string;
  memberName: string;
  availabilityStatus: AvailabilityStatus;
  note: string | null;
  operationalStatus?: OperationalStatus;
  operationalStatusSetBy?: string | null;
  submittedAt: string;
  updatedAt: string;
  selectionNotificationSentAt: string | null;
}

export interface Post {
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
  createdAt: string;
  deletedAt: string | null;
  currentUserDeliveryState:
    | DeliveryState
    | {
        state: DeliveryState;
        seenAt: string | null;
        acknowledgedAt: string | null;
      };
  currentUserSeenAt?: string | null;
  currentUserAcknowledgedAt: string | null;
  deliverySummary?: DeliveryStateSummary;
}

export interface DeliveryStateSummary {
  total?: number;
  notSeen?: number;
  seen?: number;
  acknowledged?: number;
  sentCount: number;
  seenCount: number;
  acknowledgedCount: number;
  overdueCount: number;
  members?: DeliveryMemberState[];
  overdueMembers?: OverdueMember[];
}

export interface DeliveryMemberState {
  memberId: string;
  memberName: string;
  state: DeliveryState;
  seenAt: string | null;
}

export interface OverdueMember {
  teamMemberId: string;
  memberName: string;
  lastNudgeSentAt: string | null;
  canNudge: boolean;
}

export interface CoordinatorTransfer {
  id: string;
  teamId: string;
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  status: TransferStatus;
  initiatedAt: string;
  expiresAt: string;
}
