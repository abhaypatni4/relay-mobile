import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { CreateFirstEventScreen } from '@/screens/labels';
import { CreateTeamScreen } from '@/screens/onboarding/CreateTeamScreen';
import { EmergencyInfoPromptScreen } from '@/screens/onboarding/EmergencyInfoPromptScreen';
import { InviteMembersScreen } from '@/screens/onboarding/InviteMembersScreen';
import type { AppStackParamList } from '@/types/navigation';
import { useTeamStore } from '@/store/teamStore';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator(): React.ReactElement {
  const activeTeamId = useTeamStore((s) => s.activeTeamId);
  const onboardingState = useTeamStore((s) => s.onboardingState);
  const role = useTeamStore((s) => s.role);

  const initialRouteName = useMemo((): keyof AppStackParamList => {
    if (!activeTeamId) {
      return 'CreateTeam';
    }
    const needsEmergency =
      role !== 'coordinator' && onboardingState !== null && onboardingState !== 'active';
    if (needsEmergency) {
      return 'EmergencyInfoPrompt';
    }
    return 'MainTabs';
  }, [activeTeamId, onboardingState, role]);

  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      <Stack.Screen name="CreateTeam" component={CreateTeamScreen} options={{ title: 'Create team' }} />
      <Stack.Screen name="CreateFirstEvent" component={CreateFirstEventScreen} />
      <Stack.Screen name="InviteMembers" component={InviteMembersScreen} options={{ title: 'Invite members' }} />
      <Stack.Screen
        name="EmergencyInfoPrompt"
        component={EmergencyInfoPromptScreen}
        options={{ title: 'Emergency info', headerBackVisible: false }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
