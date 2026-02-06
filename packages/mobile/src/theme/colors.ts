export const colors = {
  // Primary
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',

  // Neutrals
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Background
  background: '#ffffff',
  backgroundSecondary: '#f9fafb',
  card: '#ffffff',

  // Text
  text: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',

  // Borders
  border: '#e5e7eb',
  borderDark: '#d1d5db',

  // Tab bar
  tabBarActive: '#6366f1',
  tabBarInactive: '#9ca3af',
} as const;

export type Colors = typeof colors;
