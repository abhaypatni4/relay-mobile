import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { Divider } from '@/components/foundation/Divider';
import { Icon } from '@/components/foundation/Icon';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import type { RecipientGroup } from '@/types/models';

export interface RecipientSelectorProps {
  selectedGroup: RecipientGroup | null;
  onSelect: (g: RecipientGroup) => void;
  hasTravelingSquad: boolean;
}

function label(g: RecipientGroup): string {
  switch (g) {
    case 'fullTeam':
      return 'Full Team';
    case 'travelingSquad':
      return 'Traveling Squad';
    case 'coachingStaff':
      return 'Coaching Staff Only';
    case 'allStaff':
      return 'All Staff';
  }
}

const ROW_H = 56;

export function RecipientSelector({
  selectedGroup,
  onSelect,
  hasTravelingSquad,
}: RecipientSelectorProps): React.ReactElement {
  const options: RecipientGroup[] = [
    'fullTeam',
    ...(hasTravelingSquad ? (['travelingSquad'] as const) : []),
    'coachingStaff',
    'allStaff',
  ];

  return (
    <View>
      {options.map((g, idx) => {
        const selected = selectedGroup === g;
        return (
          <View key={g}>
            <Pressable
              onPress={() => onSelect(g)}
              accessibilityRole="button"
              accessibilityLabel={`${label(g)}${selected ? ', selected' : ''}`}
              style={({ pressed }) => ({
                minHeight: ROW_H,
                paddingVertical: spacing.space12,
                paddingHorizontal: spacing.space16,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: pressed ? color.surfaceInput : 'transparent',
              })}
            >
              <Text variant="body" style={{ flex: 1 }}>
                {label(g)}
              </Text>
              {selected ? <Icon name="check" size={18} color={color.stateSuccess} /> : null}
            </Pressable>
            {idx < options.length - 1 ? <Divider /> : null}
          </View>
        );
      })}
    </View>
  );
}

