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

export const CreateFirstEventScreen = makeScreen('CreateFirstEventScreen');
export const EventsListScreen = makeScreen('EventsListScreen');
export const EventDetailScreen = makeScreen('EventDetailScreen');
export const TripDetailScreen = makeScreen('TripDetailScreen');
export const DocumentChecklistBuilderScreen = makeScreen('DocumentChecklistBuilderScreen');
export const AvailabilitySubmissionScreen = makeScreen('AvailabilitySubmissionScreen');
export const FeedScreen = makeScreen('FeedScreen');
export const PostDetailScreen = makeScreen('PostDetailScreen');
export const PostCreationScreen = makeScreen('PostCreationScreen');
export const MemberDetailScreen = makeScreen('MemberDetailScreen');
export const EditProfileScreen = makeScreen('EditProfileScreen');
export const TeamSettingsScreen = makeScreen('TeamSettingsScreen');
export const CoordinatorHandoffScreen = makeScreen('CoordinatorHandoffScreen');
export const AcceptTransferScreen = makeScreen('AcceptTransferScreen');
export const NotificationPreferencesScreen = makeScreen('NotificationPreferencesScreen');
