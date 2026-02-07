# Navigation

React Navigation configuration for the mobile app.

## Structure

```
RootNavigator
├── AuthStack (when !isAuthenticated && !isGuest)
│   └── Login
└── MainTabs (when isAuthenticated || isGuest)
    ├── Projects (ProjectsStack)
    ├── Ideas (IdeasStack)
    ├── Notifications (NotificationsStack)
    └── Profile (ProfileStack)
```

## Files

| File | Purpose |
|------|---------|
| `RootNavigator.tsx` | Root switch between auth and main |
| `AuthStack.tsx` | Login/registration flow |
| `MainTabs.tsx` | Bottom tab navigator |
| `ProjectsStack.tsx` | Projects stack navigator |
| `IdeasStack.tsx` | Ideas stack navigator |
| `NotificationsStack.tsx` | Notifications stack |
| `ProfileStack.tsx` | Profile stack |
| `types.ts` | TypeScript param lists |

## Type Definitions (types.ts)

```typescript
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Projects: undefined;
  Ideas: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetail: { id: string };
  ProjectForm: { id?: string };
};
```

## Usage

```typescript
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProjectsStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<ProjectsStackParamList>;

function MyComponent() {
  const navigation = useNavigation<NavigationProp>();

  const goToDetail = (id: string) => {
    navigation.navigate('ProjectDetail', { id });
  };
}
```

## Auth Flow

RootNavigator checks:
1. `isLoading` - Shows loading spinner
2. `isAuthenticated` - User logged in
3. `isGuest` - Browsing without account

If authenticated OR guest → show MainTabs
Otherwise → show AuthStack
