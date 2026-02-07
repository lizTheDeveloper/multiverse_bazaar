# Screens

Screen components organized by feature.

## Structure

```
screens/
├── auth/
│   └── LoginScreen.tsx
├── projects/
│   ├── ProjectsScreen.tsx
│   ├── ProjectDetailScreen.tsx
│   └── ProjectFormScreen.tsx
├── ideas/
│   ├── IdeasScreen.tsx
│   ├── IdeaDetailScreen.tsx
│   └── IdeaFormScreen.tsx
├── notifications/
│   └── NotificationsScreen.tsx
└── profile/
    ├── ProfileScreen.tsx
    └── ProfileEditScreen.tsx
```

## Screen Types

### List Screens
- `ProjectsScreen` - Scrollable project list with filters
- `IdeasScreen` - Idea board with status tabs
- `NotificationsScreen` - Notification list with read/unread

### Detail Screens
- `ProjectDetailScreen` - Full project view with collaborators
- `IdeaDetailScreen` - Idea with interest list

### Form Screens
- `ProjectFormScreen` - Create/edit project
- `IdeaFormScreen` - Create/edit idea
- `ProfileEditScreen` - Edit user profile
- `LoginScreen` - Email/password or magic link login

## Navigation Props

Screens receive navigation and route props:

```tsx
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProjectsStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProjectsStackParamList, 'ProjectDetail'>;

function ProjectDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  // ...
}
```

## Screen Pattern

```tsx
function FeatureScreen({ navigation }: Props) {
  const { data, isLoading, error, refetch } = useData();

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={data}
        renderItem={({ item }) => <ItemCard item={item} />}
        refreshing={isLoading}
        onRefresh={refetch}
      />
    </SafeAreaView>
  );
}
```
