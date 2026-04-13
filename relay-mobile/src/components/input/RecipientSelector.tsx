import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/foundation/Text';
import { Divider } from '@/components/foundation/Divider';
import { Icon } from '@/components/foundation/Icon';
import { color } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import type { RecipientGroup } from '@/types/models';

export interface RecipientSelectorProps {
  selectedGroup: RecipientGroup | null;
  onSelect: (g: RecipientGroup) => void;
  hasActiveTrip?: boolean;
}

function label(g: RecipientGroup): string {
  switch (g) {
    case 'fullTeam':
      return 'Full Team';
    case 'travelingSquad':
      return 'Traveling squad';
    case 'players':
      return 'Players only';
    case 'coaches':
      return 'Coaches only';
    case 'staff':
      return 'Staff only';
    case 'coachingStaff':
      return 'Coaching staff';
    case 'allStaff':
      return 'All Staff';
  }
}

const ROW_H = 56;

export function RecipientSelector({
  selectedGroup,
  onSelect,
  hasActiveTrip = true,
}: RecipientSelectorProps): React.ReactElement {
  const { role } = useCurrentMember();
  const options = React.useMemo<RecipientGroup[]>(() => {
    const base: RecipientGroup[] = ['fullTeam', 'players', 'travelingSquad'];
    if (role === 'coordinator') {
      return ['fullTeam', 'players', 'coachingStaff', 'travelingSquad'];
    }
    return base;
  }, [role]);

  return (
    <View>
      {options.map((g, idx) => {
        const selected = selectedGroup === g;
        const disabled = g === 'travelingSquad' && !hasActiveTrip;
        return (
          <View key={g}>
            <Pressable
              onPress={() => {
                if (disabled) {
                  return;
                }
                onSelect(g);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${label(g)}${selected ? ', selected' : ''}`}
              disabled={disabled}
              style={({ pressed }) => ({
                minHeight: ROW_H,
                paddingVertical: spacing.space12,
                paddingHorizontal: spacing.space16,
                flexDirection: 'row',
                alignItems: 'center',
                opacity: disabled ? 0.5 : 1,
                backgroundColor: pressed && !disabled ? color.surfaceInput : 'transparent',
              })}
            >
              <Text variant="body" style={{ flex: 1 }}>
                {label(g)}
              </Text>
              {selected ? <Icon name="check" size={18} color={color.stateSuccess} /> : null}
            </Pressable>
            {g === 'travelingSquad' && !hasActiveTrip ? (
              <Text
                variant="caption"
                style={{ color: color.textSecondary, paddingHorizontal: spacing.space16, paddingBottom: spacing.space8 }}
              >
                Only available when a trip is active
              </Text>
            ) : null}
            {idx < options.length - 1 ? <Divider /> : null}
          </View>
        );
      })}
    </View>
  );
}

