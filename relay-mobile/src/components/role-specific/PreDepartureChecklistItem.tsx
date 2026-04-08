import React from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/foundation/Icon';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

export function PreDepartureChecklistItem(props: {
  label: string;
  isComplete: boolean;
  isAutoPopulated: boolean;
  currentCount?: number;
  totalCount?: number;
  onToggle?: () => void;
  onViewDetail?: () => void;
}): React.ReactElement {
  const { label, isComplete, isAutoPopulated, currentCount, totalCount, onToggle, onViewDetail } = props;
  const action = isAutoPopulated ? onViewDetail : onToggle;
  const checkboxColor = isComplete ? color.stateSuccess : color.textDisabled;
  return (
    <Pressable
      onPress={action}
      accessibilityRole="button"
      style={{
        paddingVertical: spacing.space12,
        borderBottomWidth: 1,
        borderBottomColor: color.borderSubtle,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ marginRight: spacing.space8 }}>
        <Icon name={isComplete ? 'check' : 'note'} size={18} color={checkboxColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        {isAutoPopulated ? (
          <Text variant="label" colorToken={color.textSecondary}>
            {currentCount ?? 0} of {totalCount ?? 0}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

