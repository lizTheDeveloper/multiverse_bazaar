import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProjectsStackParamList } from './types';
import { ProjectsScreen } from '../screens/projects/ProjectsScreen';
import { ProjectDetailScreen } from '../screens/projects/ProjectDetailScreen';
import { ProjectFormScreen } from '../screens/projects/ProjectFormScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<ProjectsStackParamList>();

export function ProjectsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ProjectsList"
        component={ProjectsScreen}
        options={{ title: 'Projects' }}
      />
      <Stack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{ title: 'Project' }}
      />
      <Stack.Screen
        name="ProjectForm"
        component={ProjectFormScreen}
        options={({ route }) => ({
          title: route.params?.projectId ? 'Edit Project' : 'New Project',
          presentation: 'modal',
        })}
      />
    </Stack.Navigator>
  );
}
