import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import axios from 'axios';
import { Text } from '@/components/foundation/Text';
import { Icon } from '@/components/foundation/Icon';
import {
  useTripAcknowledgment,
  type SquadAssignmentAckRef,
  type TripWorkspaceAckRef,
} from '@/hooks/useTripAcknowledgment';
import { useUiStore } from '@/store/uiStore';
import { color } from '@/tokens/colors';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';

export interface AcknowledgmentButtonProps {
  eventId: string | null;
  tripWorkspace: TripWorkspaceAckRef | null | undefined;
  currentMemberAssignment: SquadAssignmentAckRef | null | undefined;
}
const MIN_TOUCH_TARGET = 48; // WCAG minimum touch target

function triggerAckHaptic(): void {
  if (Platform.OS === 'ios') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function AcknowledgmentButton({
  eventId,
  tripWorkspace,
  currentMemberAssignment,
}: AcknowledgmentButtonProps): React.ReactElement | null {
  const isOffline = useUiStore((s) => s.isOffline);
  const addToast = useUiStore((s) => s.addToast);
  const { needsAcknowledgment, isAcknowledged, needsReacknowledgment, acknowledge } = useTripAcknowledgment(
    eventId,
    tripWorkspace,
    currentMemberAssignment,
  );

  const [optimisticConfirmed, setOptimisticConfirmed] = useState(false);

  useEffect(() => {
    if (isAcknowledged) {
      setOptimisticConfirmed(false);
    }
  }, [isAcknowledged]);

  const showConfirmedUi = optimisticConfirmed || isAcknowledged;

  const onPress = useCallback(async () => {
    if (isOffline || !needsAcknowledgment) {
      return;
    }
    setOptimisticConfirmed(true);
    requestAnimationFrame(() => {
      triggerAckHaptic();
    });
    try {
      await acknowledge();
    } catch (e: unknown) {
      setOptimisticConfirmed(false);
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        return;
      }
      addToast('error', "Couldn't save — check your connection");
    }
  }, [acknowledge, addToast, isOffline, needsAcknowledgment]);

  if (!tripWorkspace?.isPublished || currentMemberAssignment?.travelingStatus !== 'traveling') {
    return null;
  }

  if (isOffline) {
    return (
      <View style={{ marginTop: spacing.space16 }}>
        <View
          style={{
            minHeight: MIN_TOUCH_TARGET,
            borderRadius: radius.md,
            backgroundColor: color.surfaceInput,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.space16,
          }}
        >
          <Text variant="label" colorToken={color.textSecondary}>
            Available when connected
          </Text>
        </View>
      </View>
    );
  }

  if (showConfirmedUi) {
    return (
      <View
        style={{
          marginTop: spacing.space16,
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: MIN_TOUCH_TARGET,
        }}
        accessibilityRole="text"
        accessibilityLabel="Confirmed"
      >
        <Icon name="check" size={22} color={color.stateSuccess} />
        <Text variant="label" colorToken={color.stateSuccess} style={{ marginLeft: spacing.space8 }}>
          Confirmed
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: spacing.space16 }}>
      {needsReacknowledgment ? (
        <Text
          variant="caption"
          colorToken={color.stateWarning}
          style={{ marginBottom: spacing.space8 }}
        >
          Departure time has changed — please re-confirm
        </Text>
      ) : null}
      <Pressable
        onPress={() => void onPress()}
        disabled={!needsAcknowledgment}
        style={({ pressed }) => ({
          minHeight: MIN_TOUCH_TARGET,
          borderRadius: radius.md,
          backgroundColor: color.actionPrimary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed && needsAcknowledgment ? 0.92 : 1,
        })}
        accessibilityRole="button"
        accessibilityLabel="I've got it, confirm itinerary"
      >
        <Text variant="label" colorToken={color.actionOnPrimary}>
          I&apos;ve got it
        </Text>
      </Pressable>
    </View>
  );
}
