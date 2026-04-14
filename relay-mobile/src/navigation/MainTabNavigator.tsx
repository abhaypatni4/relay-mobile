import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Pressable } from 'react-native';
import { Icon } from '@/components/foundation/Icon';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import { DocumentChecklistBuilderScreen } from '@/screens/labels';
import { AvailabilityRosterScreen } from '@/screens/events/AvailabilityRosterScreen';
import { AvailabilitySubmissionScreen } from '@/screens/events/AvailabilitySubmissionScreen';
import { CreateEventScreen } from '@/screens/events/CreateEventScreen';
import { EditItineraryScreen } from '@/screens/events/EditItineraryScreen';
import { EventDetailScreen } from '@/screens/events/EventDetailScreen';
import { EventsListScreen } from '@/screens/events/EventsListScreen';
import { SquadSelectionScreen } from '@/screens/events/SquadSelectionScreen';
import { TripDetailScreen } from '@/screens/events/TripDetailScreen';
import { TripReviewScreen } from '@/screens/events/TripReviewScreen';
import { FeedScreen } from '@/screens/feed/FeedScreen';
import { PostCreationScreen } from '@/screens/feed/PostCreationScreen';
import { PostDetailScreen } from '@/screens/feed/PostDetailScreen';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { EditProfileScreen } from '@/screens/team/EditProfileScreen';
import { MemberDetailScreen } from '@/screens/team/MemberDetailScreen';
import { TeamRosterScreen } from '@/screens/team/TeamRosterScreen';
import { TeamSettingsScreen } from '@/screens/team/TeamSettingsScreen';
import { CoordinatorHandoffScreen } from '@/screens/team/CoordinatorHandoffScreen';
import { AcceptTransferScreen } from '@/screens/team/AcceptTransferScreen';
import { NotificationPreferencesScreen } from '@/screens/team/NotificationPreferencesScreen';
import { TextVariantDemoScreen } from '@/screens/TextVariantDemoScreen';
import type {
  EventsStackParamList,
  FeedStackParamList,
  HomeStackParamList,
  MainTabParamList,
  TeamStackParamList,
} from '@/types/navigation';
import type { DeliveryState, Post } from '@/types/models';
import { useTeamStore } from '@/store/teamStore';
import type { PostsResponse } from '@/queries/usePosts';

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
    <EventsStackNav.Navigator
      screenOptions={({ navigation }) => ({
        headerLeft: () =>
          navigation.canGoBack() ? (
            <Pressable onPress={() => navigation.goBack()} style={{ marginLeft: spacing.space12, padding: spacing.space8 }}>
              <Icon name="arrow-left" color={color.actionPrimary} size={20} />
            </Pressable>
          ) : undefined,
      })}
    >
      <EventsStackNav.Screen name="EventsList" component={EventsListScreen} options={{ title: 'Events' }} />
      <EventsStackNav.Screen name="EventDetail" component={EventDetailScreen} />
      <EventsStackNav.Screen name="TripDetail" component={TripDetailScreen} />
      <EventsStackNav.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={({ navigation }) => ({
          presentation: 'fullScreenModal',
          title: 'Create event',
          headerRight: () => (
            <Pressable onPress={() => navigation.goBack()} style={{ marginRight: spacing.space12, padding: spacing.space8 }}>
              <Icon name="x" color={color.actionPrimary} size={20} />
            </Pressable>
          ),
        })}
      />
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
        options={({ navigation }) => ({
          presentation: 'fullScreenModal',
          title: 'Availability',
          headerRight: () => (
            <Pressable onPress={() => navigation.goBack()} style={{ marginRight: spacing.space12, padding: spacing.space8 }}>
              <Icon name="x" color={color.actionPrimary} size={20} />
            </Pressable>
          ),
        })}
      />
      <EventsStackNav.Screen
        name="AvailabilityRoster"
        component={AvailabilityRosterScreen}
        options={{ title: 'Availability roster' }}
      />
    </EventsStackNav.Navigator>
  );
}

