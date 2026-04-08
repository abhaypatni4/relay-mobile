import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { Icon } from '@/components/foundation/Icon';
import { LoadingButton } from '@/components/feedback/LoadingButton';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

export function PlayerChecklistItem(props: {
  itemName: string;
  isConfirmed: boolean;
  isBlocked: boolean;
  onConfirm: () => void;
  isConfirming?: boolean;
}): React.ReactElement {
  const { itemName, isConfirmed, isBlocked, onConfirm, isConfirming } = props;

  return (
    <View
      style={{
        paddingVertical: spacing.space12,
        borderBottomWidth: 1,
        borderBottomColor: color.borderSubtle,
      }}
    >
      <Text variant="body" style={{ marginBottom: spacing.space8 }}>
        {itemName}
      </Text>

      {isBlocked ? (
        <Text variant="caption" colorToken={color.textSecondary}>
          Awaiting app setup
        </Text>
      ) : isConfirmed ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityLabel="Confirmed">
          <Icon name="check" size={18} color={color.stateSuccess} />
          <View style={{ width: spacing.space8 }} />
          <Text variant="label" colorToken={color.stateSuccess}>
            I have this
          </Text>
        </View>
      ) : (
        <LoadingButton
          label="I have this"
          isLoading={Boolean(isConfirming)}
          disabled={false}
          onPress={onConfirm}
        />
      )}
    </View>
  );
}

export function CoordinatorChecklistItem(props: {
  itemName: string;
  confirmedCount: number;
  totalApplicable: number;
  onViewBreakdown: () => void;
}): React.ReactElement {
  const { itemName, confirmedCount, totalApplicable, onViewBreakdown } = props;
  const label = useMemo(() => `${confirmedCount} of ${totalApplicable} confirmed`, [confirmedCount, totalApplicable]);

  return (
    <Pressable
      onPress={onViewBreakdown}
      accessibilityRole="button"
      style={{
        paddingVertical: spacing.space12,
        borderBottomWidth: 1,
        borderBottomColor: color.borderSubtle,
      }}
    >
      <Text variant="body" style={{ marginBottom: spacing.space4 }}>
        {itemName}
      </Text>
      <Text variant="label" colorToken={color.textSecondary}>
        {label}
      </Text>
    </Pressable>
  );
}

