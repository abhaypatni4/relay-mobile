import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { SplashScreen } from '@/screens/auth/SplashScreen';
import type { RootStackParamList } from '@/types/navigation';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.ReactElement {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="MainApp" component={AppNavigator} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
