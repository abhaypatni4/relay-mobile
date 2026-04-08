import React from 'react';
import { TextInput as RNTextInput, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';

export interface TextAreaInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (t: string) => void;
  maxLength?: number;
}

export function TextAreaInput({
  label,
  placeholder,
  value,
  onChangeText,
  maxLength,
}: TextAreaInputProps): React.ReactElement {
  const showCount = maxLength !== undefined && value.length >= Math.floor(maxLength * 0.8);
  return (
    <View style={{ marginBottom: spacing.space16 }}>
      {label ? (
        <Text variant="label" colorToken={color.textLabel} style={{ marginBottom: spacing.space4 }}>
          {label}
        </Text>
      ) : null}
      <RNTextInput
        placeholder={placeholder}
        placeholderTextColor={color.textDisabled}
        value={value}
        onChangeText={onChangeText}
        multiline
        maxLength={maxLength}
        textAlignVertical="top"
        style={{
          minHeight: 100,
          paddingHorizontal: spacing.space12,
          paddingVertical: spacing.space12,
          borderRadius: radius.md,
          backgroundColor: color.surfaceInput,
          color: color.textPrimary,
          fontSize: 16,
          lineHeight: 22,
        }}
      />
      {showCount && maxLength !== undefined ? (
        <Text variant="caption" colorToken={color.textSecondary} style={{ marginTop: spacing.space4 }}>
          {value.length}/{maxLength}
        </Text>
      ) : null}
    </View>
  );
}
