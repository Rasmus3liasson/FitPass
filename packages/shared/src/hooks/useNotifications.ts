import { notificationService } from '../services/notificationService';
import { useEffect, useRef } from 'react';

export const useNotifications = () => {
  const listenersRef = useRef<any>(null);

  useEffect(() => {
    // Initialize notifications when component mounts
    const initializeNotifications = async () => {
      const token = await notificationService.initializeNotifications();
      if (token) {
        // TODO: Send token to backend to store for user
      }
    };

    // Setup listeners
    listenersRef.current = notificationService.setupNotificationListeners();

    initializeNotifications();

    // Cleanup listeners when component unmounts
    return () => {
      if (listenersRef.current) {
        notificationService.removeNotificationListeners(listenersRef.current);
      }
    };
  }, []);

  return {
    sendFriendRequestNotification:
      notificationService.sendFriendRequestNotification.bind(notificationService),
    sendFriendAcceptedNotification:
      notificationService.sendFriendAcceptedNotification.bind(notificationService),
    sendNewsPostNotification:
      notificationService.sendNewsPostNotification.bind(notificationService),
    sendMessageNotification: notificationService.sendMessageNotification.bind(notificationService),
    getExpoPushToken: notificationService.getExpoPushToken.bind(notificationService),
  };
};
