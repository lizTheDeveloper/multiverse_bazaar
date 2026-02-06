import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NotificationsStackParamList } from './types';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export function NotificationsStack() {
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
        name="NotificationsList"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
}
