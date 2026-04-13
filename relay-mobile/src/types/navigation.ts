/**
 * Typed route params — screens from docs/ux/information-architecture.md + auth/onboarding flows.
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

/** Sign-in, signup, and invite flows (nested under root `Auth`). */
export type AuthNavigatorParamList = {
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
  TripDetail: { tripId: string; eventId?: string; section?: 'itinerary' | 'documents' };
  CreateEvent: undefined;
  EditItinerary: { tripId: string; eventId: string };
  SquadSelection: { tripId: string; eventId: string };
  DocumentChecklistBuilder: { tripId: string };
  TripReview: { tripId: string; eventId: string };
  AvailabilitySubmission: { eventId: string };
  AvailabilityRoster: { eventId: string };
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
  EventsTab: NavigatorScreenParams<EventsStackParamList> | undefined;
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

/** Root stack: splash → Auth group (Login first) or MainApp. */
export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthNavigatorParamList> | undefined;
  MainApp: undefined;
};
