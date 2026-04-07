import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import {
  CreateFirstEventScreen,
  CreateTeamScreen,
  InviteMembersScreen,
} from '@/screens/labels';
import type { AppStackParamList } from '@/types/navigation';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator(): React.ReactElement {
  return (
    <Stack.Navigator initialRouteName="MainTabs">
      <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
      <Stack.Screen name="CreateFirstEvent" component={CreateFirstEventScreen} />
      <Stack.Screen name="InviteMembers" component={InviteMembersScreen} />
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
