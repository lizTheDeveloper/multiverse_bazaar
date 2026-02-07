# Theme

Design system tokens for the mobile app.

## Files

| File | Contents |
|------|----------|
| `colors.ts` | Color palette |
| `typography.ts` | Font sizes, weights |
| `spacing.ts` | Spacing scale |
| `index.ts` | Aggregates all exports |

## Colors (colors.ts)

```typescript
export const colors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
};
```

## Typography (typography.ts)

```typescript
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
```

## Spacing (spacing.ts)

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};
```

## Usage

```tsx
import { colors, typography, spacing } from '@/theme';

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
});
```
