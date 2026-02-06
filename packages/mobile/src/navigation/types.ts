import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Stack param lists
export type AuthStackParamList = {
  Login: undefined;
};

export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetail: { projectId: string };
  ProjectForm: { projectId?: string };
};

export type IdeasStackParamList = {
  IdeasList: undefined;
  IdeaDetail: { ideaId: string };
  IdeaForm: { ideaId?: string };
};

export type ProfileStackParamList = {
  Profile: { userId?: string };
  ProfileEdit: undefined;
};

export type NotificationsStackParamList = {
  NotificationsList: undefined;
};

// Tab param list
export type MainTabParamList = {
  ProjectsTab: NavigatorScreenParams<ProjectsStackParamList>;
  IdeasTab: NavigatorScreenParams<IdeasStackParamList>;
  NotificationsTab: NavigatorScreenParams<NotificationsStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// Root param list
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Screen props types
export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type ProjectsStackScreenProps<T extends keyof ProjectsStackParamList> =
  NativeStackScreenProps<ProjectsStackParamList, T>;

export type IdeasStackScreenProps<T extends keyof IdeasStackParamList> =
  NativeStackScreenProps<IdeasStackParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;

export type NotificationsStackScreenProps<T extends keyof NotificationsStackParamList> =
  NativeStackScreenProps<NotificationsStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

// Declare global types for useNavigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
