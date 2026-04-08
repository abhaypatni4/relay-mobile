import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api } from '@/services/api';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { spacing } from '@/tokens/spacing';
import type { Role } from '@/types/models';
import type { TeamStackParamList } from '@/types/navigation';

type Transfer = {
  id: string;
  teamId: string;
  fromMemberName: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
};

export function AcceptTransferScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<TeamStackParamList, 'AcceptTransfer'>>();
  const route = useRoute<RouteProp<TeamStackParamList, 'AcceptTransfer'>>();
  const { transferId } = route.params;
  const teamId = useTeamStore((s) => s.activeTeamId);
  const setTeamContext = useTeamStore((s) => s.setTeamContext);
  const current = useTeamStore((s) => s);
  const addToast = useUiStore((s) => s.addToast);

  const transferQuery = useQuery({
    queryKey: ['transfer', teamId, transferId],
    queryFn: async () => {
      const { data } = await api.get<{ transfer: Transfer }>(`/teams/${teamId}/transfers/${transferId}`);
      return data.transfer;
    },
    enabled: Boolean(teamId && transferId),
  });

  const respond = useMutation({
    mutationFn: async (action: 'accept' | 'decline') => {
      const { data } = await api.patch<{ transfer: Transfer }>(`/teams/${teamId}/transfers/${transferId}`, { action });
      return data.transfer;
    },
    onSuccess: (transfer, action) => {
      if (action === 'accept') {
        setTeamContext({
          activeTeamId: current.activeTeamId!,
          activeTeamMemberId: current.activeTeamMemberId!,
          role: 'coordinator' as Role,
          onboardingState: current.onboardingState!,
          teamName: current.teamName,
          sport: current.sport,
        });
        addToast('success', "You're now the coordinator");
        navigation.navigate('TeamSettings');
      } else {
        addToast('success', 'Transfer declined');
        navigation.goBack();
      }
      void transfer;
    },
    onError: () => addToast('error', "Couldn't save — check your connection and try again."),
  });

  if (transferQuery.isLoading) {
    return (
      <ScreenContainer scrollable>
        <Text variant="body">Loading…</Text>
      </ScreenContainer>
    );
  }

  const transfer = transferQuery.data;
  const isValid = transfer?.status === 'pending';

  return (
    <ScreenContainer scrollable>
      <View style={{ padding: spacing.space16 }}>
        {isValid && transfer ? (
          <>
            <Text variant="title" style={{ marginBottom: spacing.space12 }}>
              {transfer.fromMemberName} is inviting you to become coordinator
            </Text>
            <Text variant="body" style={{ marginBottom: spacing.space16 }}>
              As coordinator, you can manage team settings, trips, and event operations.
            </Text>
            <LoadingButton
              label="Accept"
              isLoading={respond.status === 'pending'}
              onPress={() => void respond.mutateAsync('accept')}
            />
            <View style={{ height: spacing.space8 }} />
            <LoadingButton
              label="Decline"
              isLoading={false}
              onPress={() => void respond.mutateAsync('decline')}
            />
          </>
        ) : (
          <>
            <Text variant="body" style={{ marginBottom: spacing.space12 }}>
              This transfer request is no longer valid.
            </Text>
            <LoadingButton label="Go back" isLoading={false} onPress={() => navigation.navigate('TeamRoster')} />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

