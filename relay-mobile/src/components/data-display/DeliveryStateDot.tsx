import React from 'react';
import type { ViewStyle } from 'react-native';
import { StatusDot } from './StatusDot';

export interface DeliveryStateDotProps {
  state: 'notSeen' | 'seen' | 'acknowledged' | 'overdue';
  accessibilityLabel: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function DeliveryStateDot({
  state,
  accessibilityLabel,
  size = 'sm',
}: DeliveryStateDotProps): React.ReactElement {
  return <StatusDot status={state} size={size} accessibilityLabel={accessibilityLabel} />;
}
