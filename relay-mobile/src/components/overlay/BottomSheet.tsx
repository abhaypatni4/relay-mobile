import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '@/tokens/colors';
import { duration } from '@/tokens/duration';
import { spacing } from '@/tokens/spacing';

const SCREEN_H = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 120;

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  contentContainerStyle,
}: BottomSheetProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [reduceMotion, setReduceMotion] = useState(false);
  const backdrop = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(SCREEN_H)).current;
  const dragY = useRef(0);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const openAnim = useCallback(() => {
    if (reduceMotion) {
      backdrop.setValue(1);
      sheetY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: duration.toastIn,
        useNativeDriver: true,
      }),
      Animated.spring(sheetY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 65,
      }),
    ]).start();
  }, [backdrop, reduceMotion, sheetY]);

  const closeAnim = useCallback(
    (then?: () => void) => {
      if (reduceMotion) {
        backdrop.setValue(0);
        sheetY.setValue(SCREEN_H);
        then?.();
        return;
      }
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: duration.toastOut,
          useNativeDriver: true,
        }),
        Animated.timing(sheetY, {
          toValue: SCREEN_H,
          duration: duration.toastOut,
          useNativeDriver: true,
        }),
      ]).start(() => then?.());
    },
    [backdrop, reduceMotion, sheetY],
  );

  useEffect(() => {
    if (visible) {
      setMounted(true);
      sheetY.setValue(reduceMotion ? 0 : SCREEN_H);
      backdrop.setValue(reduceMotion ? 1 : 0);
      requestAnimationFrame(() => openAnim());
    } else if (mounted) {
      closeAnim(() => setMounted(false));
    }
  }, [visible, mounted, openAnim, closeAnim, backdrop, sheetY, reduceMotion]);

  const requestClose = useCallback(() => {
    closeAnim(() => {
      setMounted(false);
      onClose();
    });
  }, [closeAnim, onClose]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) {
            dragY.current = g.dy;
            sheetY.setValue(g.dy);
          }
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > DISMISS_THRESHOLD || g.vy > 0.8) {
            requestClose();
          } else {
            Animated.spring(sheetY, {
              toValue: 0,
              useNativeDriver: true,
              friction: 8,
            }).start();
          }
          dragY.current = 0;
        },
      }),
    [requestClose, sheetY],
  );

  if (!mounted) {
    return null;
  }

  const sheetTransform = reduceMotion
    ? []
    : [
        {
          translateY: sheetY.interpolate({
            inputRange: [0, SCREEN_H],
            outputRange: [0, SCREEN_H],
            extrapolate: 'clamp',
          }),
        },
      ];

  return (
    <Modal visible={mounted} animationType="none" transparent onRequestClose={requestClose}>
      <View style={{ flex: 1 }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={requestClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Animated.View
            pointerEvents="none"
            style={{
              flex: 1,
              backgroundColor: color.textPrimary,
              opacity: backdrop.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.45],
              }),
            }}
          />
        </Pressable>
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: SCREEN_H * 0.88,
            paddingBottom: insets.bottom + spacing.space8,
            backgroundColor: color.surfaceElevated,
            borderTopLeftRadius: spacing.space16,
            borderTopRightRadius: spacing.space16,
            ...Platform.select({
              android: { elevation: 16 },
              ios: {
                shadowColor: color.textPrimary,
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
              },
              default: {},
            }),
            transform: sheetTransform,
            opacity: reduceMotion ? backdrop : 1,
          }}
        >
          <View {...panResponder.panHandlers} style={{ paddingTop: spacing.space8 }}>
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: color.borderDefault,
                marginBottom: spacing.space12,
              }}
            />
          </View>
          <View style={[{ paddingHorizontal: spacing.space16 }, contentContainerStyle]}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}
