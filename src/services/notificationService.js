// Notification Service for Push Notifications
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { db } from '../config/firebaseServices';

// Configure how notifications should be handled when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export const registerForPushNotifications = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Push notification permission not granted');
      return { success: false, error: 'Permission not granted' };
    }
    
    // Get push token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('✅ Push token:', token);
    
    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('attendance-reminders', {
        name: 'Attendance Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
      });
    }
    
    return { success: true, token };
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Save push token to user document in Firestore
 */
export const savePushToken = async (userId, token) => {
  try {
    await db.collection('users').doc(userId).update({
      pushToken: token,
      pushTokenUpdatedAt: new Date()
    });
    console.log('✅ Push token saved to Firestore');
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving push token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Schedule a local notification for attendance reminder
 */
export const scheduleAttendanceReminder = async () => {
  try {
    // Cancel any existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Schedule daily reminder at 9:00 AM
    const trigger = {
      hour: 9,
      minute: 0,
      repeats: true
    };
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Attendance Reminder',
        body: 'Don\'t forget to mark your attendance today!',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger,
    });
    
    console.log('✅ Attendance reminder scheduled for 9:00 AM daily');
    return { success: true };
  } catch (error) {
    console.error('❌ Error scheduling reminder:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send immediate notification
 */
export const sendImmediateNotification = async (title, body) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });
    
    console.log('✅ Notification sent:', title);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ All notifications cancelled');
    return { success: true };
  } catch (error) {
    console.error('❌ Error cancelling notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📋 Scheduled notifications:', notifications.length);
    return { success: true, notifications };
  } catch (error) {
    console.error('❌ Error getting scheduled notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if attendance was marked today, if not send reminder
 */
export const checkAndSendAttendanceReminder = async (userId, userName) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendanceId = `${userId}_${today}`;
    
    // Check if attendance already marked
    const attendanceDoc = await db.collection('attendance').doc(attendanceId).get();
    
    if (!attendanceDoc.exists) {
      // Send reminder
      await sendImmediateNotification(
        '⚠️ Attendance Not Marked',
        `Hi ${userName}, you haven't marked your attendance yet today!`
      );
      return { success: true, reminderSent: true };
    }
    
    return { success: true, reminderSent: false };
  } catch (error) {
    console.error('❌ Error checking attendance:', error);
    return { success: false, error: error.message };
  }
};

export const notificationService = {
  registerForPushNotifications,
  savePushToken,
  scheduleAttendanceReminder,
  sendImmediateNotification,
  cancelAllNotifications,
  getScheduledNotifications,
  checkAndSendAttendanceReminder
};

export default notificationService;
