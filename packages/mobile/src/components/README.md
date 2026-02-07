# Components

Reusable React Native components.

## Structure

```
components/
├── ui/              # Base UI primitives
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Avatar.tsx
│   └── index.ts
├── ProjectCard.tsx
├── IdeaCard.tsx
├── UpvoteButton.tsx
├── CollaboratorAvatars.tsx
├── Skeleton.tsx
└── index.ts
```

## UI Components (ui/)

Base components following the design system:

| Component | Props | Usage |
|-----------|-------|-------|
| `Button` | variant, size, loading, disabled | Primary actions |
| `Card` | - | Content containers |
| `Input` | label, error, placeholder | Text inputs |
| `Avatar` | source, size, name | User avatars |

## Feature Components

| Component | Props | Usage |
|-----------|-------|-------|
| `ProjectCard` | project, onPress | Project list item |
| `IdeaCard` | idea, onPress | Idea list item |
| `UpvoteButton` | count, hasUpvoted, onPress | Voting |
| `CollaboratorAvatars` | collaborators, max | Avatar stack |
| `Skeleton` | width, height | Loading placeholders |

## Usage

```tsx
import { Button, Card, Input, Avatar } from '@/components/ui';
import { ProjectCard, UpvoteButton } from '@/components';

function MyScreen() {
  return (
    <Card>
      <Avatar source={{ uri: user.avatarUrl }} size={40} />
      <Input
        label="Name"
        value={name}
        onChangeText={setName}
        error={errors.name}
      />
      <Button
        title="Submit"
        onPress={handleSubmit}
        loading={isSubmitting}
      />
    </Card>
  );
}
```
