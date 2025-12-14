import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/integrations/supabase/supabaseClient';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'friend_request' | 'news_post' | 'friend_accepted' | 'new_message';
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initializeNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return null;
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
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
      console.log('Push notification permissions not granted');
      return null;
    }

    // Get the push notification token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.warn('Project ID not found - using getExpoPushTokenAsync without projectId');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      this.expoPushToken = token.data;
      console.log('Expo push token:', token.data);
      
      // Save token to database
      await this.savePushTokenToDatabase(token.data);
      
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async savePushTokenToDatabase(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', user.id);

      if (error) throw error;
      console.log('Push token saved to database');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  async removePushTokenFromDatabase(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ push_token: null })
        .eq('id', user.id);

      if (error) throw error;
      console.log('Push token removed from database');
    } catch (error) {
      console.error('Error removing push token:', error);
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

  async sendMessageNotification(senderName: string, messageText: string, conversationId: string): Promise<void> {
    await this.scheduleLocalNotification({
      type: 'new_message',
      title: `💬 ${senderName}`,
      body: messageText,
      data: { conversationId, type: 'new_message' },
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
        case 'new_message':
          // Navigate to conversation
          // router.push(`/messages/${data.conversationId}`);
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
