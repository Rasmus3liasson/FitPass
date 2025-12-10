import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

interface PushNotificationPayload {
  pushToken: string;
  title: string;
  body: string;
  data?: any;
}

export async function sendPushNotification(payload: PushNotificationPayload): Promise<void> {
  const { pushToken, title, body, data } = payload;

  // Check that the push token is valid
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  // Create the message
  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
  };

  try {
    const ticketChunk = await expo.sendPushNotificationsAsync([message]);
    console.log('Push notification sent:', ticketChunk);
    
    // Check for errors
    for (const ticket of ticketChunk) {
      if (ticket.status === 'error') {
        console.error('Error sending push notification:', ticket.message);
        if (ticket.details?.error === 'DeviceNotRegistered') {
          // Token is invalid, should remove from database
          console.log('Device not registered, token should be removed');
        }
      }
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

export async function sendBatchPushNotifications(
  notifications: PushNotificationPayload[]
): Promise<void> {
  const messages: ExpoPushMessage[] = notifications
    .filter(n => Expo.isExpoPushToken(n.pushToken))
    .map(n => ({
      to: n.pushToken,
      sound: 'default',
      title: n.title,
      body: n.body,
      data: n.data,
      priority: 'high',
    }));

  // Expo recommends batching notifications
  const chunks = expo.chunkPushNotifications(messages);

  try {
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log('Batch push notifications sent:', ticketChunk.length);
      
      // Check for errors
      for (const ticket of ticketChunk) {
        if (ticket.status === 'error') {
          console.error('Error in batch notification:', ticket.message);
        }
      }
    }
  } catch (error) {
    console.error('Error sending batch push notifications:', error);
  }
}
