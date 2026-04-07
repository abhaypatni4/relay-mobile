import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/foundation/Text';
import { color } from '@/tokens/colors';
import { duration } from '@/tokens/duration';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';
import { useUiStore } from '@/store/uiStore';

export function ToastHost(): React.ReactElement | null {
  const toastQueue = useUiStore((s) => s.toastQueue);
  const dismissToast = useUiStore((s) => s.dismissToast);
  const current = toastQueue[0];
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!current) {
      return;
    }
    slide.setValue(80);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0,
        duration: duration.toastIn,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration.toastIn,
        useNativeDriver: true,
      }),
    ]).start();

    const ms = current.variant === 'error' ? 4000 : 3000;
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 80,
          duration: duration.toastOut,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: duration.toastOut,
          useNativeDriver: true,
        }),
      ]).start(() => dismissToast(current.id));
    }, ms);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [current, dismissToast, opacity, slide]);

  if (!current) {
    return null;
  }

  const bg =
    current.variant === 'error' ? color.stateError : color.stateSuccess;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: spacing.space16,
        right: spacing.space16,
        bottom: insets.bottom + spacing.space48 + spacing.space8,
        transform: [{ translateY: slide }],
        opacity,
      }}
    >
      <View
        style={{
          padding: spacing.space16,
          borderRadius: radius.md,
          backgroundColor: bg,
        }}
      >
        <Text variant="label" colorToken={color.surfaceElevated}>
          {current.message}
        </Text>
      </View>
    </Animated.View>
  );
}
