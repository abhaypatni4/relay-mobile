import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { AvailabilityStatus } from '@/types/models';

export interface AvailabilityPickerProps {
  value: AvailabilityStatus | null;
  onChange: (v: AvailabilityStatus) => void;
  readOnly?: boolean;
}

const OPTIONS: { value: AvailabilityStatus; label: string; fg: string; border: string }[] = [
  { value: 'available', label: 'Available', fg: color.stateSuccess, border: color.stateSuccess },
  { value: 'limited', label: 'Limited', fg: color.stateWarning, border: color.stateWarning },
  { value: 'unavailable', label: 'Unavailable', fg: color.stateDestructive, border: color.stateDestructive },
];

function triggerTapHaptic(): void {
  if (Platform.OS === 'ios') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function AvailabilityPicker({
  value,
  onChange,
  readOnly = false,
}: AvailabilityPickerProps): React.ReactElement {
  const onPick = useCallback(
    (v: AvailabilityStatus) => {
      if (readOnly) {
        return;
      }
      triggerTapHaptic();
      onChange(v);
    },
    [onChange, readOnly],
  );

  return (
    <View style={{ marginBottom: spacing.space16 }}>
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onPick(opt.value)}
            disabled={readOnly}
            accessibilityRole="button"
            accessibilityLabel={`${opt.label}, tap to select`}
            style={{
              minHeight: 64,
              width: '100%',
              marginBottom: spacing.space12,
              paddingHorizontal: spacing.space16,
              paddingVertical: spacing.space12,
              borderRadius: radius.md,
              borderWidth: 2,
              borderColor: selected ? opt.border : color.borderSubtle,
              backgroundColor: color.surfaceElevated,
              justifyContent: 'center',
            }}
          >
            <Text variant="label" style={{ color: opt.fg }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
