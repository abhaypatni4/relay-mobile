import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Icon } from '@/components/foundation/Icon';
import { color } from '@/tokens/colors';
import {
  AcceptTransferScreen,
  AvailabilitySubmissionScreen,
  CoordinatorHandoffScreen,
  DocumentChecklistBuilderScreen,
  EditProfileScreen,
  EventDetailScreen,
  FeedScreen,
  MemberDetailScreen,
  NotificationPreferencesScreen,
  PostCreationScreen,
  PostDetailScreen,
  TeamSettingsScreen,
} from '@/screens/labels';
import { CreateEventScreen } from '@/screens/events/CreateEventScreen';
import { EditItineraryScreen } from '@/screens/events/EditItineraryScreen';
import { EventsListScreen } from '@/screens/events/EventsListScreen';
import { SquadSelectionScreen } from '@/screens/events/SquadSelectionScreen';
import { TripDetailScreen } from '@/screens/events/TripDetailScreen';
import { TripReviewScreen } from '@/screens/events/TripReviewScreen';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { TeamRosterScreen } from '@/screens/team/TeamRosterScreen';
import { TextVariantDemoScreen } from '@/screens/TextVariantDemoScreen';
import type {
  EventsStackParamList,
  FeedStackParamList,
  HomeStackParamList,
  MainTabParamList,
  TeamStackParamList,
} from '@/types/navigation';

const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
function HomeStack(): React.ReactElement {
  return (
    <HomeStackNav.Navigator>
      <HomeStackNav.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <HomeStackNav.Screen
        name="TextVariantDemo"
        component={TextVariantDemoScreen}
        options={{ title: 'Text variants' }}
      />
    </HomeStackNav.Navigator>
  );
}

const EventsStackNav = createNativeStackNavigator<EventsStackParamList>();
function EventsStack(): React.ReactElement {
  return (
    <EventsStackNav.Navigator>
      <EventsStackNav.Screen name="EventsList" component={EventsListScreen} options={{ title: 'Events' }} />
      <EventsStackNav.Screen name="EventDetail" component={EventDetailScreen} />
      <EventsStackNav.Screen name="TripDetail" component={TripDetailScreen} />
      <EventsStackNav.Screen name="CreateEvent" component={CreateEventScreen} />
      <EventsStackNav.Screen name="EditItinerary" component={EditItineraryScreen} />
      <EventsStackNav.Screen name="SquadSelection" component={SquadSelectionScreen} />
      <EventsStackNav.Screen
        name="DocumentChecklistBuilder"
        component={DocumentChecklistBuilderScreen}
      />
      <EventsStackNav.Screen name="TripReview" component={TripReviewScreen} />
      <EventsStackNav.Screen
        name="AvailabilitySubmission"
        component={AvailabilitySubmissionScreen}
      />
    </EventsStackNav.Navigator>
  );
}

const FeedStackNav = createNativeStackNavigator<FeedStackParamList>();
function FeedStack(): React.ReactElement {
  return (
    <FeedStackNav.Navigator>
      <FeedStackNav.Screen name="Feed" component={FeedScreen} options={{ title: 'Feed' }} />
      <FeedStackNav.Screen name="PostDetail" component={PostDetailScreen} />
      <FeedStackNav.Screen name="PostCreation" component={PostCreationScreen} />
    </FeedStackNav.Navigator>
  );
}

const TeamStackNav = createNativeStackNavigator<TeamStackParamList>();
function TeamStack(): React.ReactElement {
  return (
    <TeamStackNav.Navigator>
      <TeamStackNav.Screen name="TeamRoster" component={TeamRosterScreen} options={{ title: 'Team' }} />
      <TeamStackNav.Screen name="MemberDetail" component={MemberDetailScreen} />
      <TeamStackNav.Screen name="EditProfile" component={EditProfileScreen} />
      <TeamStackNav.Screen name="TeamSettings" component={TeamSettingsScreen} />
      <TeamStackNav.Screen name="CoordinatorHandoff" component={CoordinatorHandoffScreen} />
      <TeamStackNav.Screen name="AcceptTransfer" component={AcceptTransferScreen} />
      <TeamStackNav.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
      />
    </TeamStackNav.Navigator>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator(): React.ReactElement {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: color.actionPrimary,
        tabBarInactiveTintColor: color.textSecondary,
        tabBarIcon: ({ color: tint, size }) => {
          const map: Record<keyof MainTabParamList, string> = {
            HomeTab: 'home',
            EventsTab: 'calendar',
            FeedTab: 'feed',
            TeamTab: 'team',
          };
          return <Icon name={map[route.name]} size={size} color={tint} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="EventsTab" component={EventsStack} options={{ title: 'Events' }} />
      <Tab.Screen name="FeedTab" component={FeedStack} options={{ title: 'Feed' }} />
      <Tab.Screen name="TeamTab" component={TeamStack} options={{ title: 'Team' }} />
    </Tab.Navigator>
  );
}
