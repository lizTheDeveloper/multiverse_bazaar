import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IdeasStackParamList } from './types';
import { IdeasScreen } from '../screens/ideas/IdeasScreen';
import { IdeaDetailScreen } from '../screens/ideas/IdeaDetailScreen';
import { IdeaFormScreen } from '../screens/ideas/IdeaFormScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<IdeasStackParamList>();

export function IdeasStack() {
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
        name="IdeasList"
        component={IdeasScreen}
        options={{ title: 'Ideas' }}
      />
      <Stack.Screen
        name="IdeaDetail"
        component={IdeaDetailScreen}
        options={{ title: 'Idea' }}
      />
      <Stack.Screen
        name="IdeaForm"
        component={IdeaFormScreen}
        options={({ route }) => ({
          title: route.params?.ideaId ? 'Edit Idea' : 'New Idea',
          presentation: 'modal',
        })}
      />
    </Stack.Navigator>
  );
}
