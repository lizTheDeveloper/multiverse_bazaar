export const spacing = {
  // Base spacing scale
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,

  // Semantic spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,

  // Screen padding
  screenHorizontal: 16,
  screenVertical: 16,

  // Card padding
  cardPadding: 16,
  cardGap: 12,

  // Input
  inputPadding: 12,

  // Button
  buttonPaddingHorizontal: 16,
  buttonPaddingVertical: 12,
} as const;

export type Spacing = typeof spacing;
