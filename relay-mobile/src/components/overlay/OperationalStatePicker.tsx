import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { BottomSheet } from '@/components/overlay/BottomSheet';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import type { OperationalStatus, Role } from '@/types/models';

export interface OperationalStatePickerProps {
  visible: boolean;
  onClose: () => void;
  memberName: string;
  current: OperationalStatus;
  viewerRole: Role;
  onSelect: (status: OperationalStatus) => void;
}

type RowDef = { value: OperationalStatus; label: string };
const MIN_TOUCH_TARGET = 48; // WCAG minimum touch target

function rowsForRole(role: Role): RowDef[] {
  if (role === 'coordinator') {
    return [
      { value: 'selected', label: 'Selected' },
      { value: 'notSelected', label: 'Not Selected' },
      { value: 'traveling', label: 'Traveling' },
      { value: 'medicallyRestricted', label: 'Medically Restricted' },
      { value: 'unassigned', label: 'Unassigned' },
    ];
  }
  return [
    { value: 'selected', label: 'Selected' },
    { value: 'notSelected', label: 'Not Selected' },
    { value: 'traveling', label: 'Traveling' },
    { value: 'unassigned', label: 'Unassigned' },
  ];
}

export function OperationalStatePicker({
  visible,
  onClose,
  memberName,
  current,
  viewerRole,
  onSelect,
}: OperationalStatePickerProps): React.ReactElement {
  const [medicalConfirm, setMedicalConfirm] = useState(false);
  const rows = useMemo(() => rowsForRole(viewerRole), [viewerRole]);

  useEffect(() => {
    if (!visible) {
      setMedicalConfirm(false);
    }
  }, [visible]);

  const trySelect = useCallback(
    (value: OperationalStatus) => {
      const isCoach = viewerRole === 'coach';
      const needsWarn =
        isCoach && current === 'medicallyRestricted' && value === 'selected' && !medicalConfirm;
      if (needsWarn) {
        setMedicalConfirm(true);
        return;
      }
      onSelect(value);
      setMedicalConfirm(false);
      onClose();
    },
    [current, medicalConfirm, onClose, onSelect, viewerRole],
  );

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text variant="title" style={{ marginBottom: spacing.space16 }}>
        {memberName}
      </Text>
      {medicalConfirm ? (
        <View style={{ marginBottom: spacing.space16 }}>
          <Text variant="body" colorToken={color.stateWarning} style={{ marginBottom: spacing.space12 }}>
            This player is currently marked as medically restricted.
          </Text>
          <Pressable
            onPress={() => trySelect('selected')}
            style={{
              minHeight: MIN_TOUCH_TARGET,
              borderRadius: radius.md,
              backgroundColor: color.actionPrimary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Confirm selection override"
          >
            <Text variant="label" colorToken={color.actionOnPrimary}>
              Confirm selection
            </Text>
          </Pressable>
        </View>
      ) : (
        rows.map((r) => {
          const active = current === r.value;
          return (
            <Pressable
              key={r.value}
              onPress={() => trySelect(r.value)}
              style={{
                minHeight: spacing.space48,
                paddingVertical: spacing.space12,
                paddingHorizontal: spacing.space12,
                marginBottom: spacing.space8,
                borderRadius: radius.md,
                borderWidth: active ? 2 : 1,
                borderColor: active ? color.actionPrimary : color.borderSubtle,
                backgroundColor: color.surfaceElevated,
                justifyContent: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel={r.label}
            >
              <Text variant="body">{r.label}</Text>
            </Pressable>
          );
        })
      )}
    </BottomSheet>
  );
}
