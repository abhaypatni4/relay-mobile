/**
 * Primitives: HSL only (design-system-direction.md). Semantic layer references primitives.
 */

const teal = {
  teal500: 'hsl(190, 60%, 42%)',
  teal600: 'hsl(190, 60%, 35%)',
  teal700: 'hsl(190, 58%, 30%)',
  tealOnDark: 'hsl(190, 55%, 76%)',
} as const;

const neutral = {
  warmBg: 'hsl(40, 8%, 97%)',
  elevated: 'hsl(0, 0%, 100%)',
  inputBg: 'hsl(40, 8%, 93%)',
  n900: 'hsl(220, 12%, 10%)',
  n600: 'hsl(220, 8%, 45%)',
  n500: 'hsl(220, 6%, 60%)',
  n400: 'hsl(220, 4%, 72%)',
  divider: 'hsl(220, 6%, 88%)',
  dividerSubtle: 'hsl(220, 4%, 93%)',
} as const;

const green = {
  success500: 'hsl(145, 45%, 38%)',
} as const;

const red = {
  destructive500: 'hsl(4, 55%, 42%)',
  errorLight: 'hsl(4, 48%, 48%)',
} as const;

const amber = {
  urgency500: 'hsl(38, 88%, 47%)',
} as const;

const grey = {
  offline550: 'hsl(220, 8%, 55%)',
} as const;

export const colorPrimitive = { ...teal, ...neutral, ...green, ...red, ...amber, ...grey } as const;

export const color = {
  actionPrimary: colorPrimitive.teal600,
  actionPrimaryPressed: colorPrimitive.teal700,
  actionOnPrimary: colorPrimitive.elevated,
  brandMark: colorPrimitive.teal600,
  textPrimary: colorPrimitive.n900,
  textSecondary: colorPrimitive.n600,
  textLabel: colorPrimitive.n500,
  textDisabled: colorPrimitive.n400,
  surfaceBase: colorPrimitive.warmBg,
  surfaceElevated: colorPrimitive.elevated,
  surfaceInput: colorPrimitive.inputBg,
  borderDefault: colorPrimitive.divider,
  borderSubtle: colorPrimitive.dividerSubtle,
  stateSuccess: colorPrimitive.success500,
  stateWarning: colorPrimitive.urgency500,
  stateDestructive: colorPrimitive.destructive500,
  stateError: colorPrimitive.errorLight,
  stateOverdue: colorPrimitive.urgency500,
  stateOfflineBanner: colorPrimitive.offline550,
  stateStaleBorder: colorPrimitive.urgency500,
} as const;
