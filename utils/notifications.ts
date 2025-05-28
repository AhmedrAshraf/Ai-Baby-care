import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Reminder } from '@/contexts/ReminderContext';

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function scheduleReminderNotification(reminder: Reminder) {
  const trigger = new Date(reminder.time);
  
  // If the time is in the past, don't schedule
  if (trigger.getTime() <= Date.now()) {
    return null;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.body,
      data: { reminderId: reminder.id },
      sound: true,
    },
    trigger,
  });

  return notificationId;
}

export async function cancelScheduledNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function rescheduleNotification(reminder: Reminder) {
  // For repeating reminders, schedule the next occurrence
  if (reminder.repeat === 'daily') {
    const tomorrow = new Date(reminder.time);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { reminderId: reminder.id },
        sound: true,
      },
      trigger: {
        date: tomorrow,
        repeats: true,
      },
    });
    
    return notificationId;
  } else if (reminder.repeat === 'weekly') {
    const nextWeek = new Date(reminder.time);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { reminderId: reminder.id },
        sound: true,
      },
      trigger: {
        date: nextWeek,
        repeats: true,
      },
    });
    
    return notificationId;
  }
  
  return null;
} 