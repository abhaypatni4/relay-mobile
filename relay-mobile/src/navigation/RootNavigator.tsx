import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AccountCreationScreen } from '@/screens/auth/AccountCreationScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SplashScreen } from '@/screens/auth/SplashScreen';
import { AcceptInviteScreen } from '@/screens/onboarding/AcceptInviteScreen';
import type { RootStackParamList } from '@/types/navigation';
import { AppNavigator } from './AppNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.ReactElement {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
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
      <Stack.Screen name="MainApp" component={AppNavigator} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
