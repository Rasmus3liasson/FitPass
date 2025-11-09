import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'friend_request' | 'news_post' | 'friend_accepted';
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initializeNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Get the push notification token
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      this.expoPushToken = token.data;
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async scheduleLocalNotification(notificationData: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  async sendFriendRequestNotification(friendName: string, userId: string): Promise<void> {
    await this.scheduleLocalNotification({
      type: 'friend_request',
      title: '👋 New Friend Request',
      body: `${friendName} wants to be your friend!`,
      data: { userId, type: 'friend_request' },
    });
  }

  async sendFriendAcceptedNotification(friendName: string, userId: string): Promise<void> {
    await this.scheduleLocalNotification({
      type: 'friend_accepted',
      title: '🎉 Friend Request Accepted',
      body: `${friendName} accepted your friend request!`,
      data: { userId, type: 'friend_accepted' },
    });
  }

  async sendNewsPostNotification(title: string, author: string, postId: string): Promise<void> {
    await this.scheduleLocalNotification({
      type: 'news_post',
      title: '📰 New Post',
      body: `${author} posted: ${title}`,
      data: { postId, type: 'news_post' },
    });
  }

  // Setup notification listeners
  setupNotificationListeners() {
    // Handle notification received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    });

    // Handle user tapping on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Handle different notification types
      switch (data?.type) {
        case 'friend_request':
          // Navigate to friend requests
          break;
        case 'friend_accepted':
          // Navigate to friends list
          break;
        case 'news_post':
          // Navigate to news post
          break;
      }
    });

    return {
      notificationListener,
      responseListener,
    };
  }

  // Clean up listeners
  removeNotificationListeners(listeners: any) {
    if (listeners.notificationListener) {
      listeners.notificationListener.remove();
    }
    if (listeners.responseListener) {
      listeners.responseListener.remove();
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
