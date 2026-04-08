import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { BottomSheet } from '@/components/overlay/BottomSheet';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

export interface ConfirmationSheetProps {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmationSheet({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  isDestructive,
  onConfirm,
  onCancel,
}: ConfirmationSheetProps): React.ReactElement {
  const MIN_TOUCH_TARGET = 48; // WCAG minimum touch target
  const [loading, setLoading] = useState(false);

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <Text variant="title" style={{ marginBottom: spacing.space12 }}>
        {title}
      </Text>
      <Text variant="body" colorToken={color.textSecondary} style={{ marginBottom: spacing.space24 }}>
        {body}
      </Text>
      <LoadingButton
        label={confirmLabel}
        isLoading={loading}
        variant={isDestructive ? 'destructive' : 'primary'}
        onPress={() => {
          setLoading(true);
          void Promise.resolve(onConfirm()).finally(() => setLoading(false));
        }}
      />
      <View style={{ height: spacing.space12 }} />
      <Pressable
        onPress={onCancel}
        style={{ minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' }}
        accessibilityRole="button"
      >
        <Text variant="label" colorToken={color.actionPrimary}>
          {cancelLabel}
        </Text>
      </Pressable>
      <View style={{ height: spacing.space8 }} />
    </BottomSheet>
  );
}
