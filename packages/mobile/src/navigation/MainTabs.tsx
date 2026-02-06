import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { MainTabParamList } from './types';
import { ProjectsStack } from './ProjectsStack';
import { IdeasStack } from './IdeasStack';
import { NotificationsStack } from './NotificationsStack';
import { ProfileStack } from './ProfileStack';
import { colors, spacing } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabIconProps {
  label: string;
  focused: boolean;
  badge?: number;
}

function TabIcon({ label, focused, badge }: TabIconProps) {
  const icons: Record<string, string> = {
    Projects: '📦',
    Ideas: '💡',
    Notifications: '🔔',
    Profile: '👤',
  };

  return (
    <View style={styles.iconContainer}>
      <Text style={styles.icon}>{icons[label]}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingTop: spacing.xs,
          paddingBottom: spacing.xs,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectsStack}
        options={{
          title: 'Projects',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Projects" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="IdeasTab"
        component={IdeasStack}
        options={{
          title: 'Ideas',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Ideas" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsStack}
        options={{
          title: 'Notifications',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Notifications" focused={focused} badge={0} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  icon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
});
