import * as Linking from 'expo-linking';
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from '@/types/navigation';

/**
 * Deep link map — docs/ux/information-architecture.md (Deep Link Map).
 * Nested structure matches App → MainTabs → tab stacks.
 */
export const linkingScreens = {
  Auth: {
    screens: {
      Splash: '',
      Login: 'login',
      AccountCreation: 'signup',
      AcceptInvite: 'invite/:token',
      EmergencyInfoPrompt: 'onboarding/emergency',
    },
  },
  App: {
    screens: {
      CreateTeam: 'onboarding/team',
      CreateFirstEvent: 'onboarding/event',
      InviteMembers: 'onboarding/invite',
      MainTabs: {
        screens: {
          HomeTab: {
            screens: {
              Home: 'home',
              TextVariantDemo: 'debug/text-variants',
            },
          },
          EventsTab: {
            screens: {
              EventsList: 'events',
              EventDetail: 'events/:eventId',
              TripDetail: 'trips/:tripId',
              CreateEvent: 'events/new',
              EditItinerary: 'trips/:tripId/edit-itinerary',
              SquadSelection: 'trips/:tripId/squad',
              DocumentChecklistBuilder: 'trips/:tripId/documents/builder',
              TripReview: 'trips/:tripId/review',
              AvailabilitySubmission: 'events/:eventId/availability',
            },
          },
          FeedTab: {
            screens: {
              Feed: 'feed',
              PostDetail: 'posts/:postId',
              PostCreation: 'posts/new',
            },
          },
          TeamTab: {
            screens: {
              TeamRoster: 'team',
              MemberDetail: 'team/members/:memberId',
              EditProfile: 'profile/emergency',
              TeamSettings: 'team/settings',
              CoordinatorHandoff: 'team/handoff',
              AcceptTransfer: 'transfers/:transferId',
              NotificationPreferences: 'settings/notifications',
            },
          },
        },
      },
    },
  },
} as const;

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'relay://', 'relay:'],
  config: {
    screens: linkingScreens,
  },
};
