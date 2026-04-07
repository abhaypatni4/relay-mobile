/**
 * Typed route params — screens from docs/ux/information-architecture.md + auth/onboarding flows.
 */

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  AccountCreation: undefined;
  AcceptInvite: { token: string };
  EmergencyInfoPrompt: undefined;
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
  EditItinerary: { tripId: string };
  SquadSelection: { tripId: string };
  DocumentChecklistBuilder: { tripId: string };
  TripReview: { tripId: string };
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
  MainTabs: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};
