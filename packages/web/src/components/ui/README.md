# UI Components

Base UI primitives used throughout the web application.

## Available Components

| Component | Purpose |
|-----------|---------|
| `Button` | Primary action trigger with variants |
| `Card` | Content container with shadow |
| `Input` | Form text input with label/error |
| `Textarea` | Multi-line text input |
| `Select` | Dropdown select |
| `Modal` | Dialog overlay |
| `Badge` | Status indicators |
| `Avatar` | User avatar image with fallback |
| `Spinner` | Loading indicator |
| `Skeleton` | Loading placeholder |
| `Toast` | Notification toast |
| `ToastProvider` | Toast context provider |
| `EmptyState` | No data placeholder |
| `ErrorBoundary` | Error catch boundary |
| `LoadingPage` | Full page loader |

## Button

```tsx
<Button variant="primary" size="md" loading={false} disabled={false}>
  Submit
</Button>

// Variants: primary, secondary, outline, ghost, danger
// Sizes: sm, md, lg
```

## Input / Textarea

```tsx
<Input
  label="Email"
  type="email"
  placeholder="Enter email"
  error={errors.email?.message}
  {...register('email')}
/>

<Textarea
  label="Description"
  rows={4}
  error={errors.description?.message}
  {...register('description')}
/>
```

## Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
>
  <p>Are you sure?</p>
  <Button onClick={handleConfirm}>Confirm</Button>
</Modal>
```

## Toast

```tsx
import { useToast } from '@/components/ui';

function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast({ type: 'success', message: 'Saved!' });
  };
}
```

## Usage

Import from `@/components/ui`:
```typescript
import { Button, Card, Input, Modal } from '@/components/ui';
```
