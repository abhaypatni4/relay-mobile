import { useMutation, useQuery } from '@tanstack/react-query';
import React from 'react';
import { Pressable, View } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/foundation/Text';
import { api } from '@/services/api';
import { useUiStore } from '@/store/uiStore';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

type Prefs = {
  tripUpdates: boolean;
  itineraryChanges: boolean;
  availability: boolean;
  selectionNotifications: boolean;
  feedPostsRequired: boolean;
  feedPostsGeneral: boolean;
  reminders: boolean;
  nudges: boolean;
  urgentAlerts: boolean;
};

const labelMap: Array<{ key: keyof Prefs; label: string }> = [
  { key: 'tripUpdates', label: 'Trip updates (published, cancelled, postponed)' },
  { key: 'itineraryChanges', label: 'Itinerary changes' },
  { key: 'availability', label: 'Availability' },
  { key: 'selectionNotifications', label: 'Selection notifications' },
  { key: 'feedPostsRequired', label: 'Feed posts (acknowledgment required)' },
  { key: 'feedPostsGeneral', label: 'Feed posts (general)' },
  { key: 'reminders', label: 'Reminders (documents, emergency info)' },
  { key: 'nudges', label: 'Nudges' },
  { key: 'urgentAlerts', label: 'Urgent Alerts' },
];

export function NotificationPreferencesScreen(): React.ReactElement {
  const addToast = useUiStore((s) => s.addToast);
  const prefsQuery = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const { data } = await api.get<Prefs>('/users/me/notification-preferences');
      return data;
    },
  });

  const patchMutation = useMutation({
    mutationFn: async (next: Prefs) => {
      const { data } = await api.patch<Prefs>('/users/me/notification-preferences', next);
      return data;
    },
    onError: () => addToast('error', "Couldn't save — check your connection and try again."),
  });

  const prefs = prefsQuery.data;

  return (
    <ScreenContainer scrollable>
      <View style={{ padding: spacing.space16 }}>
        <Text variant="title" style={{ marginBottom: spacing.space12 }}>
          Notification preferences
        </Text>
        {labelMap.map((row) => {
          const value = prefs?.[row.key] ?? true;
          const disabled = row.key === 'urgentAlerts';
          return (
            <Pressable
              key={row.key}
              disabled={disabled}
              onPress={() => {
                if (!prefs || disabled) return;
                const next = { ...prefs, [row.key]: !value, urgentAlerts: true };
                void patchMutation.mutateAsync(next);
              }}
              accessibilityRole="button"
              style={{
                paddingVertical: spacing.space12,
                borderBottomWidth: 1,
                borderBottomColor: color.borderSubtle,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text variant="body">{row.label}</Text>
              <Text variant="label" colorToken={disabled ? color.textDisabled : color.actionPrimary}>
                {value ? 'On' : 'Off'}
              </Text>
            </Pressable>
          );
        })}
        <Text variant="caption" colorToken={color.textSecondary} style={{ marginTop: spacing.space8 }}>
          Urgent Alerts cannot be disabled
        </Text>
      </View>
    </ScreenContainer>
  );
}

