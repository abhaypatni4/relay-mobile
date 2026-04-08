import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import DateTimePickerNative from '@react-native-community/datetimepicker';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';

export function defaultTomorrowNine(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

export function defaultTomorrowNoon(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(12, 0, 0, 0);
  return d;
}

export function defaultNineToday(): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
}

function parseIso(s: string, fallback: Date): Date {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export interface DateTimePickerFieldProps {
  label: string;
  valueIso: string;
  onChange: (iso: string) => void;
  optional?: boolean;
  /** Native picker mode; default `datetime`. */
  pickerMode?: 'date' | 'time' | 'datetime';
}

export function DateTimePickerField({
  label,
  valueIso,
  onChange,
  optional = false,
  pickerMode = 'datetime',
}: DateTimePickerFieldProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const fallback = useMemo(() => {
    if (pickerMode === 'date') {
      return defaultTomorrowNoon();
    }
    if (pickerMode === 'time') {
      return defaultNineToday();
    }
    return defaultTomorrowNine();
  }, [pickerMode]);

  const valueDate = useMemo(
    () => (valueIso.trim() ? parseIso(valueIso, fallback) : fallback),
    [fallback, valueIso],
  );

  const displayLabel = useMemo(() => {
    if (!valueIso.trim()) {
      return optional ? 'Tap to choose (optional)' : 'Tap to choose';
    }
    try {
      const d = parseIso(valueIso, fallback);
      if (pickerMode === 'date') {
        return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(d);
      }
      if (pickerMode === 'time') {
        return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(d);
      }
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return valueIso;
    }
  }, [fallback, optional, pickerMode, valueIso]);

  const onPick = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === 'android') {
        setOpen(false);
      }
      if (event.type === 'dismissed') {
        return;
      }
      if (selected) {
        onChange(selected.toISOString());
      }
    },
    [onChange],
  );

  const a11yLabel = label.trim() ? label : displayLabel;

  return (
    <View style={{ marginBottom: spacing.space16 }}>
      {label.trim() ? (
        <Text variant="label" colorToken={color.textLabel} style={{ marginBottom: spacing.space4 }}>
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          minHeight: 48,
          paddingHorizontal: spacing.space12,
          borderRadius: radius.md,
          backgroundColor: color.surfaceInput,
          justifyContent: 'center',
        }}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
      >
        <Text variant="body" colorToken={color.textPrimary}>
          {displayLabel}
        </Text>
      </Pressable>
      {open ? (
        <DateTimePickerNative
          value={valueDate}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPick}
        />
      ) : null}
      {Platform.OS === 'ios' && open ? (
        <Pressable
          onPress={() => setOpen(false)}
          style={{ marginTop: spacing.space8, alignItems: 'flex-end' }}
        >
          <Text variant="label" colorToken={color.actionPrimary}>
            Done
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
