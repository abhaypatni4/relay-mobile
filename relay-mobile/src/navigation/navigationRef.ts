import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '@/types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToLogin(): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  }
}
