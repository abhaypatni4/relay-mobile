import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { TextInput } from '@/components/forms/TextInput';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api } from '@/services/api';
import { analytics } from '@/services/analytics';
import { useTeamStore } from '@/store/teamStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { AppStackParamList } from '@/types/navigation';

interface CreateTeamResponse {
  team: {
    id: string;
    name: string;
    sport: string | null;
    homeLocation: string | null;
    createdAt: string;
  } | null;
  teamMemberId: string;
}

export function CreateTeamScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('CreateTeamScreen');
    }, []),
  );

  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList, 'CreateTeam'>>();
  const setTeamContext = useTeamStore((s) => s.setTeamContext);
  const [name, setName] = useState('');
  const [sport, setSport] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(async () => {
    setNameError('');
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Team name is required.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<CreateTeamResponse>('/teams', {
        name: trimmed,
        sport: sport.trim() || null,
      });
      if (data.team) {
        analytics.track('team_created', {});
        setTeamContext({
          activeTeamId: data.team.id,
          activeTeamMemberId: data.teamMemberId,
          role: 'coordinator',
          onboardingState: 'active',
          teamName: data.team.name,
          sport: data.team.sport,
        });
      }
      navigation.navigate('InviteMembers');
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 400) {
        setNameError('Could not create team. Check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [name, navigation, setTeamContext, sport]);

  return (
    <ScreenContainer scrollable>
      <Text variant="title" style={{ marginBottom: spacing.space8 }}>
        Name your team
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
        You can change this later in team settings.
      </Text>
      <TextInput
        label="Team name"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setNameError('');
        }}
        autoCapitalize="words"
        errorMessage={nameError}
      />
      <TextInput
        label="Sport (optional)"
        value={sport}
        onChangeText={setSport}
        autoCapitalize="words"
      />
      <View style={{ marginTop: spacing.space8 }}>
        <LoadingButton label="Continue" isLoading={loading} onPress={() => void onSubmit()} />
      </View>
    </ScreenContainer>
  );
}
