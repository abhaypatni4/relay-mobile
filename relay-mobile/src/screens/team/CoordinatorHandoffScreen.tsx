import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { ConfirmationSheet } from '@/components/overlay/ConfirmationSheet';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { spacing } from '@/tokens/spacing';
import type { TeamStackParamList } from '@/types/navigation';

type Member = { id: string; name: string; role: string; onboardingState: string };

export function CoordinatorHandoffScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('CoordinatorHandoffScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<TeamStackParamList, 'CoordinatorHandoff'>>();
  const teamId = useTeamStore((s) => s.activeTeamId);
  const currentMemberId = useTeamStore((s) => s.activeTeamMemberId);
  const role = useTeamStore((s) => s.role);
  const addToast = useUiStore((s) => s.addToast);
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<Member | null>(null);

  const membersQuery = useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: async () => {
      const { data } = await api.get<{ members: Member[] }>(`/teams/${teamId}/members`);
      return data.members;
    },
    enabled: Boolean(teamId),
  });

  const eligible = (membersQuery.data ?? []).filter(
    (m) => m.id !== currentMemberId && m.onboardingState === 'active',
  );

  const createTransfer = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      await api.post(`/teams/${teamId}/transfers`, { toMemberId: selected.id });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pendingTransfer', teamId] });
      navigation.navigate('TeamSettings');
    },
    onError: () => addToast('error', "Couldn't save — check your connection and try again."),
  });

  if (role !== 'coordinator') {
    return (
      <ScreenContainer scrollable>
        <Text variant="body">This screen is available to coordinators only.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ flex: 1, padding: spacing.space16 }}>
        <Text variant="title" style={{ marginBottom: spacing.space8 }}>
          Transfer coordinator role
        </Text>
        <Text variant="body" style={{ marginBottom: spacing.space16 }}>
          Select a team member to transfer the coordinator role. They will need to accept in the app.
        </Text>
        {eligible.length === 0 ? (
          <Text variant="body">No eligible active members available.</Text>
        ) : (
          <FlatList
            data={eligible}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <LoadingButton
                label={`${item.name} • ${item.role}`}
                isLoading={false}
                onPress={() => setSelected(item)}
              />
            )}
          />
        )}
      </View>

      <ConfirmationSheet
        visible={Boolean(selected)}
        title={selected ? `Transfer coordinator role to ${selected.name}?` : 'Transfer coordinator role?'}
        body="They'll need to accept in the app before the transfer completes."
        confirmLabel="Send request"
        cancelLabel="Go back"
        onCancel={() => setSelected(null)}
        onConfirm={async () => {
          await createTransfer.mutateAsync();
          setSelected(null);
        }}
      />
    </ScreenContainer>
  );
}

