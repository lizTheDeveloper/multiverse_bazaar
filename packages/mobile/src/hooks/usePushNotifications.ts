import { useEffect, useRef, useCallback } from 'react';
import { useNavigation, CommonActions } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  sendPushTokenToServer,
  removePushTokenFromServer,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getNotificationData,
  setupAndroidNotificationChannel,
  NotificationData,
} from '../lib/pushNotifications';
import { useAuth } from './useAuth';

export function usePushNotifications() {
  const navigation = useNavigation();
  const { isAuthenticated, isGuest } = useAuth();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const navigateToContent = useCallback(
    (data: NotificationData) => {
      if (data.projectId) {
        navigation.dispatch(
          CommonActions.navigate({
            name: 'ProjectsTab',
            params: {
              screen: 'ProjectDetail',
              params: { projectId: data.projectId },
            },
          })
        );
      } else if (data.ideaId) {
        navigation.dispatch(
          CommonActions.navigate({
            name: 'IdeasTab',
            params: {
              screen: 'IdeaDetail',
              params: { ideaId: data.ideaId },
            },
          })
        );
      } else if (data.userId) {
        navigation.dispatch(
          CommonActions.navigate({
            name: 'ProfileTab',
            params: {
              screen: 'Profile',
              params: { userId: data.userId },
            },
          })
        );
      } else {
        // Default: navigate to notifications screen
        navigation.dispatch(
          CommonActions.navigate({
            name: 'NotificationsTab',
          })
        );
      }
    },
    [navigation]
  );

  useEffect(() => {
    // Set up Android notification channel
    setupAndroidNotificationChannel();

    // Register for push notifications when authenticated
    if (isAuthenticated && !isGuest) {
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          sendPushTokenToServer(token);
        }
      });
    }

    // Listen for notifications received while app is in foreground
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification.request.content);
    });

    // Listen for user tapping on notification
    responseListener.current = addNotificationResponseReceivedListener((response) => {
      const data = getNotificationData(response);
      if (data) {
        navigateToContent(data);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, isGuest, navigateToContent]);

  // Function to manually trigger registration (e.g., after login)
  const registerPushNotifications = useCallback(async () => {
    if (isGuest) return null;

    const token = await registerForPushNotificationsAsync();
    if (token) {
      await sendPushTokenToServer(token);
    }
    return token;
  }, [isGuest]);

  // Function to unregister (e.g., on logout)
  const unregisterPushNotifications = useCallback(async () => {
    await removePushTokenFromServer();
  }, []);

  return {
    registerPushNotifications,
    unregisterPushNotifications,
  };
}
