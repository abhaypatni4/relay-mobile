import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import {
  AcceptInviteScreen,
  AccountCreationScreen,
  EmergencyInfoPromptScreen,
  LoginScreen,
  SplashScreen,
} from '@/screens/labels';
import type { AuthStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator(): React.ReactElement {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="AccountCreation" component={AccountCreationScreen} />
      <Stack.Screen name="AcceptInvite" component={AcceptInviteScreen} />
      <Stack.Screen name="EmergencyInfoPrompt" component={EmergencyInfoPromptScreen} />
    </Stack.Navigator>
  );
}