const FeedStackNav = createNativeStackNavigator<FeedStackParamList>();
function FeedStack(): React.ReactElement {
  return (
    <FeedStackNav.Navigator
      screenOptions={({ navigation }) => ({
        headerLeft: () =>
          navigation.canGoBack() ? (
            <Pressable onPress={() => navigation.goBack()} style={{ marginLeft: spacing.space12, padding: spacing.space8 }}>
              <Icon name="arrow-left" color={color.actionPrimary} size={20} />
            </Pressable>
          ) : undefined,
      })}
    >
      <FeedStackNav.Screen name="Feed" component={FeedScreen} options={{ title: 'Feed' }} />
      <FeedStackNav.Screen name="PostDetail" component={PostDetailScreen} />
      <FeedStackNav.Screen
        name="PostCreation"
        component={PostCreationScreen}
        options={({ navigation }) => ({
          presentation: 'fullScreenModal',
          title: 'Create post',
          headerRight: () => (
            <Pressable onPress={() => navigation.goBack()} style={{ marginRight: spacing.space12, padding: spacing.space8 }}>
              <Icon name="x" color={color.actionPrimary} size={20} />
            </Pressable>
          ),
        })}
      />
    </FeedStackNav.Navigator>
  );
}

const TeamStackNav = createNativeStackNavigator<TeamStackParamList>();
function TeamStack(): React.ReactElement {
  return (
    <TeamStackNav.Navigator
      screenOptions={({ navigation }) => ({
        headerLeft: () =>
          navigation.canGoBack() ? (
            <Pressable onPress={() => navigation.goBack()} style={{ marginLeft: spacing.space12, padding: spacing.space8 }}>
              <Icon name="arrow-left" color={color.actionPrimary} size={20} />
            </Pressable>
          ) : undefined,
      })}
    >
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
  const queryClient = useQueryClient();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const postsCache = useQuery({
    queryKey: ['teamPosts', teamId],
    queryFn: async () => queryClient.getQueryData<PostsResponse>(['teamPosts', teamId]),
    enabled: false,
    initialData: () => queryClient.getQueryData<PostsResponse>(['teamPosts', teamId]),
  });
  const { urgentUnread, normalUnread } = React.useMemo(() => {
    if (!teamId) {
      return { urgentUnread: 0, normalUnread: 0 };
    }
    const posts = postsCache.data?.posts ?? [];
    const getState = (post: Post): DeliveryState => {
      const raw = post.currentUserDeliveryState;
      return typeof raw === 'string' ? raw : raw.state;
    };
    let urgent = 0;
    let normal = 0;
    for (const post of posts) {
      const state = getState(post);
      if (post.type === 'urgentAlert' && post.requiresAcknowledgment) {
        if (state === 'acknowledged') {
          continue;
        }
      }
      if (state === 'notSeen' && post.type === 'urgentAlert' && post.requiresAcknowledgment) {
        urgent += 1;
      } else if (state === 'notSeen' && post.type !== 'urgentAlert') {
        normal += 1;
      }
    }
    return { urgentUnread: urgent, normalUnread: normal };
  }, [teamId, postsCache.data]);

  const feedBadge = !teamId ? undefined : urgentUnread > 0 ? urgentUnread : normalUnread > 0 ? normalUnread : undefined;
  const feedBadgeStyle =
    urgentUnread > 0
      ? { backgroundColor: color.stateError, color: color.actionOnPrimary, fontSize: 10 }
      : normalUnread > 0
        ? { backgroundColor: color.stateWarning, color: color.actionOnPrimary, fontSize: 10 }
        : undefined;

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
      <Tab.Screen
        name="FeedTab"
        component={FeedStack}
        options={{
          title: 'Feed',
          tabBarBadge: feedBadge,
          tabBarBadgeStyle: feedBadgeStyle,
        }}
      />
      <Tab.Screen name="TeamTab" component={TeamStack} options={{ title: 'Team' }} />
    </Tab.Navigator>
  );
}
