import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { fetchMe } from '@/services/session';
import { analytics } from '@/services/analytics';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { TeamStackParamList } from '@/types/navigation';

export function EditProfileScreen(): React.ReactElement {
  useFocusEffect(
    React.useCallback(() => {
      analytics.screen('EditProfileScreen');
    }, []),
  );

  const route = useRoute<RouteProp<TeamStackParamList, 'EditProfile'>>();
  const { data, isPending } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: fetchMe,
  });

  const emergencySection = route.params?.initialSection === 'emergency';

  if (isPending) {
    return (
      <ScreenContainer>
        <Text variant="title">Edit profile</Text>
        <Text variant="body" colorToken={color.textSecondary} style={{ marginTop: spacing.space8 }}>
          Loading profile...
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text variant="title">{emergencySection ? 'Emergency info' : 'Edit profile'}</Text>
      <View
        style={{
          marginTop: spacing.space16,
          backgroundColor: color.surfaceElevated,
          borderRadius: radius.md,
          padding: spacing.space16,
        }}
      >
        <Text variant="body">Name: {data?.user.name ?? 'Not provided'}</Text>
        <Text variant="body" style={{ marginTop: spacing.space8 }}>
          Email: {data?.user.email ?? 'Not provided'}
        </Text>
        <Text variant="body" style={{ marginTop: spacing.space8 }}>
          Phone: {data?.user.phone ?? 'Not provided'}
        </Text>
      </View>
      <View
        style={{
          marginTop: spacing.space16,
          backgroundColor: color.surfaceElevated,
          borderRadius: radius.md,
          padding: spacing.space16,
        }}
      >
        <Text variant="label">Emergency info</Text>
        <Text variant="body" style={{ marginTop: spacing.space8 }}>
          Contact: {data?.user.emergencyContactName ?? 'Not provided'}
        </Text>
        <Text variant="body" style={{ marginTop: spacing.space4 }}>
          Phone: {data?.user.emergencyContactPhone ?? 'Not provided'}
        </Text>
        <Text variant="body" style={{ marginTop: spacing.space4 }}>
          Allergy/Alert: {data?.user.emergencyAllergyAlert ?? 'Not provided'}
        </Text>
        <Text variant="caption" colorToken={color.textSecondary} style={{ marginTop: spacing.space8 }}>
          Staff note: {data?.user.emergencyStaffNote ?? 'Not provided'}
        </Text>
      </View>
    </ScreenContainer>
  );
}
