import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  View,
  type LayoutRectangle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { color } from '@/tokens/colors';
import { duration } from '@/tokens/duration';
import { radius } from '@/tokens/radius';
import { spacing } from '@/tokens/spacing';

export type SkeletonVariant = 'listRow' | 'card';

export interface SkeletonLoaderProps {
  variant: SkeletonVariant;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonLoader({ variant, style }: SkeletonLoaderProps): React.ReactElement {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [layout, setLayout] = useState<LayoutRectangle | null>(null);
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion || !layout) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: layout.width,
        duration: duration.skeletonShimmer,
        useNativeDriver: true,
      }),
    );
    x.setValue(-layout.width * 0.5);
    loop.start();
    return () => {
      loop.stop();
    };
  }, [reduceMotion, layout, x]);

  const baseStyle = useMemo(() => {
    if (variant === 'card') {
      return {
        height: spacing.space48 * 2,
        borderRadius: radius.md,
        width: '100%' as const,
      };
    }
    return {
      height: 56,
      borderRadius: radius.sm,
      width: '100%' as const,
    };
  }, [variant]);

  return (
    <View
      style={[{ overflow: 'hidden', backgroundColor: color.borderSubtle }, baseStyle, style]}
      onLayout={(e) => setLayout(e.nativeEvent.layout)}
    >
      {!reduceMotion && layout ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: layout.width * 0.4,
            transform: [{ translateX: x }],
            backgroundColor: color.surfaceElevated,
            opacity: 0.7,
          }}
        />
      ) : null}
    </View>
  );
}
