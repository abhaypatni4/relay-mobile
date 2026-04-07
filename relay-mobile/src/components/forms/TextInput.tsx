import React from 'react';
import { TextInput as RNTextInput, View, type TextInputProps as RNTextInputProps } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label: string;
  errorMessage?: string;
}

export function TextInput({
  label,
  errorMessage,
  secureTextEntry,
  ...rest
}: TextInputProps): React.ReactElement {
  return (
    <View style={{ marginBottom: spacing.space16 }}>
      <Text variant="label" colorToken={color.textLabel} style={{ marginBottom: spacing.space4 }}>
        {label}
      </Text>
      <RNTextInput
        placeholderTextColor={color.textDisabled}
        secureTextEntry={secureTextEntry}
        style={{
          minHeight: 48,
          paddingHorizontal: spacing.space12,
          borderRadius: radius.md,
          backgroundColor: color.surfaceInput,
          color: color.textPrimary,
          borderWidth: errorMessage ? 1 : 0,
          borderColor: errorMessage ? color.stateError : 'transparent',
        }}
        {...rest}
      />
      {errorMessage ? (
        <Text variant="caption" colorToken={color.stateError} style={{ marginTop: spacing.space4 }}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
