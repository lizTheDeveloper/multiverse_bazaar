import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/hooks/useAuth';
import { RootNavigator, RootStackParamList } from './src/navigation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['multiverse-bazaar://'],
  config: {
    screens: {
      Main: {
        screens: {
          ProjectsTab: {
            screens: {
              ProjectsList: 'projects',
              ProjectDetail: 'projects/:projectId',
            },
          },
          IdeasTab: {
            screens: {
              IdeasList: 'ideas',
              IdeaDetail: 'ideas/:ideaId',
            },
          },
          NotificationsTab: {
            screens: {
              NotificationsList: 'notifications',
            },
          },
          ProfileTab: {
            screens: {
              Profile: 'profile/:userId?',
              ProfileEdit: 'profile/edit',
            },
          },
        },
      },
      Auth: {
        screens: {
          Login: 'login',
        },
      },
    },
  },
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <NavigationContainer linking={linking}>
            <RootNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
