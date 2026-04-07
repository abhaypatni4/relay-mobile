import React from 'react';
import { Text as RNText, View } from 'react-native';

function makeScreen(label: string): React.FC {
  const Screen = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <RNText>{label}</RNText>
    </View>
  );
  Screen.displayName = label;
  return Screen;
}

export const SplashScreen = makeScreen('SplashScreen');
export const LoginScreen = makeScreen('LoginScreen');
export const AccountCreationScreen = makeScreen('AccountCreationScreen');
export const AcceptInviteScreen = makeScreen('AcceptInviteScreen');
export const EmergencyInfoPromptScreen = makeScreen('EmergencyInfoPromptScreen');
export const CreateTeamScreen = makeScreen('CreateTeamScreen');
export const CreateFirstEventScreen = makeScreen('CreateFirstEventScreen');
export const InviteMembersScreen = makeScreen('InviteMembersScreen');
export const HomeScreen = makeScreen('HomeScreen');
export const EventsListScreen = makeScreen('EventsListScreen');
export const EventDetailScreen = makeScreen('EventDetailScreen');
export const TripDetailScreen = makeScreen('TripDetailScreen');
export const CreateEventScreen = makeScreen('CreateEventScreen');
export const EditItineraryScreen = makeScreen('EditItineraryScreen');
export const SquadSelectionScreen = makeScreen('SquadSelectionScreen');
export const DocumentChecklistBuilderScreen = makeScreen('DocumentChecklistBuilderScreen');
export const TripReviewScreen = makeScreen('TripReviewScreen');
export const AvailabilitySubmissionScreen = makeScreen('AvailabilitySubmissionScreen');
export const FeedScreen = makeScreen('FeedScreen');
export const PostDetailScreen = makeScreen('PostDetailScreen');
export const PostCreationScreen = makeScreen('PostCreationScreen');
export const TeamRosterScreen = makeScreen('TeamRosterScreen');
export const MemberDetailScreen = makeScreen('MemberDetailScreen');
export const EditProfileScreen = makeScreen('EditProfileScreen');
export const TeamSettingsScreen = makeScreen('TeamSettingsScreen');
export const CoordinatorHandoffScreen = makeScreen('CoordinatorHandoffScreen');
export const AcceptTransferScreen = makeScreen('AcceptTransferScreen');
export const NotificationPreferencesScreen = makeScreen('NotificationPreferencesScreen');
