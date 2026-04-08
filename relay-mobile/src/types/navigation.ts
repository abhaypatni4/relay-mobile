/**
 * Typed route params — screens from docs/ux/information-architecture.md + auth/onboarding flows.
 */

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  AccountCreation: { invitationToken?: string } | undefined;
  AcceptInvite: { token?: string };
};

export type HomeStackParamList = {
  Home: undefined;
  TextVariantDemo: undefined;
};

export type EventsStackParamList = {
  EventsList: undefined;
  EventDetail: { eventId: string };
  TripDetail: { tripId: string; section?: 'itinerary' | 'documents' };
  CreateEvent: undefined;
  EditItinerary: { tripId: string; eventId: string };
  SquadSelection: { tripId: string; eventId: string };
  DocumentChecklistBuilder: { tripId: string };
  TripReview: { tripId: string; eventId: string };
  AvailabilitySubmission: { eventId: string };
};

export type FeedStackParamList = {
  Feed: undefined;
  PostDetail: { postId: string };
  PostCreation: undefined;
};

export type TeamStackParamList = {
  TeamRoster: undefined;
  MemberDetail: { memberId: string };
  EditProfile: { initialSection?: 'profile' | 'emergency' };
  TeamSettings: undefined;
  CoordinatorHandoff: undefined;
  AcceptTransfer: { transferId: string };
  NotificationPreferences: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  EventsTab: undefined;
  FeedTab: undefined;
  TeamTab: undefined;
};

export type AppStackParamList = {
  CreateTeam: undefined;
  CreateFirstEvent: undefined;
  InviteMembers: undefined;
  EmergencyInfoPrompt: undefined;
  MainTabs: undefined;
};

/** Single root stack: auth/onboarding screens + MainApp (nested app shell). */
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  AccountCreation: { invitationToken?: string } | undefined;
  AcceptInvite: { token?: string };
  MainApp: undefined;
};
