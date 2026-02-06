import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Preset styles
  h1: {
    fontSize: 30,
    fontWeight: '700' as const,
    fontFamily,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    fontFamily,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    fontFamily,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    fontFamily,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    fontFamily,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    fontFamily,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    fontFamily,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily,
  },
} as const;

export type Typography = typeof typography;
