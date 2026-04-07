import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { TextInput } from '@/components/forms/TextInput';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { api } from '@/services/api';
import { applyMembershipsToTeamStore, type MeMembership } from '@/services/session';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { AppStackParamList } from '@/types/navigation';

interface PatchEmergencyResponse {
  memberships: MeMembership[];
}

function flattenFieldErrors(fields: Record<string, string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v?.[0]) {
      out[k] = v[0];
    }
  }
  return out;
}

export function EmergencyInfoPromptScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList, 'EmergencyInfoPrompt'>>();
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [allergyAlert, setAllergyAlert] = useState('');
  const [staffNote, setStaffNote] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [deferLoading, setDeferLoading] = useState(false);

  const goHome = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }, [navigation]);

  const onComplete = useCallback(async () => {
    setFieldErrors({});
    setLoading(true);
    try {
      const { data } = await api.patch<PatchEmergencyResponse>('/users/me/emergency-info', {
        contactName,
        contactPhone,
        allergyAlert,
        staffNote: staffNote.trim() || undefined,
      });
      applyMembershipsToTeamStore(data.memberships);
      goHome();
    } catch (e: unknown) {
      if (
        axios.isAxiosError(e) &&
        e.response?.status === 400 &&
        typeof e.response.data === 'object' &&
        e.response.data !== null &&
        'fields' in e.response.data
      ) {
        const raw = (e.response.data as { fields?: Record<string, string[]> }).fields;
        if (raw) {
          setFieldErrors(flattenFieldErrors(raw));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [allergyAlert, contactName, contactPhone, goHome, staffNote]);

  const onLater = useCallback(async () => {
    setDeferLoading(true);
    try {
      await api.post('/users/me/emergency-info/remind-later');
    } catch {
      // still send user home; reminder is best-effort
    } finally {
      setDeferLoading(false);
      goHome();
    }
  }, [goHome]);

  return (
    <ScreenContainer scrollable>
      <Text variant="title" style={{ marginBottom: spacing.space8 }}>
        Emergency contact
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
        Your coordinator needs this in case of an emergency on the road.
      </Text>
      <TextInput
        label="Emergency contact name"
        value={contactName}
        onChangeText={setContactName}
        autoCapitalize="words"
        errorMessage={fieldErrors.contactName}
      />
      <TextInput
        label="Emergency contact phone"
        value={contactPhone}
        onChangeText={setContactPhone}
        keyboardType="phone-pad"
        errorMessage={fieldErrors.contactPhone}
      />
      <TextInput
        label="Allergies or medical alerts"
        value={allergyAlert}
        onChangeText={setAllergyAlert}
        placeholder='Use "None" if not applicable'
        errorMessage={fieldErrors.allergyAlert}
      />
      <TextInput
        label="Note for staff (optional)"
        value={staffNote}
        onChangeText={setStaffNote}
        errorMessage={fieldErrors.staffNote}
      />
      <LoadingButton label="Complete" isLoading={loading} onPress={() => void onComplete()} />
      <Pressable
        onPress={() => void onLater()}
        disabled={deferLoading}
        style={{ marginTop: spacing.space16, alignItems: 'center' }}
      >
        <Text variant="label" colorToken={color.textSecondary}>
          I&apos;ll do this later
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
