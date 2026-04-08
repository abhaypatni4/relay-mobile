import React, { useCallback, useState } from 'react';
import { TextInput as RNTextInput, View, type TextInputProps as RNTextInputProps } from 'react-native';
import { InlineError } from '@/components/feedback/InlineError';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';

export interface TextInputProps extends Omit<RNTextInputProps, 'style' | 'placeholder'> {
  label: string;
  /** When false (default), field is required and shows InlineError on blur if empty. */
  optional?: boolean;
  placeholder?: string;
}

export function TextInput({
  label,
  optional = false,
  placeholder,
  value,
  onBlur,
  onChangeText,
  ...rest
}: TextInputProps): React.ReactElement {
  const MIN_TOUCH_TARGET = 48; // WCAG minimum touch target
  const [blurred, setBlurred] = useState(false);
  const showError = !optional && blurred && !(value ?? '').toString().trim();
  const mergedPlaceholder =
    placeholder === undefined
      ? optional
        ? '(optional)'
        : undefined
      : optional
        ? `${placeholder} (optional)`
        : placeholder;

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<RNTextInputProps['onBlur']>>[0]) => {
      setBlurred(true);
      onBlur?.(e);
    },
    [onBlur],
  );

  return (
    <View style={{ marginBottom: spacing.space16 }}>
      {label ? (
        <Text variant="label" colorToken={color.textLabel} style={{ marginBottom: spacing.space4 }}>
          {label}
        </Text>
      ) : null}
      <RNTextInput
        placeholderTextColor={color.textDisabled}
        placeholder={mergedPlaceholder}
        value={value}
        onChangeText={onChangeText}
        onBlur={handleBlur}
        style={{
          minHeight: MIN_TOUCH_TARGET,
          paddingHorizontal: spacing.space12,
          borderRadius: radius.md,
          backgroundColor: color.surfaceInput,
          color: color.textPrimary,
          borderWidth: showError ? 1 : 0,
          borderColor: showError ? color.stateError : 'transparent',
        }}
        {...rest}
      />
      {showError ? <InlineError message="This field is required." /> : null}
    </View>
  );
}
