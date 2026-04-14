import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Icon } from '@/components/foundation/Icon';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { AvailabilityStatus } from '@/types/models';

export interface AvailabilityPickerProps {
  currentStatus: AvailabilityStatus | null;
  onSelect: (v: AvailabilityStatus) => void;
  isLocked?: boolean;
}

const OPTIONS: { value: AvailabilityStatus; label: string; icon: 'check' | 'minus' | 'x'; fg: string; border: string }[] = [
  { value: 'available', label: 'Available', icon: 'check', fg: color.stateSuccess, border: color.stateSuccess },
  { value: 'limited', label: 'Limited', icon: 'minus', fg: color.stateWarning, border: color.stateWarning },
  { value: 'unavailable', label: 'Unavailable', icon: 'x', fg: color.stateDestructive, border: color.stateDestructive },
];
const MIN_TOUCH_TARGET = 64; // Product requirement for availability option touch size

function triggerTapHaptic(): void {
  if (Platform.OS === 'ios') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function AvailabilityPicker({
  currentStatus,
  onSelect,
  isLocked = false,
}: AvailabilityPickerProps): React.ReactElement {
  const onPick = useCallback(
    (v: AvailabilityStatus) => {
      if (isLocked) {
        return;
      }
      triggerTapHaptic();
      onSelect(v);
    },
    [isLocked, onSelect],
  );

  return (
    <View style={{ marginBottom: spacing.space16 }}>
      {OPTIONS.map((opt) => {
        const selected = currentStatus === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onPick(opt.value)}
            disabled={isLocked}
            accessibilityRole="button"
            accessibilityLabel={`${opt.label}, tap to select`}
            style={{
              minHeight: MIN_TOUCH_TARGET,
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name={opt.icon} size={18} color={opt.fg} />
              <Text variant="label" style={{ color: opt.fg, marginLeft: spacing.space8 }}>
                {opt.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
