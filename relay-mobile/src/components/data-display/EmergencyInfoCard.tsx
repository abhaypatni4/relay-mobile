import React, { useCallback, useMemo } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';

function digitsCount(s: string): number {
  return (s.match(/\d/g) ?? []).length;
}

function canUseTelLink(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) {
    return false;
  }
  if (digitsCount(trimmed) < 7) {
    return false;
  }
  return /^[0-9+\-().\s]+$/.test(trimmed);
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (Number.isNaN(min) || min < 0) {
    return iso;
  }
  if (min < 60) {
    return `${min} min ago`;
  }
  const hr = Math.floor(min / 60);
  if (hr < 48) {
    return `${hr} hr ago`;
  }
  const d = Math.floor(hr / 24);
  return `${d} days ago`;
}

export function EmergencyInfoCard(props: {
  contactName: string | null;
  contactPhone: string | null;
  allergyAlert: string | null;
  staffNote: string | null;
  updatedAt: string | null;
  isStale: boolean;
}): React.ReactElement {
  const { contactName, contactPhone, allergyAlert, staffNote, updatedAt, isStale } = props;

  const border = isStale ? color.stateWarning : color.borderSubtle;
  const updatedLabel = useMemo(() => {
    if (!updatedAt) {
      return 'Never updated';
    }
    return `Last updated ${formatRelative(updatedAt)}`;
  }, [updatedAt]);

  const phone = (contactPhone ?? '').trim();
  const name = (contactName ?? '').trim();
  const phoneIsLink = phone ? canUseTelLink(phone) : false;

  const onCall = useCallback(() => {
    if (!phoneIsLink) {
      return;
    }
    void Linking.openURL(`tel:${phone}`);
  }, [phone, phoneIsLink]);

  const updatedColor = !updatedAt || isStale ? color.stateWarning : color.textSecondary;

  return (
    <View
      style={{
        padding: spacing.space16,
        borderLeftWidth: 4,
        borderLeftColor: border,
        backgroundColor: color.surfaceElevated,
        borderRadius: radius.lg,
      }}
    >
      <View style={{ marginBottom: spacing.space12 }}>
        <Text variant="label" colorToken={color.textSecondary}>
          Emergency Contact
        </Text>
        <Text variant="body">{name || 'Not provided'}</Text>
      </View>

      <View style={{ marginBottom: spacing.space12 }}>
        <Text variant="label" colorToken={color.textSecondary}>
          Phone
        </Text>
        {phoneIsLink ? (
          <Pressable onPress={onCall} accessibilityRole="button" accessibilityLabel={`Call ${name || 'contact'}`}>
            <Text variant="body" colorToken={color.actionPrimary}>
              {phone}
            </Text>
          </Pressable>
        ) : (
          <View accessibilityRole="text" accessibilityLabel={phone ? `${phone}, call manually` : 'Not provided'}>
            <Text variant="body">{phone || 'Not provided'}</Text>
            {phone ? (
              <Text variant="caption" colorToken={color.textSecondary}>
                Call manually — verify number
              </Text>
            ) : null}
          </View>
        )}
      </View>

      <View style={{ marginBottom: spacing.space12 }}>
        <Text variant="label" colorToken={color.textSecondary}>
          Allergy / Medical Alert
        </Text>
        <Text variant="body" style={{ fontWeight: '600' }}>
          {(allergyAlert ?? '').trim() ? allergyAlert : 'None on file'}
        </Text>
      </View>

      {(staffNote ?? '').trim() ? (
        <View style={{ marginBottom: spacing.space12 }}>
          <Text variant="label" colorToken={color.textSecondary}>
            Staff Note
          </Text>
          <Text variant="body">{staffNote}</Text>
        </View>
      ) : null}

      <Text variant="label" colorToken={updatedColor}>
        {updatedLabel}
      </Text>
    </View>
  );
}

