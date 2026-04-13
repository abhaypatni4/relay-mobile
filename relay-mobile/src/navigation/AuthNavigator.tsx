import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AccountCreationScreen } from '@/screens/auth/AccountCreationScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { AcceptInviteScreen } from '@/screens/onboarding/AcceptInviteScreen';
import type { AuthNavigatorParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AuthNavigatorParamList>();

export function AuthNavigator(): React.ReactElement {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: true, title: 'Sign in' }} />
      <Stack.Screen
        name="AccountCreation"
        component={AccountCreationScreen}
        options={{ headerShown: true, title: 'Create account' }}
      />
      <Stack.Screen
        name="AcceptInvite"
        component={AcceptInviteScreen}
        options={{ headerShown: true, title: 'Join team' }}
      />
    </Stack.Navigator>
  );
}
