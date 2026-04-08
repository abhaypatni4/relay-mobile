import React from 'react';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { CoordinatorHome } from '@/screens/home/CoordinatorHome';
import { CoachHome } from '@/screens/home/CoachHome';
import { PlayerHome } from '@/screens/home/PlayerHome';
import { StaffHome } from '@/screens/home/StaffHome';

export function HomeScreen(): React.ReactElement {
  const { role } = useCurrentMember();

  let body: React.ReactElement;
  switch (role) {
    case 'coordinator':
      body = <CoordinatorHome />;
      break;
    case 'coach':
      body = <CoachHome />;
      break;
    case 'staff':
      body = <StaffHome />;
      break;
    case 'player':
    default:
      body = <PlayerHome />;
      break;
  }

  return <ScreenContainer scrollable>{body}</ScreenContainer>;
}
